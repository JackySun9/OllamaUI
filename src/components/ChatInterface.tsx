import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { ChatHistory, ModelSelection, ModelSettings as ModelSettingsType, MessageContent } from '@/types';
import { createChatStream } from '@/lib/api';
import { parseAssistantContent } from '@/lib/utils';
import { Trash2, Eraser, ExternalLink } from 'lucide-react';
import { ModelDropdown } from '@/components/ModelDropdown';

// Storage key prefix for chat history
const CHAT_HISTORY_STORAGE_PREFIX = 'ollama-webui-chat-history';

interface ChatInterfaceProps {
  selectedModel: ModelSelection | null;
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
  newChat?: boolean;
  onChatLoad?: () => void;
}

export interface ChatHistoryProps {
  onSelectConversation?: () => void;
  startNewChat?: () => void;
}

interface StoredChatHistory extends ChatHistory {
  timestamp: number;
}

interface ConversationMeta {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
}

// Separate History component for sidebar
export function HistoryComponent({ onSelectConversation, startNewChat }: ChatHistoryProps) {
  const [pastConversations, setPastConversations] = useState<ConversationMeta[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  useEffect(() => {
    // Load all conversations across all models
    loadAllConversations();
    
    // Get current conversation ID from localStorage
    const allModels = getAllModels();
    if (allModels.length > 0) {
      for (const model of allModels) {
        const currentId = localStorage.getItem(`${CHAT_HISTORY_STORAGE_PREFIX}-${model}-current`);
        if (currentId) {
          setCurrentConversationId(currentId);
          setSelectedModel(model);
          break;
        }
      }
    }
  }, []);

  // Get all models that have conversations
  const getAllModels = (): string[] => {
    const models = new Set<string>();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CHAT_HISTORY_STORAGE_PREFIX) && !key.endsWith('-current')) {
        // Extract model name from key
        // Key format: ollama-webui-chat-history-{modelString}-{conversationId}
        const prefixLength = CHAT_HISTORY_STORAGE_PREFIX.length + 1; // +1 for the dash
        const remainingKey = key.substring(prefixLength);
        
        // Find the pattern "-conv-" to separate model string from conversation ID
        // Conversation IDs always start with "conv-" so look for that pattern
        const convPatternIndex = remainingKey.indexOf('-conv-');
        if (convPatternIndex !== -1) {
          const modelString = remainingKey.substring(0, convPatternIndex);
          models.add(modelString);
        }
      }
    }
    
    return Array.from(models);
  };

  // Load all conversations across models
  const loadAllConversations = () => {
    const conversations: ConversationMeta[] = [];
    
    // Find all keys that match any model's storage pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Skip the "current" pointers
      if (key && key.startsWith(CHAT_HISTORY_STORAGE_PREFIX) && !key.endsWith('-current')) {
        try {
          const rawData = localStorage.getItem(key);
          if (rawData) {
            const chatData = JSON.parse(rawData) as StoredChatHistory[];
            
            if (chatData.length > 0) {
              // Extract model and conversation ID from the key
              // Key format: ollama-webui-chat-history-{modelString}-{conversationId}
              const prefixLength = CHAT_HISTORY_STORAGE_PREFIX.length + 1; // +1 for the dash
              const remainingKey = key.substring(prefixLength);
              
              // Find the pattern "-conv-" to separate model string from conversation ID
              // Conversation IDs always start with "conv-" so look for that pattern
              const convPatternIndex = remainingKey.indexOf('-conv-');
              if (convPatternIndex === -1) continue; // Invalid format
              
              const modelString = remainingKey.substring(0, convPatternIndex);
              const conversationId = remainingKey.substring(convPatternIndex + 1); // +1 to skip the dash
              
              // Find the newest timestamp
              let latestTimestamp = 0;
              for (const message of chatData) {
                if (message.timestamp && message.timestamp > latestTimestamp) {
                  latestTimestamp = message.timestamp;
                }
              }
              
              conversations.push({
                id: `${modelString}::${conversationId}`,
                title: getConversationTitle(chatData),
                lastMessage: getLastMessage(chatData),
                timestamp: latestTimestamp || Date.now(),
                messageCount: chatData.length
              });
            }
          }
        } catch (err) {
          console.error(`Error loading conversation from ${key}:`, err);
        }
      }
    }
    
    // Sort by timestamp, newest first
    conversations.sort((a, b) => b.timestamp - a.timestamp);
    setPastConversations(conversations);
  };

  // Extract title from conversation
  const getConversationTitle = (history: ChatHistory[]): string => {
    if (history.length === 0) return "Empty conversation";
    
    // Use the first user message as the title, truncating if needed
    const firstMessage = typeof history[0].user.content === 'string' 
      ? history[0].user.content 
      : history[0].user.content.text;
      
    return firstMessage.length > 30
      ? firstMessage.substring(0, 30) + '...'
      : firstMessage;
  };

  // Get last message preview
  const getLastMessage = (history: ChatHistory[]): string => {
    if (history.length === 0) return "";
    
    const lastItem = history[history.length - 1];
    const isAssistantMessage = lastItem.assistant && lastItem.assistant.content;
    
    if (isAssistantMessage) {
      return typeof lastItem.assistant.content === 'string'
        ? lastItem.assistant.content.substring(0, 40) + (lastItem.assistant.content.length > 40 ? '...' : '')
        : '';
    } else {
      return typeof lastItem.user.content === 'string'
        ? lastItem.user.content.substring(0, 40) + (lastItem.user.content.length > 40 ? '...' : '')
        : lastItem.user.content.text.substring(0, 40) + (lastItem.user.content.text.length > 40 ? '...' : '');
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (fullId: string) => {
    // Extract model and conversation ID
    // Format: {modelString}::{conversationId}
    const separatorIndex = fullId.indexOf('::');
    if (separatorIndex === -1) return; // Invalid format
    
    const modelString = fullId.substring(0, separatorIndex);
    const conversationId = fullId.substring(separatorIndex + 2);
    
    // Set current conversation in localStorage
    localStorage.setItem(`${CHAT_HISTORY_STORAGE_PREFIX}-${modelString}-current`, conversationId);
    
    // We need to handle model switching and conversation loading
    // selectedModel here is a string, not a ModelSelection object
    if (selectedModel !== modelString) {
      // Need to switch models first, then load the conversation
      // Try to parse the model string to get provider and model
      let provider = 'ollama';
      let model = modelString;
      
      if (modelString.includes('/')) {
        const [providerPart, modelPart] = modelString.split('/', 2);
        provider = providerPart;
        model = modelPart;
      }
      
      const newModelSelection = {
        provider,
        model,
        manualModelString: modelString.includes('/') ? modelString : undefined
      };
      
      // Save the model selection
      localStorage.setItem('ollama-webui-last-model', JSON.stringify(newModelSelection));
      
      // Dispatch event to update model
      window.dispatchEvent(new CustomEvent('model-selected', { 
        detail: newModelSelection 
      }));
    }
    
    // Trigger callback for mobile view
    if (onSelectConversation) {
      onSelectConversation();
    }
    
    // Instead of page reload, dispatch a custom event with conversation details
    window.dispatchEvent(new CustomEvent('conversation-selected', { 
      detail: { 
        modelString, 
        conversationId,
        needsModelChange: selectedModel !== modelString
      } 
    }));
   };

  // Delete a conversation
  const deleteConversation = (fullId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Extract model and conversation ID
    // Format: {modelString}::{conversationId}
    const separatorIndex = fullId.indexOf('::');
    if (separatorIndex === -1) return; // Invalid format
    
    const modelString = fullId.substring(0, separatorIndex);
    const conversationId = fullId.substring(separatorIndex + 2);
    
    // Remove from localStorage
    localStorage.removeItem(`${CHAT_HISTORY_STORAGE_PREFIX}-${modelString}-${conversationId}`);
    
    // If this was the current conversation, handle accordingly
    if (fullId === `${selectedModel}::${currentConversationId}`) {
      // Clear current conversation pointer
      localStorage.removeItem(`${CHAT_HISTORY_STORAGE_PREFIX}-${modelString}-current`);
    }
    
    // Refresh conversation list
    loadAllConversations();
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    
    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today`;
    }
    
    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday`;
    }
    
    // Otherwise return date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // We directly use startNewChat prop in our component

  return (
    <div className="flex flex-col space-y-2">
      {pastConversations.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-3">
          No saved conversations
        </div>
      ) : (
        pastConversations.map(conversation => (
          <div 
            key={conversation.id} 
            className={`p-2 rounded cursor-pointer hover:bg-muted text-sm flex items-center 
                      ${conversation.id === `${selectedModel}::${currentConversationId}` ? 
                        'bg-muted/70 border-l-4 border-primary pl-1.5' : ''}`}
            onClick={() => handleSelectConversation(conversation.id)}
          >
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{conversation.title}</div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-muted-foreground">{formatTimestamp(conversation.timestamp)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 -mr-1"
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
      
      {/* Add a new chat button at the bottom of the list */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => startNewChat && startNewChat()}
        className="mt-2 w-full justify-center text-xs"
      >
        <ExternalLink size={12} className="mr-1" />
        New Chat
      </Button>
    </div>
  );
}

// Main ChatInterface component
export function ChatInterface({ 
  selectedModel, 
  modelSettings, 
  onSettingsChange,
  newChat = false,
  onChatLoad
}: ChatInterfaceProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef<{ close: () => void } | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Add streaming buffer and debouncing refs
  const streamingBufferRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Function to load a specific conversation
  const loadConversation = useCallback((modelString: string, conversationId: string) => {
    const storageKey = `${CHAT_HISTORY_STORAGE_PREFIX}-${modelString}`;
    const savedHistory = localStorage.getItem(`${storageKey}-${conversationId}`);
    
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          // Remove timestamp property when loading history for UI display
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const displayHistory = parsedHistory.map(({ timestamp: _, ...item }: StoredChatHistory) => item as ChatHistory);
          setChatHistory(displayHistory);
          setCurrentConversationId(conversationId);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to parse saved chat history:', err);
        setChatHistory([]);
        setCurrentConversationId(null);
      }
    }
  }, []);

  // Listen for conversation selection events
  useEffect(() => {
    const handleConversationSelection = (event: CustomEvent) => {
      const { modelString, conversationId, needsModelChange } = event.detail;
      
      if (!needsModelChange) {
        // Same model, just load the conversation directly
        loadConversation(modelString, conversationId);
      }
      // If model change is needed, the model-selected event will trigger and load the conversation
    };
    
    window.addEventListener('conversation-selected', handleConversationSelection as EventListener);
    
    return () => {
      window.removeEventListener('conversation-selected', handleConversationSelection as EventListener);
    };
  }, [loadConversation]);

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
    
    if (chatHistory.length > 0) {
      // Add timestamp to each message when storing
      const storedHistory = chatHistory.map(item => ({
        ...item,
        timestamp: item.hasOwnProperty('timestamp') 
          ? (item as unknown as StoredChatHistory).timestamp 
          : Date.now()
      }));
      
      localStorage.setItem(`${storageKey}-${currentConversationId}`, JSON.stringify(storedHistory));
      localStorage.setItem(`${storageKey}-current`, currentConversationId);
    }
  }, [chatHistory, selectedModel, currentConversationId]);

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
      setIsLoading(false);
    }
    
    // Generate a new conversation ID
    const newId = generateConversationId();
    setCurrentConversationId(newId);
    
    // Save the current ID
    const storageKey = getStorageKey();
    if (storageKey) {
      localStorage.setItem(`${storageKey}-current`, newId);
    }
    
    // Clear the chat history
    setChatHistory([]);
    setError(null);
  };

  const handleSendMessage = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    if (!selectedModel) {
      setError('Please select a model from the dropdown in the top-right corner');
      return;
    }

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
              if (typeof data.message === 'object' && data.message && 'content' in data.message) {
                const message = data.message as { content: unknown };
                const content = message.content;
                finalContent = typeof content === 'string' ? content : String(content);
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
        <ModelDropdown 
          selectedModel={selectedModel}
          onModelSelect={(model) => {
            // Save the selection to localStorage
            localStorage.setItem('ollama-webui-last-model', JSON.stringify(model));
            
            // Dispatch an event to update the parent component
            window.dispatchEvent(new CustomEvent('model-selected', { 
              detail: model 
            }));
            
            // No immediate reload - let the UI update naturally
          }}
          modelSettings={modelSettings}
          onSettingsChange={onSettingsChange}
        />
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
} 

// Add History to the ChatInterface object
ChatInterface.History = HistoryComponent; 