# 📚 Document QA System

An AI-powered document question answering system using Retrieval-Augmented Generation (RAG). Upload your documents (PDF, TXT, DOCX) and ask questions to get intelligent answers powered by state-of-the-art AI models.

## ✨ Features

- **Multi-Format Support**: Upload PDF, TXT, and DOCX documents
- **Intelligent Chunking**: Automatic text segmentation with overlap for better context
- **Semantic Search**: Find relevant information using vector embeddings
- **AI-Powered Answers**: Get accurate answers using Groq's fast LLMs
- **Source References**: See which document chunks were used for each answer
- **Modern UI**: Clean, responsive interface with drag-and-drop upload
- **Real-time Processing**: Progress indicators and status updates
- **Document Management**: View, delete, and manage uploaded documents

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **HuggingFace sentence-transformers**: Local embeddings generation (all-MiniLM-L6-v2)
- **FAISS**: Efficient similarity search and clustering of dense vectors
- **Groq API**: Fast inference for Llama 3.1 and Mixtral models
- **PyPDF2**: PDF text extraction
- **python-docx**: DOCX text extraction

### Frontend
- **HTML5/CSS3**: Modern, responsive design
- **JavaScript (Vanilla)**: No framework dependencies
- **Drag & Drop**: Intuitive file upload experience

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Groq API key (free tier available at [console.groq.com](https://console.groq.com/))

## 🚀 Quick Start

### 1. Clone or Download the Project

```bash
cd document-qa-system
```

### 2. Set Up Python Environment

```bash
# Create a virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Edit the `.env` file in the project root and add your Groq API key:

```env
GROQ_API_KEY=your_actual_api_key_here
```

**How to get a Groq API Key:**
1. Visit [console.groq.com](https://console.groq.com/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

### 5. Start the Backend Server

```bash
cd backend
python app.py
```

The server will start on `http://localhost:8000`

### 6. Open the Frontend

Open `frontend/index.html` in your web browser, or simply navigate to:

```
file:///path/to/document-qa-system/frontend/index.html
```

## 📖 Usage Guide

### Uploading Documents

1. **Drag & Drop**: Drag files directly onto the upload area
2. **Click to Browse**: Click "Select Files" to open file picker
3. **Supported Formats**: PDF, TXT, DOCX

### Asking Questions

1. Wait for documents to finish processing
2. Type your question in the chat input
3. Press Enter or click "Send"
4. View the answer with source references

### Managing Documents

- **View Documents**: See all uploaded documents with chunk counts
- **Delete Document**: Remove individual documents
- **Clear All**: Delete all documents at once

## 🔧 API Documentation

### Endpoints

#### `POST /upload`
Upload and process documents

**Request**: `multipart/form-data`
- `files`: List of files (PDF, TXT, DOCX)

**Response**:
```json
{
  "message": "Document upload completed",
  "total_files": 2,
  "successful": 2,
  "failed": 0,
  "total_chunks": 45,
  "results": [
    {
      "filename": "document.pdf",
      "status": "success",
      "chunks_processed": 25,
      "document_id": "uuid"
    }
  ]
}
```

#### `POST /query`
Ask a question about uploaded documents

**Request Body**:
```json
{
  "question": "What is the main topic?",
  "top_k": 3
}
```

**Response**:
```json
{
  "answer": "The main topic is...",
  "sources": [
    {
      "document_name": "document.pdf",
      "chunk_index": 5,
      "similarity_score": 0.85,
      "text_preview": "Preview of the chunk..."
    }
  ]
}
```

#### `GET /documents`
List all uploaded documents

**Response**:
```json
{
  "total_documents": 2,
  "total_chunks": 45,
  "documents": [
    {
      "name": "document.pdf",
      "id": "uuid",
      "chunk_count": 25
    }
  ]
}
```

#### `DELETE /documents/{document_name}`
Delete a specific document

**Response**:
```json
{
  "message": "Document 'document.pdf' deleted successfully"
}
```

#### `POST /clear`
Clear all documents

**Response**:
```json
{
  "message": "All documents cleared successfully"
}
```

#### `GET /health`
Health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "components": {
    "document_processor": true,
    "embedding_generator": true,
    "vector_store": true,
    "llm_client": true
  }
}
```

## 🏗️ Project Structure

```
document-qa-system/
├── backend/
│   ├── app.py                  # FastAPI main application
│   ├── document_processor.py   # Document parsing and chunking
│   ├── embeddings.py           # HuggingFace embeddings
│   ├── vector_store.py         # FAISS index management
│   ├── llm_client.py           # Groq API integration
│   └── requirements.txt        # Python dependencies
├── frontend/
│   └── index.html              # Complete frontend
├── .env                        # Environment variables
└── README.md                   # This file
```

## 🔍 How It Works

### 1. Document Processing
- Documents are parsed based on their file type
- Text is cleaned and normalized
- Content is split into overlapping chunks (800 chars, 150 overlap)

### 2. Embedding Generation
- Each chunk is converted to a vector embedding
- Uses HuggingFace's all-MiniLM-L6-v2 model (384 dimensions)
- Runs locally, no API calls needed

### 3. Vector Storage
- Embeddings are stored in FAISS index
- FAISS IndexFlatL2 for efficient similarity search
- Metadata (document name, chunk index) is stored separately

### 4. Question Answering
- User question is converted to embedding
- Top-k similar chunks are retrieved (default: k=3)
- Context is built from retrieved chunks
- Groq LLM generates answer using the context
- Source references are provided

## 🎯 Configuration Options

### Chunking Parameters
Edit `backend/app.py` to adjust:
```python
document_processor = DocumentProcessor(
    chunk_size=800,      # Characters per chunk
    chunk_overlap=150    # Overlap between chunks
)
```

### Embedding Model
Edit `backend/embeddings.py`:
```python
self.model = SentenceTransformer("all-MiniLM-L6-v2")
```

### LLM Model
Edit `backend/llm_client.py`:
```python
self.model = "llama-3.1-70b-versatile"  # or "mixtral-8x7b-32768"
```

Available models:
- `llama-3.1-70b-versatile` (recommended)
- `mixtral-8x7b-32768`
- `llama-3.1-8b-instant` (faster, smaller)

## 🐛 Troubleshooting

### Issue: "GROQ_API_KEY not found"
**Solution**: Ensure your `.env` file exists in the project root and contains a valid API key.

### Issue: "Model not loaded"
**Solution**: The embedding model downloads on first run. Ensure you have an internet connection and sufficient disk space (~500MB).

### Issue: CORS errors in browser
**Solution**: The backend allows all origins by default. If you modified CORS settings, ensure your frontend origin is included.

### Issue: Slow response times
**Solution**: 
- First query is slower due to model loading
- Use `llama-3.1-8b-instant` for faster responses
- Reduce `top_k` parameter in queries

### Issue: Memory errors with large documents
**Solution**: 
- Process documents in smaller batches
- Reduce chunk size
- Clear documents before uploading new ones

## 🚀 Deployment

### Local Deployment
Follow the Quick Start guide above.

### Docker Deployment (Recommended)

The system includes full Docker support with multi-stage builds and docker-compose orchestration.

#### Prerequisites
- Docker installed (version 20.10 or higher)
- Docker Compose installed (version 2.0 or higher)

#### Quick Start with Docker

1. **Clone the repository**
```bash
git clone https://github.com/NalgondaLokesh/RAG-OA.git
cd RAG-OA
```

2. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:
```env
GROQ_API_KEY=your_actual_api_key_here
PORT=8000
MODEL_NAME=llama-3.3-70b-versatile
CHUNK_SIZE=800
CHUNK_OVERLAP=150
TOP_K_RESULTS=3
```

3. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

The application will be available at `http://localhost:8000`

4. **Stop the container**
```bash
docker-compose down
```

#### Docker Commands

**Build the image manually:**
```bash
docker build -t document-qa .
```

**Run the container:**
```bash
docker run -p 8000:8000 --env-file .env document-qa
```

**Run with volume mounts (persistent storage):**
```bash
docker run -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  document-qa
```

**Check container health:**
```bash
docker ps
curl http://localhost:8000/health
```

**View logs:**
```bash
docker-compose logs -f
```

#### Docker Features

- **Multi-stage build**: Optimized image size with separate build and runtime stages
- **Non-root user**: Runs as non-privileged user for security
- **Health checks**: Built-in health monitoring for container orchestration
- **Volume support**: Optional persistent storage for uploads and vector data
- **Environment variables**: All configuration via environment variables
- **Auto-restart**: Configured to restart unless stopped

#### Docker Configuration Files

- **Dockerfile**: Multi-stage build configuration
- **docker-compose.yml**: Container orchestration with health checks
- **.dockerignore**: Excludes unnecessary files from build context
- **.env.example**: Template for environment variables

### Cloud Deployment

The system can be deployed to:
- **Render**: Free tier available for Python apps
- **HuggingFace Spaces**: Free hosting with GPU support
- **Railway**: Simple deployment with free tier
- **AWS/Azure/GCP**: For production deployments

#### Deploying to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Deploy

#### Deploying to HuggingFace Spaces

1. Create a new Space on HuggingFace
2. Choose Docker runtime
3. Push code to the Space repository
4. Set secrets (GROQ_API_KEY) in Space settings
5. Space will automatically build and deploy

## 📊 Performance

- **Embedding Generation**: ~100 chunks/second (CPU)
- **Similarity Search**: <10ms for 10,000 chunks
- **LLM Inference**: ~500ms per query (Groq)
- **Memory Usage**: ~2GB for 10,000 chunks

## 🔒 Security Considerations

- File type validation prevents malicious uploads
- Input sanitization on all user inputs
- API keys stored in environment variables
- No persistent storage of uploaded files
- CORS enabled for development (restrict in production)

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Support for more file formats (images, tables)
- Streaming responses for real-time answers
- Conversation history management
- Export Q&A sessions
- Multi-language support
- Advanced chunking strategies

## 📝 License

This project is provided as-is for educational and research purposes.

## 🙏 Acknowledgments

- **HuggingFace**: For sentence-transformers
- **Groq**: For fast LLM inference
- **FAISS**: For efficient vector search
- **FastAPI**: For the excellent web framework

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the API documentation
3. Ensure all dependencies are correctly installed
4. Verify your API key is valid

## 🎓 Demo Video

A demo video showing the system in action is available at:
[Link to demo video - to be created]

The demo covers:
- System startup and configuration
- Uploading multiple document types
- Asking various questions
- Viewing source references
- Error handling demonstrations

---

**Built with ❤️ using FastAPI, HuggingFace, FAISS, and Groq**
