# RAG Setup Guide: Using nomic-embed-text with Ollama WebUI

This guide will walk you through setting up Retrieval-Augmented Generation (RAG) functionality in your Ollama WebUI frontend using the `nomic-embed-text` embedding model.

## What is RAG?

RAG (Retrieval-Augmented Generation) enhances AI responses by combining:
- **Retrieval**: Finding relevant documents from your knowledge base
- **Generation**: Using retrieved context to generate accurate, contextual responses

## Prerequisites

1. **Ollama** - Must be installed and running
2. **Python 3.8+** - For the backend
3. **Node.js 18+** - For the frontend
4. **Virtual environment** - Recommended for Python dependencies

## Step 1: Install Required Dependencies

### Backend Dependencies

First, activate your Python virtual environment:

```bash
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows
```

Install the required Python packages:

```bash
pip install chromadb langchain langchain-community langchain-text-splitters unstructured pypdf
```

These packages provide:
- `chromadb`: Vector database for storing document embeddings
- `langchain`: Framework for LLM applications
- `langchain-community`: Community integrations
- `langchain-text-splitters`: Document chunking utilities
- `unstructured`: Document loading and processing
- `pypdf`: PDF file support

## Step 2: Install and Configure nomic-embed-text

### Pull the nomic-embed-text Model

```bash
ollama pull nomic-embed-text
```

This downloads the Nomic embedding model, which is specifically designed for:
- High-quality text embeddings
- Semantic search
- RAG applications
- Efficient processing

### Verify Model Installation

```bash
ollama list
```

You should see `nomic-embed-text` in the list of available models.

## Step 3: Start the Services

### 1. Start Ollama Server

```bash
ollama serve
```

This runs Ollama on `http://localhost:11434` by default.

### 2. Start the Backend API

```bash
python api.py
```

The backend will run on `http://localhost:8000` with the new RAG endpoints:
- `POST /api/rag/upload` - Upload documents
- `POST /api/rag/query` - Query with RAG
- `GET /api/rag/documents` - List documents
- `DELETE /api/rag/documents/{filename}` - Delete documents
- `GET /api/rag/status` - Check RAG status

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`.

## Step 4: Using RAG in the WebUI

### Document Upload

1. Navigate to the RAG Management section in the WebUI
2. Upload PDF or TXT files (max 10MB each)
3. Documents are automatically:
   - Split into chunks
   - Embedded using `nomic-embed-text`
   - Stored in ChromaDB

### Querying with RAG

When you enable RAG mode in the chat interface:
1. Your query is embedded using `nomic-embed-text`
2. Similar document chunks are retrieved from ChromaDB
3. The retrieved context is combined with your query
4. The LLM generates a response using both your query and the relevant context

## API Usage Examples

### Upload a Document

```bash
curl -X POST http://localhost:8000/api/rag/upload \
  -F "file=@/path/to/your/document.pdf"
```

### Query with RAG

```bash
curl -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the main features of the product?",
    "model": "llama3.2:latest"
  }'
```

### Check RAG Status

```bash
curl http://localhost:8000/api/rag/status
```

## Configuration Options

### Environment Variables

You can customize RAG behavior with these environment variables:

```bash
# .env file
CHROMA_DB_PATH=./chroma_db              # ChromaDB storage path
RAG_COLLECTION_NAME=documents           # Collection name
EMBEDDING_MODEL=nomic-embed-text        # Embedding model
OLLAMA_BASE_URL=http://localhost:11434  # Ollama API URL
CHUNK_SIZE=1000                         # Document chunk size
CHUNK_OVERLAP=200                       # Chunk overlap size
```

### Customizing the RAG Manager

You can modify `rag_helper.py` to customize:
- Chunk sizes and overlap
- Number of retrieved documents
- Embedding models
- Collection names

## Supported File Types

- **PDF files** (.pdf) - Documents, reports, manuals
- **Text files** (.txt) - Plain text documents

## Best Practices

### Document Preparation
- Use clear, well-structured documents
- Ensure text is readable (avoid scanned images without OCR)
- Keep file sizes reasonable (under 10MB)

### Query Optimization
- Use specific, clear questions
- Reference concepts that would appear in your documents
- Experiment with different phrasings

### Model Selection
- Use larger models (like `llama3.2:70b`) for better reasoning
- Consider model capabilities for your specific domain

## Troubleshooting

### Common Issues

#### "nomic-embed-text model not found"
```bash
ollama pull nomic-embed-text
```

#### "RAG functionality not available"
Install missing dependencies:
```bash
pip install chromadb langchain langchain-community
```

#### "Connection refused to Ollama"
Ensure Ollama is running:
```bash
ollama serve
```

#### ChromaDB permissions error
Check directory permissions for `./chroma_db`:
```bash
chmod -R 755 ./chroma_db
```

### Performance Tips

1. **GPU Acceleration**: Use CUDA-enabled Ollama for faster embeddings
2. **Batch Processing**: Upload multiple documents together
3. **Index Optimization**: ChromaDB automatically optimizes indices
4. **Memory Usage**: Monitor RAM usage with large document collections

## Advanced Features

### Custom Embedding Models

You can experiment with other embedding models available in Ollama:

```python
# In rag_helper.py
rag_manager = RAGManager(
    embedding_model="your-custom-embed-model",
    collection_name="custom-collection"
)
```

### Multi-Collection Support

Organize documents by topic:

```python
# Create separate managers for different domains
docs_manager = RAGManager(collection_name="documentation")
legal_manager = RAGManager(collection_name="legal-docs")
research_manager = RAGManager(collection_name="research-papers")
```

### Hybrid Search

Combine semantic search with keyword matching for better results.

## Security Considerations

- **Local Processing**: All embeddings are generated locally
- **Data Privacy**: Documents never leave your system
- **Access Control**: Implement authentication for production use
- **File Validation**: Only upload trusted documents

## Next Steps

1. **Test with Sample Documents**: Start with a few PDFs to test functionality
2. **Monitor Performance**: Watch response times and accuracy
3. **Scale Gradually**: Add more documents as you validate results
4. **Customize**: Adjust chunk sizes and retrieval parameters
5. **Integrate**: Add RAG toggle to your chat interface

## Resources

- [Nomic Embedding Models](https://www.nomic.ai/atlas)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering)
- [Ollama Model Library](https://ollama.ai/library)

Your RAG system is now ready to enhance AI responses with your custom knowledge base! 