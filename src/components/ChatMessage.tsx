import React from 'react';
import { formatTimestamp } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string | { text: string; image?: string };
  timestamp?: Date;
}

export function ChatMessage({ role, content, timestamp = new Date() }: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);
  
  const messageContent = typeof content === 'string' ? content : content.text;
  const hasImage = typeof content !== 'string' && content.image;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`relative px-4 py-2 rounded-lg max-w-[80%] ${
          role === 'user' 
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
              src={typeof content !== 'string' ? content.image : ''} 
              alt="Uploaded image"
              className="rounded-md max-h-60 max-w-full object-contain"
            />
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{messageContent}</div>
        
        <div className="text-xs opacity-70 mt-1 text-right">
          {formatTimestamp(timestamp)}
        </div>
      </div>
    </div>
  );
} 