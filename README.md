# DocuMind Enterprise 🧠📄

An Enterprise-Grade RAG (Retrieval-Augmented Generation) AI Assistant that answers questions strictly from uploaded company documents with accurate citations and hallucination prevention.

---

# 🚀 Project Overview

DocuMind Enterprise is a Context-Aware Corporate Brain designed to help employees quickly find answers from large internal documents such as:

* SOPs
* HR Policies
* Company Guidelines
* Compliance Documents
* Legal PDFs

Instead of manually searching hundreds of pages, users can upload documents and ask questions in natural language.

The AI retrieves relevant content from the uploaded documents and generates accurate responses with source citations.

---

# ✨ Features

✅ Upload and process PDF documents
✅ AI-powered question answering
✅ Context-only responses
✅ Hallucination prevention
✅ Source citations with page numbers
✅ Conversational memory
✅ Real-time streaming responses
✅ Hybrid Search (Semantic + Keyword)
✅ Parent Document Retrieval
✅ FastAPI backend
✅ Modern frontend UI
✅ Production-style architecture

---

# 🧠 How It Works

```text
PDF Upload
    ↓
Document Parsing
    ↓
Text Chunking
    ↓
Embedding Generation
    ↓
Store Vectors in Pinecone
    ↓
User Question
    ↓
Relevant Chunk Retrieval
    ↓
OpenAI LLM Response
    ↓
Answer + Citations
```

---

# 🛠️ Tech Stack

## Frontend

* React.js / Next.js
* Tailwind CSS
* TypeScript

## Backend

* Python
* FastAPI
* LangChain

## AI & RAG

* OpenAI GPT Models
* OpenAI Embeddings
* Pinecone Vector Database

## Document Processing

* Unstructured.io
* RecursiveCharacterTextSplitter

---

# 📂 Project Structure

```bash
documind-enterprise/
│
├── backend/
│   ├── api/
│   ├── rag/
│   ├── services/
│   ├── utils/
│   ├── models/
│   └── main.py
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── styles/
│
├── uploads/
├── tests/
├── requirements.txt
├── .env
└── README.md
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/your-username/documind-enterprise.git
cd documind-enterprise
```

---

## 2. Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Mac/Linux

```bash
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend folder.

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX_NAME=documind-index
```

---

# ▶️ Running the Backend

```bash
uvicorn main:app --reload
```

Backend runs at:

```bash
http://127.0.0.1:8000
```

---

# 💻 Running the Frontend

```bash
npm install
npm run dev
```

Frontend runs at:

```bash
http://localhost:3000
```

---

# 📌 API Endpoints

## Upload PDF

```http
POST /upload
```

Uploads PDF documents to the system.

---

## Ask Question

```http
POST /ask
```

Ask questions from uploaded documents.

---

## Health Check

```http
GET /health
```

Checks API status.

---

# 🧾 Example Response

```json
{
  "answer": "Employees can apply for leave using the HR portal.",
  "sources": [
    {
      "document": "HR_POLICY.pdf",
      "page": 12
    }
  ]
}
```

---

# 🛡️ Hallucination Prevention

If information is unavailable in uploaded documents, the AI responds with:

```text
"I don't know. This information is outside my scope based on the uploaded documents."
```

This ensures trustworthy and context-aware responses.

---

# 📊 Advanced RAG Features

* Hybrid Search
* Parent Document Retrieval
* Conversational Memory
* Streaming Responses
* Citation Tracking
* Context-Aware Retrieval

---

# 🧪 Testing

Test Cases Included:

✅ Valid document questions
✅ Invalid questions
✅ Out-of-scope questions
✅ Citation verification
✅ Follow-up conversations

---

# 🎯 Future Improvements

* Multi-document chat
* OCR support
* Role-based authentication
* Admin dashboard
* Voice assistant
* Document summarization
* Analytics dashboard

---

# 📚 Learning Outcomes

Through this project, you will learn:

* RAG Architecture
* LangChain Pipelines
* Vector Databases
* Semantic Search
* FastAPI Development
* AI System Design
* LLM Integration
* Streaming APIs
* Production-Level AI Engineering

---

# 👨‍💻 Author

Ezhil Kumaran

Artificial Intelligence & Data Science Student

---

# ⭐ Project Goal

The goal of DocuMind Enterprise is to build a secure, scalable, and production-style AI assistant capable of understanding enterprise documents and providing accurate, citation-supported answers while preventing hallucinations.

---
