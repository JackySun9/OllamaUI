import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink } from 'lucide-react';
import { useModel } from '@/contexts/ModelContext';
import { 
  getAllConversations, 
  parseModelString, 
  setCurrentConversation,
  getCurrentConversation,
  ConversationMeta 
} from '@/lib/conversationUtils';

interface SimpleHistoryProps {
  onSelectConversation?: () => void;
  onStartNewChat?: () => void;
  onLoadConversation?: (modelString: string, conversationId: string) => void;
  newConversationId?: string | null;
}

export const SimpleHistory = memo(function SimpleHistory({ 
  onSelectConversation, 
  onStartNewChat, 
  onLoadConversation,
  newConversationId 
}: SimpleHistoryProps) {
  const { selectedModel, setSelectedModel, getModelString } = useModel();
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations on mount and when model changes
  useEffect(() => {
    console.debug('Model changed, loading conversations...');
    loadConversations();
    
    // Reset current conversation ID when model changes since the conversation list will be different
    const currentModelString = getModelString(selectedModel);
    if (currentModelString) {
      // Check if we have a current conversation for this model
      const currentConv = getCurrentConversation(currentModelString);
      if (currentConv !== currentConversationId) {
        setCurrentConversationId(currentConv);
      }
    } else {
      setCurrentConversationId(null);
    }
  }, [selectedModel]);

  // Update current conversation when newConversationId changes
  useEffect(() => {
    if (newConversationId && newConversationId !== currentConversationId) {
      console.debug(`Updating current conversation ID: ${newConversationId}`);
      setCurrentConversationId(newConversationId);
      // Refresh conversations to show the new one - but only if it's actually new
      loadConversations();
    }
  }, [newConversationId, currentConversationId]);

  const loadConversations = () => {
    console.debug('Loading conversations...');
    const allConversations = getAllConversations();
    setConversations(allConversations);
  };

  const handleSelectConversation = (conversation: ConversationMeta) => {
    console.debug(`Selecting conversation: ${conversation.id}`);
    const currentModelString = getModelString(selectedModel);
    
    // Check if we need to change models
    if (currentModelString !== conversation.modelString) {
      console.debug(`Model change needed: ${currentModelString} -> ${conversation.modelString}`);
      // Parse and set the new model
      const newModel = parseModelString(conversation.modelString);
      setSelectedModel(newModel);
    }
    
    // Set the current conversation
    setCurrentConversation(conversation.modelString, conversation.conversationId);
    setCurrentConversationId(conversation.conversationId);
    
    // Load the conversation data
    if (onLoadConversation) {
      console.debug(`Loading conversation data for: ${conversation.modelString}::${conversation.conversationId}`);
      onLoadConversation(conversation.modelString, conversation.conversationId);
    }
    
    // Handle mobile view
    if (onSelectConversation) {
      onSelectConversation();
    }
  };

  const handleDeleteConversation = (conversation: ConversationMeta, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Remove from localStorage
    const storageKey = `ollama-webui-chat-history-${conversation.modelString}-${conversation.conversationId}`;
    localStorage.removeItem(storageKey);
    
    // If this was the current conversation, clear the current pointer
    const currentModelString = getModelString(selectedModel);
    if (currentModelString === conversation.modelString && 
        currentConversationId === conversation.conversationId) {
      localStorage.removeItem(`ollama-webui-chat-history-${conversation.modelString}-current`);
      setCurrentConversationId(null);
    }
    
    // Refresh the conversation list
    loadConversations();
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getCurrentConversationKey = (): string => {
    const currentModelString = getModelString(selectedModel);
    return `${currentModelString}::${currentConversationId}`;
  };

  return (
    <div className="flex flex-col space-y-2">
      {conversations.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-3">
          No saved conversations
        </div>
      ) : (
        conversations.map(conversation => (
          <div 
            key={conversation.id} 
            className={`p-2 rounded cursor-pointer hover:bg-muted text-sm flex items-center group
                      ${conversation.id === getCurrentConversationKey() ? 
                        'bg-muted/70 border-l-4 border-primary pl-1.5' : ''}`}
            onClick={() => handleSelectConversation(conversation)}
          >
            <div className="flex-1 overflow-hidden">
              <div className="font-medium truncate">{conversation.title}</div>
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(conversation.timestamp)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 -mr-1"
                  onClick={(e) => handleDeleteConversation(conversation, e)}
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onStartNewChat && onStartNewChat()}
        className="mt-2 w-full justify-center text-xs"
      >
        <ExternalLink size={12} className="mr-1" />
        New Chat
      </Button>
    </div>
  );
}); 