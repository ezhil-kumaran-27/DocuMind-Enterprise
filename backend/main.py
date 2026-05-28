import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load env before other imports if they rely on it at module level
load_dotenv()

from core.ingestion import process_and_ingest_pdf
from core.retrieval import ask_question_stream

app = FastAPI(title="DocuMind Enterprise API", version="1.0.0")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str
    history: List[Dict[str, str]] = [] # [{"role": "user", "content": "..."}]

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "DocuMind Enterprise Backend"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
         raise HTTPException(status_code=400, detail="Only PDF files are supported.")
         
    # Save uploaded file to temp file to process
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            
        # Process the file
        result = process_and_ingest_pdf(tmp_path, file.filename)
        
        # Clean up temp file
        os.remove(tmp_path)
        
        if result["status"] == "error":
             raise HTTPException(status_code=500, detail=result["message"])
             
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/ask")
async def ask_question(request: AskRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    async def event_generator():
        try:
            # Yield chunks as they come from the streaming generator
            async for chunk in ask_question_stream(request.question, request.history):
                # Format as Server-Sent Events (SSE)
                # Ensure newlines in chunk are properly handled for SSE or simple stream
                # For simplicity in many react apps, yielding plain text or JSON lines works.
                # Here we just stream plain text and let the frontend append it.
                yield chunk
        except Exception as e:
            # If error occurs mid-stream, we might append an error message
            yield f"\n\n[Error]: {str(e)}"
            
    return StreamingResponse(event_generator(), media_type="text/plain")
