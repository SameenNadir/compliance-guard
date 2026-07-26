# Enterprise Code Compliance Scanner

A local Python script that turns a SOC 2 / ISO 27001-style compliance document
into a queryable vector database, then audits developer code snippets against
those rules using Google Gemini.

**Pipeline:**
1. Load a `.txt` or `.pdf` compliance document (LangChain loaders).
2. Chunk it with `RecursiveCharacterTextSplitter` (512 tokens, 50 overlap).
3. Embed chunks with Google `text-embedding-004` via the modern `google-genai` SDK.
4. Upsert vectors to Pinecone with **strict `tenant_id` metadata tagging** for multi-tenancy isolation.
5. Embed a code snippet, query Pinecone with a **strict metadata filter** `{"tenant_id": "company_a"}`.
6. Pass retrieved rules + code to Gemini to generate a structured security audit report.

---

## Step-by-step local setup

### 1. Prerequisites
- Python 3.10 or newer (`python --version`)
- A Google AI Studio API key (free): https://aistudio.google.com/app/apikey
- A Pinecone account (free tier is fine): https://app.pinecone.io

### 2. Create and activate a virtual environment
```bash
# from the project directory
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and fill in your real keys:
- `GOOGLE_API_KEY`        - from Google AI Studio
- `PINECONE_API_KEY`      - from Pinecone console
- `PINECONE_INDEX_NAME`   - e.g. `compliance-rules` (the script will create it for you)
- `TENANT_ID`             - leave as `company_a` for the demo

> The `.env` file is loaded automatically via `python-dotenv`. Never commit it.

### 5. Run the full pipeline (load, chunk, embed, upsert, audit)
```bash
python compliance_scanner.py
```
This will:
- Load `sample_compliance_rules.txt`
- Chunk + embed it with `text-embedding-004`
- Create the Pinecone index if it doesn't exist
- Upsert every chunk with `metadata = {"tenant_id": "company_a", ...}`
- Run an audit against the built-in vulnerable sample code

### 6. Run audit-only (skip the upload, reuse the populated index)
```bash
python compliance_scanner.py --audit
```

---

## Project layout
```
.
├── compliance_scanner.py          # main script - all 6 pipeline stages
├── sample_compliance_rules.txt    # simulated SOC 2 / ISO 27001 rules
├── requirements.txt               # modern package names
├── .env.example                   # template for your secrets
└── README.md                      # this file
```

---

## Multi-tenancy isolation (critical design)

Every uploaded vector carries:
```python
metadata = {"tenant_id": "company_a", "chunk_index": i, "text": <rule>}
```
and is written into the Pinecone namespace `company_a`.

Every query is forced through:
```python
filter={"tenant_id": "company_a"}, namespace="company_a"
```
so a tenant can never retrieve another tenant's rules. The filter is applied
inside `retrieve_compliance_rules()` and is non-optional - remove it and the
audit step will refuse to run correctly.

---

## Using your own compliance document
Replace `sample_compliance_rules.txt` with your own `.txt` or `.pdf`, then:
```bash
python compliance_scanner.py --doc path/to/your_rules.pdf
```

## Using your own code snippet
Edit `SAMPLE_VULNERABLE_CODE` near the bottom of `compliance_scanner.py`, or
refactor `run_audit_only()` to accept code via stdin / a file argument.

---

## Troubleshooting
- **`Missing required environment variable: GOOGLE_API_KEY`** - you forgot to
  fill in `.env`, or `python-dotenv` didn't find it. Run from the project root.
- **Pinecone index not found / dimension mismatch** - make sure the index
  dimension matches `text-embedding-004` (768). The script creates the index
  automatically if it's missing.
- **Quota errors from Google** - the embed step retries transient errors with
  exponential backoff; persistent 429s mean you need to wait or enable billing.
