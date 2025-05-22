import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ModelSettings } from '@/components/ModelSettings';
import { ChatHistory, ModelSelection, ModelSettings as ModelSettingsType } from '@/types';
import { sendChatMessage } from '@/lib/api';
import { Trash2 } from 'lucide-react';

interface ChatInterfaceProps {
  selectedModel: ModelSelection | null;
}

export function ChatInterface({ selectedModel }: ChatInterfaceProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelSettings, setModelSettings] = useState<ModelSettingsType>({
    systemPrompt: '',
    temperature: 0.7,
  });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

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
          let userMessageContent: string | any[] = [];
          if (typeof item.user.content === 'string') {
            userMessageContent = item.user.content;
          } else {
            userMessageContent.push({ type: 'text', text: item.user.content.text });
            if (item.user.content.image) {
              userMessageContent.push({ type: 'image_url', image_url: { url: item.user.content.image } });
            }
          }
          
          const turn: {role: 'user' | 'assistant', content: string | any[]}[] = [
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
                { type: 'text', text },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            : text
        }
      ];

      // Use the manual model string if provided, otherwise construct from provider/model
      const modelString = selectedModel.manualModelString || 
        (selectedModel.provider === 'ollama' 
          ? `ollama/${selectedModel.model}`
          : selectedModel.model);

      const response = await sendChatMessage({
        model: modelString,
        messages,
        system_prompt: modelSettings.systemPrompt,
        temperature: modelSettings.temperature,
      });

      // Update chat history with AI response
      setChatHistory(prev => {
        const updatedHistory = [...prev];
        const lastMessage = updatedHistory[updatedHistory.length - 1];
        lastMessage.assistant.content = response.message.content as string;
        return updatedHistory;
      });
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
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
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
          Clear Chat
        </Button>
      </div>

      <Accordion type="single" collapsible className="mb-4">
        <AccordionItem value="settings">
          <AccordionTrigger>Settings</AccordionTrigger>
          <AccordionContent>
            <ModelSettings 
              settings={modelSettings} 
              onSettingsChange={setModelSettings} 
              disabled={isLoading}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 p-4 border rounded-md space-y-4 min-h-[300px] max-h-[500px]"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            <p>Start a conversation by sending a message</p>
          </div>
        ) : (
          chatHistory.map((chat, index) => (
            <React.Fragment key={index}>
              <ChatMessage 
                role="user" 
                content={chat.user.content} 
              />
              {chat.assistant.content && (
                <ChatMessage 
                  role="assistant" 
                  content={chat.assistant.content} 
                />
              )}
            </React.Fragment>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
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