import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image, SendHorizontal, X, Bot } from 'lucide-react';
import { imageToBase64 } from '@/lib/utils';
import { VoiceInputButton } from './VoiceInputButton';
import { VoiceLanguageSelector } from './VoiceLanguageSelector';

interface ChatInputProps {
  onSendMessage: (text: string, imageBase64?: string) => void;
  isLoading?: boolean;
  model?: string;
}

export function ChatInput({ onSendMessage, isLoading = false, model }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState('en-US');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Focus management
  useEffect(() => {
    // Focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Refocus textarea after loading completes (response finished)
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !imageFile) || isLoading) return;
    
    let imageBase64: string | undefined = undefined;
    
    if (imageFile) {
      imageBase64 = await imageToBase64(imageFile);
    }
    
    onSendMessage(message, imageBase64);
    setMessage('');
    setImageFile(null);
    setImagePreview(null);
    
    // Refocus the textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle voice input transcript
  const handleVoiceTranscript = (transcript: string, append: boolean = false) => {
    if (append) {
      setMessage(prev => prev + ' ' + transcript);
    } else {
      setMessage(transcript);
    }
    
    // Focus the textarea to show the user where the text was added
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Optional model badge */}
      {model && (
        <div className="flex items-center justify-center mb-2">
          <div className="text-xs bg-muted px-2 py-1 rounded-full inline-flex items-center gap-1">
            <Bot size={12} />
            <span>{model}</span>
          </div>
        </div>
      )}

      {/* Voice language selector */}
      {showLanguageSelector && (
        <div className="mb-2 flex justify-center">
          <VoiceLanguageSelector
            value={voiceLanguage}
            onChange={setVoiceLanguage}
          />
        </div>
      )}
    
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-16 sm:h-20 rounded-md object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X size={14} />
          </Button>
        </div>
      )}
      
      <div className="flex gap-1 sm:gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${model || ''}... (Press Enter to send, Shift+Enter for new line)`}
          className="min-h-[50px] resize-none text-sm sm:text-base p-2 sm:p-3 rounded-xl"
          disabled={isLoading}
        />
        
        <div className="flex flex-col gap-1 sm:gap-2">
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={isLoading}
            language={voiceLanguage}
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="h-10 w-10 rounded-full"
            title="Upload image"
          >
            <Image size={18} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </Button>
          
          <Button
            type="submit"
            disabled={(!message.trim() && !imageFile) || isLoading}
            size="icon"
            className="h-10 w-10 rounded-full"
            title="Send message"
          >
            <SendHorizontal size={18} />
          </Button>
        </div>
      </div>

      {/* Voice settings toggle */}
      <div className="flex justify-center mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Voice Settings
        </Button>
      </div>
    </form>
  );
} 