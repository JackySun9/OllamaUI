'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Upload, 
  FileText, 
  Trash2, 
  Database, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Brain,
  Search
} from 'lucide-react'

interface Document {
  source: string
  chunk_count: number
}

interface RAGStatus {
  available: boolean
  embedding_model?: string
  embedding_model_available?: boolean
  collection_name?: string
  error?: string
}

interface UploadResponse {
  success: boolean
  message: string
  filename?: string
}

export default function RAGManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeletingDoc, setIsDeletingDoc] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Load initial data
  useEffect(() => {
    loadRAGStatus()
    loadDocuments()
  }, [])

  const loadRAGStatus = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${API_BASE_URL}/rag/status`)
      const status = await response.json()
      setRagStatus(status)
    } catch (error) {
      console.error('Error loading RAG status:', error)
      setRagStatus({ available: false, error: 'Failed to connect to RAG service' })
    }
  }

  const loadDocuments = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${API_BASE_URL}/rag/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = ['application/pdf', 'text/plain']
      if (!allowedTypes.includes(file.type)) {
        setUploadMessage({ 
          type: 'error', 
          text: 'Only PDF and TXT files are supported' 
        })
        return
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadMessage({ 
          type: 'error', 
          text: 'File size must be less than 10MB' 
        })
        return
      }
      
      setSelectedFile(file)
      setUploadMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${API_BASE_URL}/rag/upload`, {
        method: 'POST',
        body: formData,
      })

      const result: UploadResponse = await response.json()

      if (result.success) {
        setUploadMessage({ 
          type: 'success', 
          text: result.message 
        })
        setSelectedFile(null)
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        
        // Reload documents
        loadDocuments()
      } else {
        setUploadMessage({ 
          type: 'error', 
          text: result.message 
        })
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadMessage({ 
        type: 'error', 
        text: 'Failed to upload file. Please try again.' 
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (filename: string) => {
    setIsDeletingDoc(filename)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const response = await fetch(`${API_BASE_URL}/rag/documents/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUploadMessage({ 
          type: 'success', 
          text: `Document "${filename}" deleted successfully` 
        })
        loadDocuments()
      } else {
        const error = await response.json()
        setUploadMessage({ 
          type: 'error', 
          text: error.detail || 'Failed to delete document' 
        })
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      setUploadMessage({ 
        type: 'error', 
        text: 'Failed to delete document. Please try again.' 
      })
    } finally {
      setIsDeletingDoc(null)
    }
  }

  if (!ragStatus) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>RAG Knowledge Base</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading RAG status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ragStatus.available) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>RAG Knowledge Base</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              RAG functionality is not available. {ragStatus.error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>RAG Knowledge Base</CardTitle>
          </div>
          <CardDescription>
            Upload documents to enhance AI responses with your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Collection: {ragStatus.collection_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-green-500" />
              <span className="text-sm">Model: {ragStatus.embedding_model}</span>
            </div>
            <div className="flex items-center gap-2">
              {ragStatus.embedding_model_available ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {ragStatus.embedding_model_available ? 'Model Available' : 'Model Not Found'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Support for PDF and TXT files (max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">Choose file</Label>
            <Input 
              id="file-upload" 
              type="file" 
              accept=".pdf,.txt"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <Badge variant="secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full md:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>

          {uploadMessage && (
            <Alert className={uploadMessage.type === 'error' ? 'border-red-200' : 'border-green-200'}>
              {uploadMessage.type === 'error' ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={uploadMessage.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                {uploadMessage.text}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documents List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Knowledge Base Documents
          </CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? 's' : ''} in knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first document to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4" />
                      <div>
                        <span className="font-medium">{doc.source}</span>
                        <div className="text-sm text-muted-foreground">
                          {doc.chunk_count} chunk{doc.chunk_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.source)}
                      disabled={isDeletingDoc === doc.source}
                    >
                      {isDeletingDoc === doc.source ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {index < documents.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 