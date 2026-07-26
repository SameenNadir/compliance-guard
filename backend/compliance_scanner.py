"""
Enterprise Code Compliance Scanner - Local Core Logic
=====================================================

Pipeline:
  1. Load a local compliance document (.txt or .pdf) with a LangChain loader.
  2. Chunk it with RecursiveCharacterTextSplitter (512 tokens, 50 overlap).
  3. Embed the chunks with Google's text-embedding-004 via the google-genai SDK.
  4. Upload vectors to Pinecone with STRICT tenant_id metadata tagging.
  5. Query Pinecone with a code snippet using a STRICT metadata filter.
  6. Pass retrieved rules + the code to Gemini to produce a security audit report.

Run:
    python compliance_scanner.py            # full pipeline: load -> embed -> upsert -> audit
    python compliance_scanner.py --audit    # audit-only (assumes index already populated)
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# --- LangChain: document loaders + text splitter -----------------------------
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- Google GenAI modern SDK -------------------------------------------------
from google import genai
from google.genai import types
from google.genai import errors as google_genai_errors

# --- Pinecone modern unified client ------------------------------------------
from pinecone import Pinecone, ServerlessSpec


# =============================================================================
# Logging
# =============================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("compliance-scanner")


# =============================================================================
# Configuration (all secrets come from environment variables, never hardcoded)
# =============================================================================
class Config:
    """Holds configuration loaded from environment variables."""

    def __init__(self) -> None:
        # Required values - fail fast if missing.
        self.google_api_key: str = self._require("GOOGLE_API_KEY")
        self.pinecone_api_key: str = self._require("PINECONE_API_KEY")

        # Optional values with sensible defaults.
        self.pinecone_index_name: str = os.getenv("PINECONE_INDEX_NAME", "compliance-rules")
        self.tenant_id: str = os.getenv("TENANT_ID", "company_a")
        # FIX: text-embedding-004 is deprecated/discontinued on the current API
        # version and 404s even when called correctly. Google's supported
        # replacement is gemini-embedding-001, so that's the default now.
        self.embedding_model: str = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
        # FIX: gemini-2.0-flash has zero free-tier quota on newer API keys
        # (Google's Dec 2025 free-tier revamp only allocates quota to the
        # 2.5-series models). Default to gemini-2.5-flash instead.
        self.gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

        # text-embedding-004 produces 768-dimensional vectors.
        self.embedding_dimensions: int = 768

        # Chunking parameters (token-aware via the splitter's chunk sizing).
        self.chunk_size_tokens: int = 512
        self.chunk_overlap_tokens: int = 50

        # Pinecone serverless deployment (free-tier compatible).
        self.pinecone_cloud: str = "aws"
        self.pinecone_region: str = "us-east-1"

    @staticmethod
    def _require(key: str) -> str:
        """Read a required env var; exit with a clear message if missing."""
        value = os.getenv(key)
        if not value or value.startswith("your_"):
            log.error("Missing required environment variable: %s", key)
            log.error("Copy .env.example to .env and fill in real values.")
            sys.exit(1)
        return value


# =============================================================================
# Stage 1 - Load the compliance document
# =============================================================================
def load_compliance_document(file_path: str) -> list[Any]:
    """
    Load a .txt or .pdf compliance document using a LangChain loader.
    Returns a list of LangChain Document objects, each with .page_content
    and .metadata.
    """
    path = Path(file_path)
    if not path.exists():
        log.error("Compliance document not found: %s", file_path)
        sys.exit(1)

    suffix = path.suffix.lower()
    log.info("Loading compliance document: %s (%s)", file_path, suffix)

    try:
        if suffix == ".pdf":
            loader = PyPDFLoader(str(path))
        elif suffix in (".txt", ".md", ".text"):
            loader = TextLoader(str(path), encoding="utf-8")
        else:
            log.error("Unsupported file type: %s (use .txt or .pdf)", suffix)
            sys.exit(1)

        documents = loader.load()
    except Exception as exc:
        log.error("Failed to load document: %s", exc)
        sys.exit(1)

    total_chars = sum(len(d.page_content) for d in documents)
    log.info("Loaded %d document(s), %d total characters", len(documents), total_chars)
    return documents


# =============================================================================
# Stage 2 - Chunk the document into logical segments
# =============================================================================
def chunk_documents(documents: list[Any], cfg: Config) -> list[str]:
    """
    Split the loaded documents into overlapping chunks using
    RecursiveCharacterTextSplitter. We approximate the 512-token / 50-overlap
    target with a character-based heuristic (~4 chars/token) so chunking does
    not require a live tokenizer, while still keeping segments logical.
    """
    chars_per_token = 4  # standard approximation for English text
    chunk_size = cfg.chunk_size_tokens * chars_per_token
    chunk_overlap = cfg.chunk_overlap_tokens * chars_per_token

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        # Split on paragraph / sentence boundaries first, then words, then chars.
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    chunks = splitter.split_documents(documents)
    chunk_texts = [c.page_content.strip() for c in chunks if c.page_content.strip()]

    log.info(
        "Chunked into %d segments (target %d tokens, %d overlap)",
        len(chunk_texts),
        cfg.chunk_size_tokens,
        cfg.chunk_overlap_tokens,
    )
    return chunk_texts


# =============================================================================
# Stage 3 - Generate embeddings with google-genai (text-embedding-004)
# =============================================================================
def embed_texts(client: genai.Client, texts: list[str], cfg: Config) -> list[list[float]]:
    """
    Embed every chunk with Google's text-embedding-004 model via the modern
    google-genai client. Batches the request (the API caps batch size) and
    retries transient errors with simple backoff.
    """
    if not texts:
        log.error("No text to embed")
        sys.exit(1)

    # The API accepts batches; 100 is a safe upper bound for text-embedding-004.
    batch_size = 100
    all_vectors: list[list[float]] = []

    for start in range(0, len(texts), batch_size):
        batch = texts[start : start + batch_size]
        attempt = 0
        while True:
            attempt += 1
            try:
                result = client.models.embed_content(
                    model=cfg.embedding_model,
                    contents=batch,
                    config=types.EmbedContentConfig(output_dimensionality=cfg.embedding_dimensions),
                )
                # result.embeddings is a list of ContentEmbedding; .values holds the vector.
                vectors = [list(e.values) for e in result.embeddings]
                all_vectors.extend(vectors)
                log.info(
                    "Embedded batch %d/%d (%d vectors)",
                    start // batch_size + 1,
                    (len(texts) + batch_size - 1) // batch_size,
                    len(vectors),
                )
                break
            except google_genai_errors.ClientError as exc:
                if attempt >= 3:
                    log.error("Embedding batch failed after %d attempts: %s", attempt, exc)
                    sys.exit(1)
                wait = 2 ** attempt
                log.warning("Embedding error (attempt %d), retrying in %ds: %s", attempt, wait, exc)
                time.sleep(wait)
            except Exception as exc:
                log.error("Unexpected embedding error: %s", exc)
                sys.exit(1)

    log.info("Generated %d embedding vectors (dim=%d)", len(all_vectors), len(all_vectors[0]))
    return all_vectors


def embed_single_text(client: genai.Client, text: str, cfg: Config) -> list[float]:
    """Embed a single text (used for the code-snippet query)."""
    try:
        # FIX (Step 2): the `model` argument was missing here, which made the
        # SDK fall back to an invalid default model and trigger the 404.
        # Also pass the same output_dimensionality config used elsewhere so
        # the query vector's dimension matches the vectors stored in Pinecone.
        result = client.models.embed_content(
            model=cfg.embedding_model,
            contents=[text],
            config=types.EmbedContentConfig(output_dimensionality=cfg.embedding_dimensions),
        )
        return list(result.embeddings[0].values)
    except Exception as exc:
        log.error("Failed to embed query text: %s", exc)
        sys.exit(1)


# =============================================================================
# Stage 4 - Connect to Pinecone and upload vectors with tenant metadata
# =============================================================================
def get_pinecone_index(cfg: Config) -> Any:
    """
    Connect to Pinecone with the modern unified client and return a handle
    to the target index, creating it if it does not yet exist.
    """
    try:
        pc = Pinecone(api_key=cfg.pinecone_api_key)
    except Exception as exc:
        log.error("Failed to initialize Pinecone client: %s", exc)
        sys.exit(1)

    try:
        existing = [i.name for i in pc.list_indexes()]
    except Exception:
        existing = [i.name for i in pc.list_indexes().indexes] if pc.list_indexes().indexes else []

    if cfg.pinecone_index_name not in existing:
        log.info("Creating Pinecone index '%s' (dim=%d, cosine, serverless)...",
                 cfg.pinecone_index_name, cfg.embedding_dimensions)
        try:
            pc.create_index(
                name=cfg.pinecone_index_name,
                dimension=cfg.embedding_dimensions,
                metric="cosine",
                spec=ServerlessSpec(cloud=cfg.pinecone_cloud, region=cfg.pinecone_region),
            )
        except Exception as exc:
            log.error("Failed to create Pinecone index: %s", exc)
            sys.exit(1)
        # Give the serverless index a moment to become ready.
        time.sleep(5)
    else:
        log.info("Pinecone index '%s' already exists", cfg.pinecone_index_name)

    return pc.Index(cfg.pinecone_index_name)


def upsert_vectors(
    index: Any,
    texts: list[str],
    vectors: list[list[float]],
    cfg: Config,
) -> None:
    """
    Upload vectors to Pinecone. CRITICAL: every vector is tagged with a
    metadata dict containing {"tenant_id": cfg.tenant_id} to enforce
    multi-tenancy isolation at query time.
    """
    if len(texts) != len(vectors):
        log.error("Mismatch: %d texts vs %d vectors", len(texts), len(vectors))
        sys.exit(1)

    # We use the tenant_id as the Pinecone namespace too, which adds a second
    # layer of isolation on top of the metadata filter.
    namespace = cfg.tenant_id

    records = []
    for i, (text, vector) in enumerate(zip(texts, vectors)):
        records.append(
            {
                "id": f"{cfg.tenant_id}-chunk-{i:04d}",
                "values": vector,
                # STRICT metadata tagging for multi-tenancy isolation.
                "metadata": {
                    "tenant_id": cfg.tenant_id,
                    "chunk_index": i,
                    # Store the rule text so we can return it directly from
                    # query results without a second lookup.
                    "text": text,
                },
            }
        )

    # Upsert in batches of 100 (Pinecone recommended batch size).
    batch_size = 100
    try:
        for start in range(0, len(records), batch_size):
            batch = records[start : start + batch_size]
            index.upsert(vectors=batch, namespace=namespace)
            log.info(
                "Upserted batch %d/%d into namespace '%s'",
                start // batch_size + 1,
                (len(records) + batch_size - 1) // batch_size,
                namespace,
            )
    except Exception as exc:
        log.error("Pinecone upsert failed: %s", exc)
        sys.exit(1)

    log.info("Uploaded %d vectors with tenant_id='%s' metadata", len(records), cfg.tenant_id)


# =============================================================================
# Stage 5 + 6 - Query with strict tenant filter, then generate audit report
# =============================================================================
def retrieve_compliance_rules(
    index: Any,
    query_vector: list[float],
    cfg: Config,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """
    Query Pinecone for the compliance rules most similar to the embedded code
    snippet, using a STRICT metadata filter so only this tenant's rules are
    ever returned. This is the core of the multi-tenancy isolation guarantee.
    """
    try:
        response = index.query(
            vector=query_vector,
            top_k=top_k,
            # STRICT metadata filter - never query without this.
            filter={"tenant_id": cfg.tenant_id},
            namespace=cfg.tenant_id,
            include_metadata=True,
        )
    except Exception as exc:
        log.error("Pinecone query failed: %s", exc)
        sys.exit(1)

    matches = response.matches or []
    rules = []
    for m in matches:
        meta = m.metadata or {}
        rules.append(
            {
                "score": float(m.score),
                "text": meta.get("text", ""),
                "chunk_index": meta.get("chunk_index"),
                "tenant_id": meta.get("tenant_id"),
            }
        )

    log.info("Retrieved %d compliance rules (tenant_id=%s filter enforced)", len(rules), cfg.tenant_id)
    return rules


def generate_audit_report(
    client: genai.Client,
    code_snippet: str,
    rules: list[dict[str, Any]],
    cfg: Config,
) -> str:
    """
    Pass the retrieved compliance rules and the developer's code snippet to
    Gemini and ask for a clean, structured security audit report.
    """
    if not rules:
        return "No matching compliance rules were retrieved for this tenant. Cannot produce an audit."

    # Build a readable rules block for the prompt.
    rules_block = "\n\n".join(
        f"[Rule {i + 1}] (similarity={r['score']:.3f})\n{r['text']}"
        for i, r in enumerate(rules)
    )

    prompt = f"""You are a Senior Security Compliance Auditor.

Below are the compliance rules (retrieved from the tenant's private rulebook)
that are most relevant to the submitted code snippet, followed by the code
itself. Produce a clean, professional security audit report.

COMPLIANCE RULES (tenant_id={cfg.tenant_id}):
{rules_block}

DEVELOPER CODE SNIPPET:
```python
{code_snippet}
```

Produce the report in this exact format:

## Security Audit Report

### Summary
(One short paragraph: overall compliance posture.)

### Findings
(For each violation, include:)
- Severity: Critical | High | Medium | Low
- Rule Violated: (quote the rule)
- Location: (line or code fragment)
- Explanation: (why this violates the rule)
- Remediation: (concrete fix)

### Recommendations
(Bulleted next steps.)

If no violations are found, say so explicitly and praise what was done well.
Only reference the rules provided above. Do not invent rules.
"""

    attempt = 0
    max_attempts = 3
    while True:
        attempt += 1
        try:
            response = client.models.generate_content(
                model=cfg.gemini_model,
                contents=prompt,
            )
            return response.text.strip()
        except google_genai_errors.ClientError as exc:
            is_rate_limit = "RESOURCE_EXHAUSTED" in str(exc) or "429" in str(exc)
            if not is_rate_limit or attempt >= max_attempts:
                log.error("Gemini audit generation failed: %s", exc)
                sys.exit(1)
            wait = 2 ** attempt
            log.warning(
                "Gemini rate limit hit (attempt %d/%d), retrying in %ds: %s",
                attempt, max_attempts, wait, exc,
            )
            time.sleep(wait)
        except Exception as exc:
            log.error("Gemini audit generation failed: %s", exc)
            sys.exit(1)


# =============================================================================
# Sample vulnerable code snippet (used for the demo query)
# =============================================================================
SAMPLE_VULNERABLE_CODE = '''import os
import psycopg2

# Database credentials hardcoded directly in source - BAD PRACTICE
DB_HOST = "10.0.0.5"
DB_USER = "admin"
DB_PASSWORD = "SuperSecret123!"   # hardcoded secret
DB_NAME = "production_db"

def get_user(user_id):
    # String-concatenated SQL - vulnerable to injection
    query = "SELECT * FROM users WHERE id = " + user_id
    conn = psycopg2.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME
    )
    cur = conn.cursor()
    cur.execute(query)
    return cur.fetchall()

def run_shell(cmd):
    # shell=True with user input - command injection risk
    os.system(cmd)
'''


# =============================================================================
# Orchestrator
# =============================================================================
def run_full_pipeline(cfg: Config, doc_path: str) -> None:
    """Stages 1-4: load, chunk, embed, upsert."""
    # 1. Load
    documents = load_compliance_document(doc_path)

    # 2. Chunk
    chunks = chunk_documents(documents, cfg)

    # 3. Embed
    genai_client = genai.Client(api_key=cfg.google_api_key)
    vectors = embed_texts(genai_client, chunks, cfg)

    # 4. Upsert with strict tenant metadata
    index = get_pinecone_index(cfg)
    upsert_vectors(index, chunks, vectors, cfg)

    # 5 + 6. Query + audit on the sample code
    run_audit_only(cfg)


def run_audit_only(cfg: Config) -> None:
    """Stages 5-6: embed the code snippet, query with tenant filter, audit."""
    genai_client = genai.Client(api_key=cfg.google_api_key)
    index = get_pinecone_index(cfg)

    log.info("Embedding sample code snippet for compliance query...")
    query_vector = embed_single_text(genai_client, SAMPLE_VULNERABLE_CODE, cfg)

    rules = retrieve_compliance_rules(index, query_vector, cfg, top_k=5)

    print("\n" + "=" * 78)
    print("SAMPLE VULNERABLE CODE SUBMITTED FOR AUDIT")
    print("=" * 78)
    print(SAMPLE_VULNERABLE_CODE)

    print("=" * 78)
    print("GEMINI SECURITY AUDIT REPORT")
    print("=" * 78)
    report = generate_audit_report(genai_client, SAMPLE_VULNERABLE_CODE, rules, cfg)
    print(report)
    print("=" * 78 + "\n")


# =============================================================================
# Entry point
# =============================================================================
def main() -> None:
    # Load .env BEFORE constructing Config so env vars are present.
    load_dotenv()

    parser = argparse.ArgumentParser(description="Enterprise Code Compliance Scanner")
    parser.add_argument(
        "--doc",
        default="sample_compliance_rules.txt",
        help="Path to the compliance document (.txt or .pdf)",
    )
    parser.add_argument(
        "--audit",
        action="store_true",
        help="Skip loading/embedding/upserting and only run the audit query.",
    )
    args = parser.parse_args()

    cfg = Config()

    if args.audit:
        log.info("Running in AUDIT-ONLY mode (index assumed populated)")
        run_audit_only(cfg)
    else:
        log.info("Running FULL pipeline: load -> chunk -> embed -> upsert -> audit")
        run_full_pipeline(cfg, args.doc)


if __name__ == "__main__":
    main()
