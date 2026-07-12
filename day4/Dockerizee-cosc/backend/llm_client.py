"""
LLM Client Module
Handles integration with Groq API for question answering
"""

import os
from groq import Groq
from typing import List, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class LLMClient:
    """Client for interacting with Groq API"""
    
    def __init__(self, model: str = "llama-3.3-70b-versatile"):
        """
        Initialize LLM client
        
        Args:
            model: Model name to use (default: llama-3.3-70b-versatile)
        """
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.model = model
        self.client = Groq(api_key=self.api_key)
        
        # Available models
        self.available_models = [
            "llama-3.1-70b-versatile",
            "mixtral-8x7b-32768",
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile"
        ]
    
    def generate_response(self, context: str, question: str, stream: bool = False) -> str:
        """
        Generate a response using the LLM with RAG context
        
        Args:
            context: Retrieved context from documents
            question: User's question
            stream: Whether to stream the response
            
        Returns:
            Generated answer
        """
        # Create prompt template
        prompt = self._create_prompt(context, question)
        
        try:
            if stream:
                return self._stream_response(prompt)
            else:
                return self._generate_response(prompt)
        except Exception as e:
            raise RuntimeError(f"Error generating response: {str(e)}")
    
    def _create_prompt(self, context: str, question: str) -> str:
        """Create the prompt with context and question"""
        prompt = f"""You are a helpful assistant. Use the following context to answer the question.
If the answer cannot be found in the context, say "I don't have enough information to answer this."

Context:
{context}

Question: {question}

Answer:"""
        return prompt
    
    def _generate_response(self, prompt: str) -> str:
        """Generate non-streamed response"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        return response.choices[0].message.content
    
    def _stream_response(self, prompt: str) -> str:
        """Generate streamed response (returns full response for now)"""
        full_response = ""
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content
        
        return full_response
    
    def set_model(self, model: str):
        """
        Change the model being used
        
        Args:
            model: New model name
        """
        if model not in self.available_models:
            raise ValueError(f"Model {model} not available. Available models: {self.available_models}")
        self.model = model
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return self.available_models
