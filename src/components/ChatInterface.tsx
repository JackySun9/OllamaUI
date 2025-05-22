import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Button } from '@/components/ui/button';
import { ChatHistory, ModelSelection, ModelSettings as ModelSettingsType, MessageContent } from '@/types';
import { createChatStream } from '@/lib/api';
import { Trash2, Eraser, History, ExternalLink, ArrowLeft } from 'lucide-react';

// Storage key prefix for chat history
const CHAT_HISTORY_STORAGE_PREFIX = 'ollama-webui-chat-history';

interface ChatInterfaceProps {
  selectedModel: ModelSelection | null;
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
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

export function ChatInterface({ 
  selectedModel, 
  modelSettings, 
  // Prefixing with underscore to indicate it's intentionally not used
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSettingsChange: _onSettingsChange 
}: ChatInterfaceProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef<{ close: () => void } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pastConversations, setPastConversations] = useState<ConversationMeta[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  // Extract summary/title from conversation
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

  // Get the last message from a conversation
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

  // Load chat history from localStorage when model changes
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    // Load current model's conversations
    loadConversationsForModel();
    
    // Check if we have an active conversation going
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
          }
        } catch (err) {
          console.error('Failed to parse saved chat history:', err);
          // If there's an error parsing, we'll just start with an empty history
          setChatHistory([]);
        }
      } else {
        setChatHistory([]);
      }
    } else {
      // No current conversation, start a new one
      const newId = generateConversationId();
      setCurrentConversationId(newId);
      localStorage.setItem(`${storageKey}-current`, newId);
      setChatHistory([]);
    }
  }, [selectedModel]);

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
      
      // Update conversation list
      loadConversationsForModel();
    } else if (chatHistory.length === 0 && currentConversationId) {
      // If chat was cleared but we want to keep the same conversation ID
      localStorage.removeItem(`${storageKey}-${currentConversationId}`);
      
      // Update conversation list
      loadConversationsForModel();
    }
  }, [chatHistory, selectedModel, currentConversationId]);

  // Load all conversations for the current model
  const loadConversationsForModel = () => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    const conversations: ConversationMeta[] = [];
    const prefix = `${storageKey}-`;
    
    // Find all keys that match this model's storage pattern
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Skip the "current" pointer
      if (key && key.startsWith(prefix) && !key.endsWith('-current')) {
        const conversationId = key.substring(prefix.length);
        
        try {
          const rawData = localStorage.getItem(key);
          if (rawData) {
            const chatData = JSON.parse(rawData) as StoredChatHistory[];
            
            if (chatData.length > 0) {
              // Find the newest timestamp
              let latestTimestamp = 0;
              for (const message of chatData) {
                if (message.timestamp && message.timestamp > latestTimestamp) {
                  latestTimestamp = message.timestamp;
                }
              }
              
              conversations.push({
                id: conversationId,
                title: getConversationTitle(chatData),
                lastMessage: getLastMessage(chatData),
                timestamp: latestTimestamp || Date.now(),
                messageCount: chatData.length
              });
            }
          }
        } catch (err) {
          console.error(`Error loading conversation ${conversationId}:`, err);
        }
      }
    }
    
    // Sort by timestamp, newest first
    conversations.sort((a, b) => b.timestamp - a.timestamp);
    setPastConversations(conversations);
  };

  // Load a specific conversation
  const loadConversation = (conversationId: string) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    // If there's an active stream, close it
    if (streamingRef.current) {
      streamingRef.current.close();
      streamingRef.current = null;
      setIsLoading(false);
    }
    
    // Load the selected conversation
    const savedHistory = localStorage.getItem(`${storageKey}-${conversationId}`);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          // Remove timestamp property when loading history for UI display
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const displayHistory = parsedHistory.map(({ timestamp, ...item }: StoredChatHistory) => item as ChatHistory);
          setChatHistory(displayHistory);
          setCurrentConversationId(conversationId);
          localStorage.setItem(`${storageKey}-current`, conversationId);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
        setError('Failed to load conversation');
      }
    }
    
    // Close the history panel
    setShowHistory(false);
  };

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
    setShowHistory(false);
  };

  // Delete a specific conversation
  const deleteConversation = (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering loadConversation
    
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    // Remove the conversation from localStorage
    localStorage.removeItem(`${storageKey}-${conversationId}`);
    
    // If this was the current conversation, start a new one
    if (conversationId === currentConversationId) {
      startNewConversation();
    }
    
    // Update the conversation list
    loadConversationsForModel();
  };

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
    
    // Start a new conversation instead of just clearing
    startNewConversation();
  };

  // Function to clear all chat histories across all models
  const clearAllChatHistories = () => {
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
    
    // Clear the conversations list
    setPastConversations([]);
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    
    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise return full date
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Chat</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1"
            title="View history"
          >
            <History size={16} />
            <span className="hidden sm:inline">History</span>
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearChat}
            title="Start new chat"
            disabled={isLoading}
          >
            <ExternalLink size={14} className="mr-1" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all chat history?')) {
                clearAllChatHistories();
              }
            }}
            disabled={isLoading}
            title="Clear history across all models"
          >
            <Eraser size={14} className="mr-1" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="mb-4 p-3 border rounded-md bg-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Chat History</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(false)}
            >
              <ArrowLeft size={14} />
              <span className="ml-1">Close</span>
            </Button>
          </div>
          
          {pastConversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-3">
              No saved conversations found
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[300px] space-y-2">
              {pastConversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className={`p-2 rounded cursor-pointer hover:bg-muted text-sm ${
                    conversation.id === currentConversationId ? 'bg-muted border border-muted-foreground/20' : ''
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium truncate flex-1">{conversation.title}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-1"
                      onClick={(e) => deleteConversation(conversation.id, e)}
                      title="Delete conversation"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{formatTimestamp(conversation.timestamp)}</span>
                    <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                      {conversation.messageCount} msgs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={startNewConversation}
          >
            <ExternalLink size={14} className="mr-1" />
            Start New Conversation
          </Button>
        </div>
      )}

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