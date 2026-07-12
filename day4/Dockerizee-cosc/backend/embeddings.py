"""
Embeddings Module
Handles text embedding generation using HuggingFace sentence-transformers
"""

from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np


class EmbeddingGenerator:
    """Generate embeddings using HuggingFace sentence-transformers"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize embedding generator
        
        Args:
            model_name: Name of the sentence-transformers model to use
        """
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load the sentence-transformers model"""
        try:
            print(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            print("Model loaded successfully")
        except Exception as e:
            raise RuntimeError(f"Failed to load embedding model: {str(e)}")
    
    def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding as numpy array
        """
        if not self.model:
            raise RuntimeError("Model not loaded")
        
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding
    
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for multiple texts (batch processing)
        
        Args:
            texts: List of texts to embed
            
        Returns:
            Embeddings as numpy array (shape: [num_texts, embedding_dim])
        """
        if not self.model:
            raise RuntimeError("Model not loaded")
        
        if not texts:
            return np.array([])
        
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        return embeddings
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of the embeddings"""
        if not self.model:
            raise RuntimeError("Model not loaded")
        
        return self.model.get_embedding_dimension()
