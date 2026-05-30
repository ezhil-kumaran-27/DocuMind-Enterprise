import os
from typing import List, Dict
import pypdf
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
from pinecone import Pinecone
import tempfile
import uuid

# Load Environment Variables
# In production, we would use python-dotenv here, but we will ensure it's loaded in main.py
def init_pinecone():
    api_key = os.environ.get("PINECONE_API_KEY")
    if not api_key:
        raise ValueError("PINECONE_API_KEY environment variable is not set.")
    return Pinecone(api_key=api_key)

def process_and_ingest_pdf(file_path: str, filename: str) -> Dict:
    """
    Reads a PDF, extracts text and metadata, chunks it, generates embeddings,
    and stores them in Pinecone.
    """
    print(f"Processing {filename}...")
    
    # 1. Extract text and elements using pypdf
    documents = []
    with open(file_path, "rb") as f:
        reader = pypdf.PdfReader(f)
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                documents.append({
                    "text": text,
                    "metadata": {
                        "source_document": filename,
                        "page_number": i + 1
                    }
                })
            
    if not documents:
         return {"status": "error", "message": "No text found in PDF"}

    # Group texts by page to preserve logical structure initially
    page_texts = {}
    for doc in documents:
        pn = doc["metadata"]["page_number"]
        if pn not in page_texts:
            page_texts[pn] = []
        page_texts[pn].append(doc["text"])

    # 2. Chunk text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    docs = []
    for page_num, texts in page_texts.items():
        full_page_text = "\n".join(texts)
        page_chunks = text_splitter.split_text(full_page_text)
        for chunk in page_chunks:
            docs.append(Document(
                page_content=chunk,
                metadata={
                    "source_document": filename,
                    "page_number": page_num
                }
            ))
            
    print(f"Created {len(docs)} chunks from {filename}.")
    
    # 3. Generate Embeddings & 4. Upsert to Pinecone
    try:
        index_name = os.environ.get("PINECONE_INDEX_NAME", "documind-index")
        hf_token = os.environ.get("HF_TOKEN")
        if not hf_token:
            raise ValueError("HF_TOKEN environment variable is not set.")
        embeddings_model = HuggingFaceInferenceAPIEmbeddings(
            api_key=hf_token,
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Clear the old database so it only remembers the new document
        print("Clearing old memory...")
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        index = pc.Index(index_name)
        try:
            index.delete(delete_all=True)
        except Exception as e:
            print("Warning: Could not clear index (might be empty already).", e)
        
        # Use LangChain's official method to format and upload correctly
        PineconeVectorStore.from_documents(
            docs,
            embeddings_model,
            index_name=index_name
        )
            
        print(f"Successfully ingested {len(docs)} chunks into Pinecone.")
        return {"status": "success", "chunks_processed": len(docs), "message": "Document uploaded and indexed successfully"}
        
    except Exception as e:
        print(f"Error during embedding/upsert: {str(e)}")
        return {"status": "error", "message": str(e)}
