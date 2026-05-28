import os
from typing import List, Dict, AsyncGenerator
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# Initialize Vector Store
def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    index_name = os.environ.get("PINECONE_INDEX_NAME", "documind-index")
    vectorstore = PineconeVectorStore(index_name=index_name, embedding=embeddings)
    return vectorstore

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def build_rag_chain():
    """
    Builds the complete RAG pipeline using LCEL.
    """
    llm = ChatGroq(temperature=0.0, model_name="llama-3.3-70b-versatile")
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    
    qa_system_prompt = (
        "You are DocuMind Enterprise, an AI Assistant for answering questions strictly based on corporate documents.\n"
        "You MUST follow these rules exactly:\n"
        "1. Answer the user's question ONLY using the provided context.\n"
        "2. If the answer is not contained in the context, you MUST say exactly: 'I don't know. This information is outside my scope based on the uploaded documents.'\n"
        "3. Do NOT make up information or use outside knowledge.\n"
        "4. Your answer should be comprehensive and helpful, provided the information is in the context.\n"
        "5. ALWAYS provide citations at the end of your response referencing the documents and page numbers used.\n"
        "\n"
        "Context for the question:\n"
        "{context}\n"
    )
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    # Extract query for retrieval
    def get_query(inputs):
        return inputs["input"]
        
    def get_context(inputs):
        query = get_query(inputs)
        return retriever.invoke(query)
        
    def format_input_for_prompt(inputs):
        return {
            "context": format_docs(inputs["context"]),
            "input": inputs["input"],
            "chat_history": inputs.get("chat_history", [])
        }

    return (
        RunnablePassthrough.assign(context=get_context)
        | RunnablePassthrough.assign(
            answer=(
                format_input_for_prompt 
                | qa_prompt 
                | llm 
                | StrOutputParser()
            )
        )
    )

async def ask_question_stream(question: str, history: List[Dict]) -> AsyncGenerator[str, None]:
    """
    Given a question and chat history, retrieves context and streams the response.
    Returns an async generator yielding string chunks.
    """
    rag_chain = build_rag_chain()
    
    # Format history for langchain
    formatted_history = []
    for msg in history:
        if msg["role"] == "user":
            formatted_history.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            formatted_history.append(AIMessage(content=msg["content"]))
            
    # Keep track of citations
    sources_used = set()
    
    # Execute the chain via streaming
    async for chunk in rag_chain.astream({"input": question, "chat_history": formatted_history}):
        if "context" in chunk and not sources_used:
             for doc in chunk["context"]:
                  src = doc.metadata.get("source_document", "Unknown")
                  page = doc.metadata.get("page_number", "Unknown")
                  src_name = os.path.basename(src)
                  sources_used.add(f"{src_name} (Page {page})")
                  
        if "answer" in chunk:
             yield chunk["answer"]
             
    # After generation finishes, yield the citations
    if sources_used:
        yield "\n\n**Sources:**\n"
        for source in sorted(sources_used):
            yield f"- {source}\n"
