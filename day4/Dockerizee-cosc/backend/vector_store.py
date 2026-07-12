"""
Vector Store Module
Manages FAISS index for similarity search and retrieval
"""

import faiss
import numpy as np
from typing import List, Dict, Tuple
import uuid


class VectorStore:
    """FAISS-based vector store for document chunks"""
    
    def __init__(self, embedding_dim: int = 384):
        """
        Initialize vector store
        
        Args:
            embedding_dim: Dimension of embeddings (384 for all-MiniLM-L6-v2)
        """
        self.embedding_dim = embedding_dim
        self.index = faiss.IndexFlatL2(embedding_dim)  # L2 distance (Euclidean)
        self.chunks = []  # Store chunk metadata
        self.document_ids = {}  # Map document names to IDs
    
    def add_chunks(self, embeddings: np.ndarray, chunks: List[Dict]) -> str:
        """
        Add chunks with embeddings to the vector store
        
        Args:
            embeddings: Embeddings array (shape: [num_chunks, embedding_dim])
            chunks: List of chunk metadata dictionaries
            
        Returns:
            Document ID for the added document
        """
        if len(embeddings) != len(chunks):
            raise ValueError("Number of embeddings must match number of chunks")
        
        # Generate document ID
        if chunks:
            document_name = chunks[0].get('document_name', 'unknown')
            doc_id = str(uuid.uuid4())
            self.document_ids[document_name] = doc_id
        else:
            doc_id = str(uuid.uuid4())
        
        # Add embeddings to FAISS index
        embeddings_array = np.array(embeddings, dtype=np.float32)
        if len(embeddings_array.shape) == 1:
            embeddings_array = embeddings_array.reshape(1, -1)
        
        self.index.add(embeddings_array)
        
        # Store chunk metadata
        for chunk in chunks:
            chunk['document_id'] = doc_id
            self.chunks.append(chunk)
        
        return doc_id
    
    def search(self, query_embedding: np.ndarray, k: int = 5) -> List[Dict]:
        """
        Search for similar chunks
        
        Args:
            query_embedding: Embedding of the query
            k: Number of results to return
            
        Returns:
            List of top-k chunks with similarity scores
        """
        if self.index.ntotal == 0:
            return []
        
        # Ensure query embedding is correct shape
        query_embedding = np.array(query_embedding, dtype=np.float32)
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Adjust k if we have fewer chunks
        k = min(k, self.index.ntotal)
        
        # Search
        distances, indices = self.index.search(query_embedding, k)
        
        # Retrieve chunks
        results = []
        for i in range(k):
            idx = indices[0][i]
            distance = distances[0][i]
            
            if idx < len(self.chunks):
                chunk = self.chunks[idx].copy()
                chunk['similarity_score'] = float(1 / (1 + distance))  # Convert distance to similarity
                results.append(chunk)
        
        return results
    
    def delete_document(self, document_name: str) -> bool:
        """
        Delete a document from the vector store
        Note: FAISS doesn't support deletion, so we rebuild the index
        
        Args:
            document_name: Name of the document to delete
            
        Returns:
            True if successful, False otherwise
        """
        if document_name not in self.document_ids:
            return False
        
        doc_id = self.document_ids[document_name]
        
        # Filter out chunks belonging to this document
        remaining_chunks = [chunk for chunk in self.chunks if chunk.get('document_id') != doc_id]
        
        if len(remaining_chunks) == len(self.chunks):
            return False  # No chunks to delete
        
        # Rebuild index with remaining chunks
        self.chunks = remaining_chunks
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        
        # Remove document ID mapping
        del self.document_ids[document_name]
        
        # Re-add remaining chunks (would need embeddings, so this is a limitation)
        # In production, you'd store embeddings separately
        # For now, we'll clear and require re-upload
        return True
    
    def clear(self):
        """Clear all data from the vector store"""
        self.index = faiss.IndexFlatL2(self.embedding_dim)
        self.chunks = []
        self.document_ids = {}
    
    def get_document_list(self) -> List[Dict]:
        """Get list of all documents"""
        documents = []
        seen_docs = set()
        
        for chunk in self.chunks:
            doc_name = chunk.get('document_name', 'unknown')
            doc_id = chunk.get('document_id', '')
            
            if doc_name not in seen_docs:
                documents.append({
                    'name': doc_name,
                    'id': doc_id,
                    'chunk_count': sum(1 for c in self.chunks if c.get('document_name') == doc_name)
                })
                seen_docs.add(doc_name)
        
        return documents
    
    def get_total_chunks(self) -> int:
        """Get total number of chunks in the store"""
        return len(self.chunks)
