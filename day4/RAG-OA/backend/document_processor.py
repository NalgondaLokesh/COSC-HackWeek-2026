"""
Document Processor Module
Handles parsing and chunking of various document formats (PDF, TXT, DOCX)
"""

import re
from typing import List, Dict
from io import BytesIO
import PyPDF2
from docx import Document


class DocumentProcessor:
    """Process documents and create text chunks with overlap"""
    
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        """
        Initialize document processor
        
        Args:
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_file = BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return self.clean_text(text)
        except Exception as e:
            raise ValueError(f"Error processing PDF: {str(e)}")
    
    def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            docx_file = BytesIO(file_content)
            doc = Document(docx_file)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return self.clean_text(text)
        except Exception as e:
            raise ValueError(f"Error processing DOCX: {str(e)}")
    
    def extract_text_from_txt(self, file_content: bytes) -> str:
        """Extract text from TXT file"""
        try:
            text = file_content.decode('utf-8')
            return self.clean_text(text)
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                text = file_content.decode('latin-1')
                return self.clean_text(text)
            except Exception as e:
                raise ValueError(f"Error processing TXT: {str(e)}")
    
    def clean_text(self, text: str) -> str:
        """Clean extracted text by removing extra spaces and special characters"""
        # Remove multiple whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove control characters except newlines
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        # Strip leading/trailing whitespace
        text = text.strip()
        return text
    
    def chunk_text(self, text: str, document_name: str) -> List[Dict]:
        """
        Split text into overlapping chunks
        
        Args:
            text: The text to chunk
            document_name: Name of the source document
            
        Returns:
            List of chunks with metadata
        """
        if not text or len(text.strip()) == 0:
            return []
        
        chunks = []
        start = 0
        chunk_index = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Try to break at word boundary
            if end < len(text):
                # Find the last space before chunk_size
                last_space = text.rfind(' ', start, end)
                if last_space != -1:
                    end = last_space
            
            chunk_text = text[start:end].strip()
            
            if chunk_text:  # Only add non-empty chunks
                chunks.append({
                    "text": chunk_text,
                    "document_name": document_name,
                    "chunk_index": chunk_index,
                    "start_char": start,
                    "end_char": end
                })
                chunk_index += 1
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            if start < 0:
                start = 0
        
        return chunks
    
    def process_document(self, file_content: bytes, filename: str, file_type: str) -> List[Dict]:
        """
        Process a document and return chunks
        
        Args:
            file_content: Raw file content as bytes
            filename: Name of the file
            file_type: Type of file (pdf, docx, txt)
            
        Returns:
            List of text chunks with metadata
        """
        # Extract text based on file type
        if file_type.lower() == 'pdf':
            text = self.extract_text_from_pdf(file_content)
        elif file_type.lower() == 'docx':
            text = self.extract_text_from_docx(file_content)
        elif file_type.lower() == 'txt':
            text = self.extract_text_from_txt(file_content)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # Create chunks
        chunks = self.chunk_text(text, filename)
        
        return chunks
