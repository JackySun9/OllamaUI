import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { ChatHistory, ModelSelection, ModelSettings as ModelSettingsType, MessageContent } from '@/types';
import { createChatStream, sendRAGQuery } from '@/lib/api';
import { parseAssistantContent } from '@/lib/utils';
import { Trash2, Eraser, ExternalLink } from 'lucide-react';
import { ModelDropdown } from '@/components/ModelDropdown';
import { useModel } from '@/contexts/ModelContext';
import RAGToggle from '@/components/RAGToggle';

// Storage key prefix for chat history
const CHAT_HISTORY_STORAGE_PREFIX = 'ollama-webui-chat-history';

interface ChatInterfaceProps {
  selectedModel: ModelSelection | null;
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
  newChat?: boolean;
  onChatLoad?: () => void;
  onNewConversation?: (conversationId: string) => void;
}

export interface ChatInterfaceRef {
  loadConversation: (history: ChatHistory[], conversationId: string) => void;
  getCurrentConversationId: () => string | null;
}

interface StoredChatHistory extends ChatHistory {
  timestamp: number;
}

// Main ChatInterface component with forwardRef
export const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ 
  selectedModel, 
  modelSettings, 
  onSettingsChange,
  newChat = false,
  onChatLoad,
  onNewConversation
}, ref) => {
  const { setSelectedModel } = useModel();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef<{ close: () => void } | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingExistingConversation, setIsLoadingExistingConversation] = useState(false); // Flag to prevent auto-save
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Add streaming buffer and debouncing refs
  const streamingBufferRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    loadConversation: (history: ChatHistory[], conversationId: string) => {
      console.debug(`Loading existing conversation ${conversationId} with`, history.length, 'messages');
      setIsLoadingExistingConversation(true); // Set flag to prevent auto-save
      setCurrentConversationId(conversationId); // Set the conversation ID
      setChatHistory(history);
      setError(null);
      // Reset the flag after a short delay to allow the useEffect to skip the save
      setTimeout(() => setIsLoadingExistingConversation(false), 100);
    },
    getCurrentConversationId: () => currentConversationId
  }));

  // Get the storage key for the current model
  const getStorageKey = () => {
    if (!selectedModel) return null;
    
    const modelString = selectedModel.manualModelString || 
      (selectedModel.provider === 'ollama' 
        ? `ollama/${selectedModel.model}`
        : selectedModel.model);
        
    return `${CHAT_HISTORY_STORAGE_PREFIX}-${modelString}`;
  };

  // Generate unique ID for new conversations
  const generateConversationId = () => {
    return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  // Load chat history from localStorage when model changes or newChat is triggered
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    if (newChat) {
      // Start a new conversation
      startNewConversation();
      if (onChatLoad) onChatLoad();
    } else {
      // Model changed - load existing conversation for this model if available
      const currentConvId = localStorage.getItem(`${storageKey}-current`);
      
      if (currentConvId) {
        setCurrentConversationId(currentConvId);
        const savedHistory = localStorage.getItem(`${storageKey}-${currentConvId}`);
        
        if (savedHistory) {
          try {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
              // Remove timestamp property when loading history for UI display
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const displayHistory = parsedHistory.map(({ timestamp: _, ...item }: StoredChatHistory) => item as ChatHistory);
              setChatHistory(displayHistory);
            } else {
              setChatHistory([]);
            }
          } catch (err) {
            console.error('Failed to parse saved chat history:', err);
            setChatHistory([]);
          }
        } else {
          setChatHistory([]);
        }
      } else {
        // No conversation exists for this model - start fresh but don't create new ID until first message
        setChatHistory([]);
        setCurrentConversationId(null);
      }
      
      if (onChatLoad) onChatLoad();
    }
  }, [selectedModel, newChat]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey || !currentConversationId) return;
    
    // Skip saving if we're currently loading an existing conversation
    if (isLoadingExistingConversation) {
      console.debug('Skipping auto-save while loading existing conversation');
      return;
    }
    
    if (chatHistory.length > 0) {
      console.debug(`Saving conversation ${currentConversationId} with ${chatHistory.length} messages`);
      
      // Add timestamp to each message when storing, but exclude images to save space
      const storedHistory = chatHistory.map(item => ({
        ...item,
        assistant: {
          ...item.assistant,
          // Exclude image data from localStorage to prevent quota issues
          image: undefined
        },
        timestamp: item.hasOwnProperty('timestamp') 
          ? (item as unknown as StoredChatHistory).timestamp 
          : Date.now()
      }));
      
      try {
        localStorage.setItem(`${storageKey}-${currentConversationId}`, JSON.stringify(storedHistory));
        localStorage.setItem(`${storageKey}-current`, currentConversationId);
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, attempting cleanup...');
          
          // Try to clean up old conversations
          const cleanupOldConversations = () => {
            try {
              const keys = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(CHAT_HISTORY_STORAGE_PREFIX)) {
                  keys.push(key);
                }
              }
              
              // Sort by key (which includes timestamp) and remove oldest ones
              keys.sort();
              const keysToRemove = keys.slice(0, Math.max(1, Math.floor(keys.length / 3))); // Remove oldest 1/3
              
              keysToRemove.forEach(key => {
                try {
                  localStorage.removeItem(key);
                  console.debug(`Removed old conversation: ${key}`);
                } catch (e) {
                  console.warn('Failed to remove old conversation:', e);
                }
              });
              
              // Try saving again after cleanup
              localStorage.setItem(`${storageKey}-${currentConversationId}`, JSON.stringify(storedHistory));
              localStorage.setItem(`${storageKey}-current`, currentConversationId);
              console.info('Successfully saved after cleanup');
            } catch (cleanupError) {
              console.error('Failed to save even after cleanup:', cleanupError);
              // Show user-friendly error
              setError('Chat history storage is full. Some older conversations may have been removed to make space.');
            }
          };
          
          cleanupOldConversations();
        } else {
          console.error('Failed to save chat history:', error);
        }
      }
    }
  }, [chatHistory, selectedModel, currentConversationId, isLoadingExistingConversation]);

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
      // Cleanup debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Start a new conversation
  const startNewConversation = () => {
    // If there's an active stream, close it
    if (streamingRef.current) {
      streamingRef.current.close();
      streamingRef.current = null;
    }
    
    // Generate a new conversation ID
    const newId = generateConversationId();
    console.debug(`Starting new conversation with ID: ${newId}`);
    setCurrentConversationId(newId);
    
    // Save the current ID
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(`${storageKey}-current`, newId);
    }
    
    // Clear the chat history
    setChatHistory([]);
    setError(null);
    
    // Notify parent component about the new conversation
    if (onNewConversation) {
      onNewConversation(newId);
    }
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    if (!selectedModel) {
      setError('Please select a model from the dropdown in the top-right corner');
      return;
    }

    // Check if RAG is enabled for this query
    const useRAG = modelSettings.ragEnabled && !imageBase64; // Don't use RAG for image queries

    // Create conversation ID if it doesn't exist
    if (!currentConversationId) {
      const newId = generateConversationId();
      setCurrentConversationId(newId);
      
      // Save the new conversation ID
      const storageKey = getStorageKey();
      if (storageKey) {
        localStorage.setItem(`${storageKey}-current`, newId);
      }
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
      // Handle RAG query if enabled
      if (useRAG) {
        const modelString = selectedModel.manualModelString || 
          (selectedModel.provider === 'ollama' 
            ? `ollama/${selectedModel.model}`
            : selectedModel.model);

        const ragResponse = await sendRAGQuery(text, modelString);
        
        // Update chat history with RAG response
        setChatHistory(prev => {
          const updatedHistory = [...prev];
          const lastMessage = updatedHistory[updatedHistory.length - 1];
          lastMessage.assistant.content = parseAssistantContent(ragResponse.response);
          return updatedHistory;
        });
        
        setIsLoading(false);
        return;
      }
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
            // Extract raw content if it's a parsed response, otherwise use as-is
            const assistantContent = typeof item.assistant.content === 'string' 
              ? item.assistant.content 
              : item.assistant.content.rawContent;
            turn.push({ role: 'assistant' as const, content: assistantContent });
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

      // Reset streaming buffer
      streamingBufferRef.current = '';

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
            // Accumulate chunks in the buffer
            streamingBufferRef.current += data.chunk as string;
            
            // Clear existing debounce timeout
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
            
            // Debounce UI updates to reduce visual duplication
            debounceTimeoutRef.current = setTimeout(() => {
              setChatHistory(prev => {
                const updatedHistory = [...prev];
                const lastMessage = updatedHistory[updatedHistory.length - 1];
                lastMessage.assistant.content = streamingBufferRef.current;
                return updatedHistory;
              });
            }, 50); // 50ms debounce
          } else if (data.done) {
            // Clear any pending debounce timeout
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
              debounceTimeoutRef.current = null;
            }
           
            setChatHistory(prev => {
              const updatedHistory = [...prev];
              const lastMessage = updatedHistory[updatedHistory.length - 1];
              
              let finalContent = '';
              let imageData = undefined;
              
              if (typeof data.message === 'object' && data.message && 'content' in data.message) {
                const message = data.message as { content: unknown; image?: string };
                const content = message.content;
                finalContent = typeof content === 'string' ? content : String(content);
                imageData = message.image;
              } else {
                // Fallback to current content if no final message
                finalContent = typeof lastMessage.assistant.content === 'string' 
                  ? lastMessage.assistant.content 
                  : lastMessage.assistant.content.rawContent;
              }
              
              // Parse the final content for multiple output types
              if (finalContent.trim()) {
                lastMessage.assistant.content = parseAssistantContent(finalContent);
              }
              
              // Add image data if present
              if (imageData) {
                lastMessage.assistant.image = imageData;
              }
              
              return updatedHistory;
            });
            
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

  // Clear chat and start new conversation
  const clearChat = () => {
    // Close any active stream
    if (streamingRef.current) {
      streamingRef.current.close();
      streamingRef.current = null;
    }
    
    // Start a new conversation
    startNewConversation();
  };

  // Function to clear all chat histories across all models
  const clearAllChatHistories = () => {
    if (!window.confirm('Are you sure you want to clear all chat history across all models?')) {
      return;
    }
    
    // Filter localStorage keys to find all chat histories
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CHAT_HISTORY_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    
    // Remove all chat history items
    keys.forEach(key => localStorage.removeItem(key));
    
    // Start a new conversation
    startNewConversation();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Empty state title - Only show when no header */}
      {false && chatHistory.length === 0 && !isLoading && (
        <div className="text-center pt-6 pb-2">
          <h2 className="text-xl font-semibold">Ollama Chat</h2>
          <p className="text-sm text-muted-foreground mt-1">Start a conversation with your selected model</p>
        </div>
      )}
      
      {/* Model selection in header - Always visible */}
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex-1">
          {chatHistory.length === 0 && !isLoading ? (
            <div className="text-lg font-semibold">Ollama Chat</div>
          ) : (
            <div className="text-sm font-medium text-muted-foreground">Chat</div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <RAGToggle 
            enabled={modelSettings.ragEnabled || false}
            onToggle={(enabled) => onSettingsChange({ ...modelSettings, ragEnabled: enabled })}
            disabled={isLoading}
            selectedModel={selectedModel?.model || undefined}
          />
          <ModelDropdown 
            modelSettings={modelSettings}
            onSettingsChange={onSettingsChange}
          />
        </div>
      </div>
      
      {/* Chat container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-2 py-4 md:px-4 space-y-6 scrollbar-thin"
      >
        {!selectedModel ? (
          <div className="h-full flex flex-col items-center justify-center opacity-80 px-4">
            <div className="max-w-md text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">Select a Model to Start</h2>
              <p className="text-muted-foreground mb-6">
                Click the model selector in the top-right to choose a model and begin chatting.
              </p>
              <div className="animate-bounce text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M12 19V5"></path>
                  <path d="m5 12 7-7 7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        ) : chatHistory.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50 px-4">
            <p className="text-center mb-4">No messages yet</p>
            <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
              <div className="col-span-2 text-sm text-center text-muted-foreground mb-2">
                Suggested prompts:
              </div>
              {[
                "Explain quantum computing in simple terms",
                "Write a short story about a robot learning to love",
                "How do I make a delicious chocolate cake?",
                "Create a Python function to calculate prime numbers"
              ].map((prompt, idx) => (
                <Button 
                  key={idx} 
                  variant="outline"
                  className="h-auto py-2 px-3 text-sm text-left normal-case"
                  onClick={() => handleSendMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((chat, index) => (
              <div key={index} className="space-y-6">
                <ChatMessage 
                  role="user" 
                  content={chat.user.content} 
                  style="modern"
                />
                {(chat.assistant.content !== undefined && chat.assistant.content !== '') ? (
                  <ChatMessage 
                    role="assistant" 
                    content={chat.assistant.content} 
                    image={chat.assistant.image}
                    isStreaming={index === chatHistory.length - 1 && isLoading}
                    style="modern"
                  />
                ) : (
                  index === chatHistory.length - 1 && isLoading && (
                    <ChatMessage 
                      role="assistant"
                      content=""
                      isLoading={true}
                      style="modern"
                    />
                  )
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-4 p-2 bg-destructive/10 border border-destructive text-destructive text-sm rounded">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="border-t p-4">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          model={selectedModel?.model || 'unknown'}
        />
        
        <div className="mt-2 flex justify-between items-center px-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearChat}
            className="text-xs text-muted-foreground"
          >
            <ExternalLink size={12} className="mr-1" />
            New chat
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllChatHistories}
            className="text-xs text-muted-foreground"
          >
            <Eraser size={12} className="mr-1" />
            Clear all history
          </Button>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface'; 