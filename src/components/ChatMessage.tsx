import React, { useEffect, useState } from 'react';
import { formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, Check, User, Bot } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { OutputBlock } from '@/components/OutputBlock';
import { ParsedAssistantContent } from '@/types';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string | { text: string; image?: string } | ParsedAssistantContent;
  timestamp?: Date;
  isLoading?: boolean;
  isStreaming?: boolean;
  style?: 'default' | 'modern';
}

export function ChatMessage({ 
  role, 
  content, 
  timestamp = new Date(), 
  isLoading = false,
  isStreaming = false,
  style = 'default'
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  const [showCursor, setShowCursor] = useState(true);
  
  const isUser = role === 'user';
  const isModernStyle = style === 'modern';
  
  // Blinking cursor effect for streaming
  useEffect(() => {
    if (!isStreaming) return;
    
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(interval);
  }, [isStreaming]);
  
  // Handle loading state with skeleton
  if (isLoading && !isUser) {
    if (isModernStyle) {
      return (
        <div className="group relative px-4 md:px-8">
          <div className="absolute left-2 top-1">
            <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow-sm">
              <Bot size={20} />
            </div>
          </div>
          <div className="pl-12 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex justify-start">
        <div className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground max-w-[80%] space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }
  
  // Handle different content types
  const getMessageContent = (): string => {
    if (typeof content === 'string') return content;
    if ('text' in content) return content.text;
    if ('rawContent' in content) return content.rawContent;
    return '';
  };

  const getImageUrl = (): string | undefined => {
    if (typeof content === 'string' || 'rawContent' in content) return undefined;
    return content.image;
  };

  const getParsedContent = (): ParsedAssistantContent | null => {
    if (typeof content === 'object' && 'blocks' in content) {
      return content;
    }
    return null;
  };

  const messageContent = getMessageContent();
  const hasImage = getImageUrl() !== undefined;
  const parsedContent = getParsedContent();
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Modern ChatGPT-like style
  if (isModernStyle) {
    return (
      <div className={`group relative px-4 md:px-8 ${isUser ? 'bg-muted/50' : 'bg-background'}`}>
        <div className="absolute left-2 top-1">
          <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow-sm ${
            isUser ? 'bg-primary text-primary-foreground' : 'bg-background'
          }`}>
            {isUser ? <User size={20} /> : <Bot size={20} />}
          </div>
        </div>
        
        <div className="py-3 pl-12 pr-12 space-y-2">
          {hasImage && (
            <div className="mb-3">
              <img 
                src={getImageUrl() || ''} 
                alt="Uploaded image"
                className="rounded-md max-h-80 max-w-full object-contain"
              />
            </div>
          )}
          
          {parsedContent ? (
            <div className="space-y-3">
              {parsedContent.blocks.map((block, index) => (
                <OutputBlock key={index} block={block} />
              ))}
              {isStreaming && showCursor && <span className="animate-pulse">▋</span>}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm sm:text-base max-w-none leading-relaxed overflow-auto">
              {messageContent}
              {isStreaming && showCursor && <span className="animate-pulse">▋</span>}
            </div>
          )}
        </div>
        
        {role === 'assistant' && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={copyToClipboard}
              title="Copy to clipboard"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Default bubble style
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`relative px-3 sm:px-4 py-2 rounded-lg max-w-[95%] sm:max-w-[80%] ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        }`}
      >
        {role === 'assistant' && (
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={copyToClipboard}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        )}
        
        {hasImage && (
          <div className="mb-2">
            <img 
              src={getImageUrl() || ''} 
              alt="Uploaded image"
              className="rounded-md max-h-60 max-w-full object-contain"
            />
          </div>
        )}
        
        {parsedContent ? (
          <div className="space-y-3">
            {parsedContent.blocks.map((block, index) => (
              <OutputBlock key={index} block={block} />
            ))}
            {isStreaming && showCursor && <span className="animate-pulse">▋</span>}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed overflow-auto">
            {messageContent}
            {isStreaming && showCursor && <span className="animate-pulse">▋</span>}
          </div>
        )}
        
        <div className="text-xs opacity-70 mt-1 text-right">
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
} 