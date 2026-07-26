import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
from dotenv import load_dotenv  # <-- ADD THIS

# Load the environment variables BEFORE anything else runs
load_dotenv()  # <-- ADD THIS

# Import your working pipeline functions from compliance_scanner.py
from compliance_scanner import (
    Config,
    load_compliance_document,
    chunk_documents,
    embed_texts,
    embed_single_text,
    get_pinecone_index,
    upsert_vectors,
    retrieve_compliance_rules,
    generate_audit_report,
    genai
)

app = FastAPI(title="ComplianceGuard Core API")
# ... the rest of the file stays exactly the same

# Enable CORS so the React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cfg = Config()
genai_client = genai.Client(api_key=cfg.google_api_key)

class AuditRequest(BaseModel):
    code_snippet: str
    tenant_id: str

@app.post("/api/upload-rules")
async def upload_rules(tenant_id: str = Form(...), file: UploadFile = File(...)):
    """Handles parsing, embedding, and upserting a new rulebook per tenant."""
    try:
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, file.filename)
        
        with open(temp_path, "wb") as f:
            f.write(await file.read())
            
        cfg.tenant_id = tenant_id
        
        documents = load_compliance_document(temp_path)
        chunks = chunk_documents(documents, cfg)
        vectors = embed_texts(genai_client, chunks, cfg)
        
        index = get_pinecone_index(cfg)
        upsert_vectors(index, chunks, vectors, cfg)
        
        os.remove(temp_path)
        return {"status": "success", "message": f"Ingested {len(chunks)} chunks for {tenant_id}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audit")
async def run_audit(request: AuditRequest):
    """Performs isolated vector search and generates the compliance audit."""
    try:
        cfg.tenant_id = request.tenant_id
        index = get_pinecone_index(cfg)
        
        query_vector = embed_single_text(genai_client, request.code_snippet, cfg)
        rules = retrieve_compliance_rules(index, query_vector, cfg, top_k=5)
        
        if not rules:
            return {"status": "success", "raw_report": "No matching rules found for this tenant.", "context_rules_used": []}
            
        report_markdown = generate_audit_report(genai_client, request.code_snippet, rules, cfg)
        
        return {
            "status": "success",
            "tenant_id": request.tenant_id,
            "raw_report": report_markdown,
            "context_rules_used": [r["text"] for r in rules]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)