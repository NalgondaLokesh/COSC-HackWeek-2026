"""
FastAPI Main Application
Document QA System with RAG implementation
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os

from document_processor import DocumentProcessor
from embeddings import EmbeddingGenerator
from vector_store import VectorStore
from llm_client import LLMClient


# Pydantic models for request/response
class QueryRequest(BaseModel):
    question: str
    top_k: Optional[int] = 3


class QueryResponse(BaseModel):
    answer: str
    sources: List[dict]


class DocumentInfo(BaseModel):
    name: str
    id: str
    chunk_count: int


# Global instances
document_processor = None
embedding_generator = None
vector_store = None
llm_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    global document_processor, embedding_generator, vector_store, llm_client
    
    try:
        document_processor = DocumentProcessor(chunk_size=800, chunk_overlap=150)
        embedding_generator = EmbeddingGenerator(model_name="all-MiniLM-L6-v2")
        embedding_dim = embedding_generator.get_embedding_dimension()
        vector_store = VectorStore(embedding_dim=embedding_dim)
        llm_client = LLMClient(model="llama-3.3-70b-versatile")
        print("All components initialized successfully")
    except Exception as e:
        print(f"Error initializing components: {str(e)}")
        raise
    
    yield
    
    # Shutdown (if needed)
    print("Shutting down...")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Document QA System",
    description="AI-powered document question answering system using RAG",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Document QA System API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/upload",
            "query": "/query",
            "documents": "/documents",
            "clear": "/clear"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "components": {
            "document_processor": document_processor is not None,
            "embedding_generator": embedding_generator is not None,
            "vector_store": vector_store is not None,
            "llm_client": llm_client is not None
        }
    }


@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload and process documents
    
    Args:
        files: List of files to upload (PDF, TXT, DOCX)
        
    Returns:
        JSON response with processing results
    """
    if not document_processor or not embedding_generator or not vector_store:
        raise HTTPException(status_code=500, detail="Components not initialized")
    
    results = []
    total_chunks = 0
    
    for file in files:
        try:
            # Read file content
            file_content = await file.read()
            
            # Determine file type from filename
            filename = file.filename
            file_ext = filename.split('.')[-1].lower() if '.' in filename else ''
            
            # Validate file type
            if file_ext not in ['pdf', 'txt', 'docx']:
                results.append({
                    "filename": filename,
                    "status": "failed",
                    "error": f"Unsupported file type: {file_ext}"
                })
                continue
            
            # Process document
            chunks = document_processor.process_document(
                file_content=file_content,
                filename=filename,
                file_type=file_ext
            )
            
            if not chunks:
                results.append({
                    "filename": filename,
                    "status": "failed",
                    "error": "No text extracted from document"
                })
                continue
            
            # Generate embeddings
            texts = [chunk['text'] for chunk in chunks]
            embeddings = embedding_generator.generate_embeddings(texts)
            
            # Add to vector store
            doc_id = vector_store.add_chunks(embeddings, chunks)
            
            results.append({
                "filename": filename,
                "status": "success",
                "chunks_processed": len(chunks),
                "document_id": doc_id
            })
            total_chunks += len(chunks)
            
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "message": "Document upload completed",
        "total_files": len(files),
        "successful": sum(1 for r in results if r["status"] == "success"),
        "failed": sum(1 for r in results if r["status"] == "failed"),
        "total_chunks": total_chunks,
        "results": results
    }


@app.post("/query")
async def query_documents(request: QueryRequest):
    """
    Ask a question against uploaded documents
    
    Args:
        request: QueryRequest with question and optional top_k
        
    Returns:
        JSON response with answer and sources
    """
    if not embedding_generator or not vector_store or not llm_client:
        raise HTTPException(status_code=500, detail="Components not initialized")
    
    if vector_store.get_total_chunks() == 0:
        raise HTTPException(status_code=400, detail="No documents uploaded. Please upload documents first.")
    
    try:
        # Generate embedding for question
        query_embedding = embedding_generator.generate_embedding(request.question)
        
        # Search for relevant chunks
        relevant_chunks = vector_store.search(query_embedding, k=request.top_k)
        
        if not relevant_chunks:
            return {
                "answer": "No relevant information found in the uploaded documents.",
                "sources": []
            }
        
        # Create context from retrieved chunks
        context = "\n\n".join([
            f"[Document: {chunk['document_name']}, Chunk {chunk['chunk_index']}]\n{chunk['text']}"
            for chunk in relevant_chunks
        ])
        
        # Generate answer using LLM
        answer = llm_client.generate_response(context, request.question)
        
        # Prepare sources
        sources = []
        for chunk in relevant_chunks:
            sources.append({
                "document_name": chunk['document_name'],
                "chunk_index": chunk['chunk_index'],
                "similarity_score": chunk['similarity_score'],
                "text_preview": chunk['text'][:200] + "..." if len(chunk['text']) > 200 else chunk['text']
            })
        
        return {
            "answer": answer,
            "sources": sources
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.get("/documents")
async def get_documents():
    """
    Get list of uploaded documents
    
    Returns:
        JSON response with document list
    """
    if not vector_store:
        raise HTTPException(status_code=500, detail="Vector store not initialized")
    
    documents = vector_store.get_document_list()
    
    return {
        "total_documents": len(documents),
        "total_chunks": vector_store.get_total_chunks(),
        "documents": documents
    }


@app.delete("/documents/{document_name}")
async def delete_document(document_name: str):
    """
    Delete a specific document
    
    Args:
        document_name: Name of the document to delete
        
    Returns:
        JSON response with deletion status
    """
    if not vector_store:
        raise HTTPException(status_code=500, detail="Vector store not initialized")
    
    success = vector_store.delete_document(document_name)
    
    if success:
        return {
            "message": f"Document '{document_name}' deleted successfully"
        }
    else:
        raise HTTPException(status_code=404, detail=f"Document '{document_name}' not found")


@app.post("/clear")
async def clear_all_documents():
    """
    Clear all documents from the vector store
    
    Returns:
        JSON response with clearance status
    """
    if not vector_store:
        raise HTTPException(status_code=500, detail="Vector store not initialized")
    
    vector_store.clear()
    
    return {
        "message": "All documents cleared successfully"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
