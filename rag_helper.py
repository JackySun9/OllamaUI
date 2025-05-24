import os
import logging
from typing import List, Optional
import chromadb
from chromadb.utils import embedding_functions
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.embeddings import OllamaEmbeddings
import requests
import tempfile
import json

logger = logging.getLogger(__name__)

class RAGManager:
    def __init__(self, 
                 collection_name: str = "documents",
                 embedding_model: str = "nomic-embed-text",
                 ollama_base_url: str = "http://localhost:11434"):
        """
        Initialize RAG Manager with ChromaDB and Ollama embeddings
        
        Args:
            collection_name: Name of the ChromaDB collection
            embedding_model: Ollama embedding model to use (default: nomic-embed-text)
            ollama_base_url: Base URL for Ollama API
        """
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.ollama_base_url = ollama_base_url
        
        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        
        # Initialize Ollama embeddings
        self.embeddings = OllamaEmbeddings(
            model=embedding_model,
            base_url=ollama_base_url
        )
        
        # Get or create collection
        self.collection = self._get_or_create_collection()
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
    
    def _get_or_create_collection(self):
        """Get or create ChromaDB collection with Ollama embeddings"""
        try:
            # Try to get existing collection
            collection = self.chroma_client.get_collection(
                name=self.collection_name
            )
            logger.info(f"Using existing collection: {self.collection_name}")
        except Exception:
            # Create new collection with custom embedding function
            embedding_function = embedding_functions.OllamaEmbeddingFunction(
                url=f"{self.ollama_base_url}/api/embeddings",
                model_name=self.embedding_model,
            )
            
            collection = self.chroma_client.create_collection(
                name=self.collection_name,
                embedding_function=embedding_function
            )
            logger.info(f"Created new collection: {self.collection_name}")
        
        return collection
    
    def add_document(self, file_content: bytes, filename: str, file_type: str = "pdf") -> bool:
        """
        Add a document to the vector database
        
        Args:
            file_content: Raw file content as bytes
            filename: Name of the file
            file_type: Type of file ('pdf', 'txt')
            
        Returns:
            bool: Success status
        """
        try:
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_type}") as tmp_file:
                tmp_file.write(file_content)
                tmp_file_path = tmp_file.name
            
            # Load document based on type
            if file_type.lower() == "pdf":
                loader = PyPDFLoader(tmp_file_path)
            else:
                loader = TextLoader(tmp_file_path, encoding="utf-8")
            
            documents = loader.load()
            
            # Split documents into chunks
            chunks = self.text_splitter.split_documents(documents)
            
            # Prepare data for ChromaDB
            texts = [chunk.page_content for chunk in chunks]
            metadatas = [
                {
                    "source": filename,
                    "chunk_id": i,
                    "page": chunk.metadata.get("page", 0)
                }
                for i, chunk in enumerate(chunks)
            ]
            ids = [f"{filename}_{i}" for i in range(len(chunks))]
            
            # Add to collection
            self.collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
            logger.info(f"Successfully added {len(chunks)} chunks from {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding document {filename}: {str(e)}")
            return False
    
    def search_documents(self, query: str, n_results: int = 5) -> List[dict]:
        """
        Search for relevant documents
        
        Args:
            query: Search query
            n_results: Number of results to return
            
        Returns:
            List of relevant document chunks with metadata
        """
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )
            
            # Format results
            formatted_results = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    formatted_results.append({
                        'content': doc,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'distance': results['distances'][0][i] if results['distances'] else None
                    })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return []
    
    def generate_rag_response(self, query: str, model: str) -> str:
        """
        Generate RAG response by combining retrieved context with LLM
        
        Args:
            query: User query
            model: Ollama model to use for generation
            
        Returns:
            Generated response
        """
        try:
            # Retrieve relevant documents
            relevant_docs = self.search_documents(query, n_results=3)
            
            if not relevant_docs:
                return "I couldn't find any relevant information in the knowledge base to answer your question."
            
            # Build context from retrieved documents
            context = "\n\n".join([doc['content'] for doc in relevant_docs])
            
            # Create RAG prompt
            rag_prompt = f"""Use the following context to answer the question. If the answer cannot be found in the context, say "I don't have enough information to answer this question."

Context:
{context}

Question: {query}

Answer:"""

            # Generate response using Ollama
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": model,
                    "prompt": rag_prompt,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', 'Sorry, I could not generate a response.')
            else:
                logger.error(f"Ollama API error: {response.status_code}")
                return "Sorry, there was an error generating the response."
                
        except Exception as e:
            logger.error(f"Error generating RAG response: {str(e)}")
            return "Sorry, there was an error processing your request."
    
    def list_documents(self) -> List[dict]:
        """List all documents in the collection"""
        try:
            result = self.collection.get()
            
            # Group by source document
            documents = {}
            for i, metadata in enumerate(result['metadatas']):
                source = metadata.get('source', 'unknown')
                if source not in documents:
                    documents[source] = {
                        'source': source,
                        'chunk_count': 0
                    }
                documents[source]['chunk_count'] += 1
            
            return list(documents.values())
            
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            return []
    
    def delete_document(self, filename: str) -> bool:
        """Delete all chunks from a specific document"""
        try:
            # Get all items with the specific source
            result = self.collection.get()
            ids_to_delete = []
            
            for i, metadata in enumerate(result['metadatas']):
                if metadata.get('source') == filename:
                    ids_to_delete.append(result['ids'][i])
            
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} chunks from {filename}")
                return True
            else:
                logger.warning(f"No chunks found for {filename}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting document {filename}: {str(e)}")
            return False
    
    def check_embedding_model_available(self) -> bool:
        """Check if the embedding model is available in Ollama"""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags")
            if response.status_code == 200:
                models = response.json()
                available_models = [model['name'] for model in models.get('models', [])]
                
                # Check for exact match or with :latest tag
                return (self.embedding_model in available_models or 
                        f"{self.embedding_model}:latest" in available_models or
                        any(model.startswith(f"{self.embedding_model}:") for model in available_models))
            return False
        except Exception as e:
            logger.error(f"Error checking embedding model: {str(e)}")
            return False

# Global RAG manager instance
rag_manager = None

def get_rag_manager() -> RAGManager:
    """Get or create global RAG manager instance"""
    global rag_manager
    if rag_manager is None:
        rag_manager = RAGManager()
    return rag_manager 