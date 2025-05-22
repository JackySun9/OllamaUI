import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { ChatHistory, ModelSelection, ModelSettings as ModelSettingsType, MessageContent } from '@/types';
import { createChatStream } from '@/lib/api';
import { Trash2 } from 'lucide-react';

interface ChatInterfaceProps {
  selectedModel: ModelSelection | null;
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
}

export function ChatInterface({ selectedModel, modelSettings, onSettingsChange }: ChatInterfaceProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef<{ close: () => void } | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current) {
        streamingRef.current.close();
      }
    };
  }, []);

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }

    // Create user message for UI
    const userMessage: ChatHistory = {
      user: {
        content: imageBase64
          ? { text, image: imageBase64 }
          : text,
      },
      assistant: {
        content: '',
      },
    };

    setChatHistory([...chatHistory, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Prepare messages for API
      const messages = [
        ...(modelSettings.systemPrompt ? [{ role: 'system' as const, content: modelSettings.systemPrompt }] : []),
        ...chatHistory.flatMap((item: ChatHistory) => {
          let userMessageContent: string | MessageContent[] = [];
          if (typeof item.user.content === 'string') {
            userMessageContent = item.user.content;
          } else {
            userMessageContent = [
              { type: 'text' as const, text: item.user.content.text },
              ...(item.user.content.image 
                ? [{ 
                    type: 'image_url' as const, 
                    image_url: { url: item.user.content.image } 
                  } as MessageContent] 
                : [])
            ];
          }
          
          const turn: {role: 'user' | 'assistant', content: string | MessageContent[]}[] = [
            { role: 'user' as const, content: userMessageContent },
          ];
          if (item.assistant.content) {
            turn.push({ role: 'assistant' as const, content: item.assistant.content });
          }
          return turn;
        }),
        {
          role: 'user' as const,
          content: imageBase64
            ? [
                { type: 'text' as const, text },
                { type: 'image_url' as const, image_url: { url: imageBase64 } }
              ]
            : text
        }
      ];

      // Use the manual model string if provided, otherwise construct from provider/model
      const modelString = selectedModel.manualModelString || 
        (selectedModel.provider === 'ollama' 
          ? `ollama/${selectedModel.model}`
          : selectedModel.model);

      // Initialize empty response for streaming
      setChatHistory(prev => {
        const updatedHistory = [...prev];
        const lastMessage = updatedHistory[updatedHistory.length - 1];
        lastMessage.assistant.content = '';
        return updatedHistory;
      });

      // Set up streaming
      const stream = createChatStream(
        {
          model: modelString,
          messages,
          system_prompt: modelSettings.systemPrompt,
          temperature: modelSettings.temperature,
          stream: true,
        },
        // onMessage handler
        (data) => {
          if (data.error) {
            setError(`Streaming error: ${data.error as string}`);
            return;
          }
          
          // Handle streaming chunk based on backend format
          if (data.chunk) {
            // Process individual chunk
            setChatHistory(prev => {
              const updatedHistory = [...prev];
              const lastMessage = updatedHistory[updatedHistory.length - 1];
              
              if (typeof lastMessage.assistant.content === 'string') {
                lastMessage.assistant.content += data.chunk as string;
              } else {
                lastMessage.assistant.content = String(data.chunk);
              }
              
              return updatedHistory;
            });
          } else if (data.done) {
            // Final message with complete response
            if (typeof data.message === 'object' && data.message && 'content' in data.message) {
              setChatHistory(prev => {
                const updatedHistory = [...prev];
                const lastMessage = updatedHistory[updatedHistory.length - 1];
                
                const message = data.message as { content: unknown };
                const content = message.content;
                lastMessage.assistant.content = typeof content === 'string' ? content : String(content);
                
                return updatedHistory;
              });
            }
            
            // Mark loading as complete
            setIsLoading(false);
          }
        },
        // onError handler
        (err) => {
          console.error('Streaming error:', err);
          setError(err instanceof Error ? err.message : 'Failed to get response from the model');
        },
        // onClose handler
        () => {
          setIsLoading(false);
          streamingRef.current = null;
        }
      );
      
      // Store the stream reference for cleanup
      streamingRef.current = stream;
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response from the model');
      
      // Update chat history with error message
      setChatHistory(prev => {
        const updatedHistory = [...prev];
        const lastMessage = updatedHistory[updatedHistory.length - 1];
        lastMessage.assistant.content = `Error: ${error || 'Failed to get response'}`;
        return updatedHistory;
      });
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    // Close any active stream
    if (streamingRef.current) {
      streamingRef.current.close();
      streamingRef.current = null;
    }
    
    setChatHistory([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Chat</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearChat}
          disabled={chatHistory.length === 0 || isLoading}
        >
          <Trash2 size={14} className="mr-1" />
          <span className="hidden sm:inline">Clear Chat</span>
        </Button>
      </div>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 p-2 sm:p-4 border rounded-md space-y-4 min-h-[300px] max-h-[calc(100vh-300px)] sm:max-h-[500px]"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            <p>Start a conversation by sending a message</p>
          </div>
        ) : (
          <>
            {chatHistory.map((chat, index) => (
              <React.Fragment key={index}>
                <ChatMessage 
                  role="user" 
                  content={chat.user.content} 
                />
                {(chat.assistant.content !== undefined && chat.assistant.content !== '') ? (
                  <ChatMessage 
                    role="assistant" 
                    content={chat.assistant.content} 
                    isStreaming={index === chatHistory.length - 1 && isLoading}
                  />
                ) : (
                  index === chatHistory.length - 1 && isLoading && (
                    <ChatMessage 
                      role="assistant"
                      content=""
                      isLoading={true}
                    />
                  )
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 p-2 bg-destructive/10 border border-destructive text-destructive text-sm rounded">
          {error}
        </div>
      )}

      <div className="mt-auto">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
} 