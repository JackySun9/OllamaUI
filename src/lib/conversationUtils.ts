import { ChatHistory, ModelSelection } from '@/types';

const CHAT_HISTORY_STORAGE_PREFIX = 'ollama-webui-chat-history';

export interface StoredChatHistory extends ChatHistory {
  timestamp: number;
}

export interface ConversationMeta {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  messageCount: number;
  modelString: string;
  conversationId: string;
}

// Parse model string to ModelSelection object
export const parseModelString = (modelString: string): ModelSelection => {
  let provider = 'ollama';
  let model = modelString;
  
  if (modelString.includes('/')) {
    const [providerPart, modelPart] = modelString.split('/', 2);
    provider = providerPart;
    model = modelPart;
  }
  
  return {
    provider,
    model,
    manualModelString: modelString.includes('/') ? modelString : undefined
  };
};

// Get storage key for a model
export const getStorageKey = (modelString: string): string => {
  return `${CHAT_HISTORY_STORAGE_PREFIX}-${modelString}`;
};

// Load a specific conversation
export const loadConversationData = (modelString: string, conversationId: string): ChatHistory[] => {
  const storageKey = `${getStorageKey(modelString)}-${conversationId}`;
  const savedHistory = localStorage.getItem(storageKey);
  
  if (savedHistory) {
    try {
      const parsedHistory = JSON.parse(savedHistory) as StoredChatHistory[];
      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        // Remove timestamp property when loading history for UI display
        return parsedHistory.map(({ timestamp: _, ...item }) => item as ChatHistory);
      }
    } catch (err) {
      console.error('Failed to parse saved chat history:', err);
    }
  }
  
  return [];
};

// Get all conversations across all models
export const getAllConversations = (): ConversationMeta[] => {
  const conversations: ConversationMeta[] = [];
  const seenIds = new Set<string>(); // Track unique conversation IDs to prevent duplicates
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CHAT_HISTORY_STORAGE_PREFIX) && !key.endsWith('-current')) {
      try {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          const chatData = JSON.parse(rawData) as StoredChatHistory[];
          
          if (chatData.length > 0) {
            // Extract model and conversation ID from the key
            const prefixLength = CHAT_HISTORY_STORAGE_PREFIX.length + 1;
            const remainingKey = key.substring(prefixLength);
            
            const convPatternIndex = remainingKey.indexOf('-conv-');
            if (convPatternIndex === -1) continue;
            
            const modelString = remainingKey.substring(0, convPatternIndex);
            const conversationId = remainingKey.substring(convPatternIndex + 1);
            
            // Create unique ID for deduplication
            const uniqueId = `${modelString}::${conversationId}`;
            
            // Skip if we've already seen this conversation
            if (seenIds.has(uniqueId)) {
              console.debug(`Skipping duplicate conversation: ${uniqueId}`);
              continue;
            }
            seenIds.add(uniqueId);
            
            // Find the newest timestamp
            let latestTimestamp = 0;
            for (const message of chatData) {
              if (message.timestamp && message.timestamp > latestTimestamp) {
                latestTimestamp = message.timestamp;
              }
            }
            
            conversations.push({
              id: uniqueId,
              title: getConversationTitle(chatData),
              lastMessage: getLastMessage(chatData),
              timestamp: latestTimestamp || Date.now(),
              messageCount: chatData.length,
              modelString,
              conversationId
            });
          }
        }
      } catch (err) {
        console.error(`Error loading conversation from ${key}:`, err);
      }
    }
  }
  
  // Sort by timestamp, newest first
  const sortedConversations = conversations.sort((a, b) => b.timestamp - a.timestamp);
  
  console.debug(`Loaded ${sortedConversations.length} unique conversations`);
  return sortedConversations;
};

// Extract title from conversation
const getConversationTitle = (history: ChatHistory[]): string => {
  if (history.length === 0) return "Empty conversation";
  
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

// Set current conversation for a model
export const setCurrentConversation = (modelString: string, conversationId: string): void => {
  localStorage.setItem(`${getStorageKey(modelString)}-current`, conversationId);
};

// Get current conversation for a model
export const getCurrentConversation = (modelString: string): string | null => {
  return localStorage.getItem(`${getStorageKey(modelString)}-current`);
}; 