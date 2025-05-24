'use client'

import React, { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Brain, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react'
import { getRAGStatus, RAGStatus } from '@/lib/api'

interface RAGToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  selectedModel?: string
}

export default function RAGToggle({ enabled, onToggle, disabled = false, selectedModel }: RAGToggleProps) {
  const [ragStatus, setRagStatus] = useState<RAGStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRAGStatus()
  }, [])

  const loadRAGStatus = async () => {
    try {
      setIsLoading(true)
      const status = await getRAGStatus()
      setRagStatus(status)
    } catch (error) {
      console.error('Error loading RAG status:', error)
      setRagStatus({
        available: false,
        error: 'Failed to connect to RAG service'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (checked: boolean) => {
    if (!ragStatus?.available) {
      return // Don't allow toggle if RAG is not available
    }
    onToggle(checked)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading RAG...</span>
      </div>
    )
  }

  if (!ragStatus?.available) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 opacity-50">
              <Brain className="h-4 w-4" />
              <Label className="text-sm cursor-not-allowed">Knowledge Base</Label>
              <Badge variant="secondary" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Unavailable
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              {ragStatus?.error || 'RAG functionality is not available. Make sure the backend is running with RAG dependencies installed.'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const isRAGReady = ragStatus.embedding_model_available
  const canUseRAG = ragStatus.available && isRAGReady

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <Label htmlFor="rag-toggle" className="text-sm cursor-pointer">
                Knowledge Base
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="rag-toggle"
                checked={enabled && canUseRAG}
                onCheckedChange={handleToggle}
                disabled={disabled || !canUseRAG}
              />
              
              <Badge variant={
                enabled && canUseRAG ? "default" : 
                canUseRAG ? "secondary" : 
                "destructive"
              } className="text-xs">
                {enabled && canUseRAG ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : canUseRAG ? (
                  <>
                    <Database className="h-3 w-3 mr-1" />
                    Ready
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {!ragStatus.embedding_model_available ? 'Model Missing' : 'Error'}
                  </>
                )}
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs space-y-2">
            <p className="font-medium">
              {enabled && canUseRAG ? 
                'RAG is active. Your queries will be enhanced with knowledge base content.' :
                canUseRAG ?
                'RAG is ready. Toggle to enhance responses with your knowledge base.' :
                'RAG is not ready.'
              }
            </p>
            
            {ragStatus && (
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>Embedding: {ragStatus.embedding_model || 'Unknown'}</div>
                <div>Generation: {selectedModel || 'No model selected'}</div>
                <div>Collection: {ragStatus.collection_name || 'Unknown'}</div>
                {!ragStatus.embedding_model_available && (
                  <div className="text-yellow-600">
                    ⚠️ Embedding model not found. Run: ollama pull {ragStatus.embedding_model}
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 