// app/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { SimpleHistory } from '@/components/SimpleHistory';
import { ModelSettings as ModelSettingsType, ChatHistory } from '@/types';
import { ModeToggle } from '@/components/ModeToggle';
import { Plus, BookOpen, FileText, ArrowLeft, User } from 'lucide-react';
import { SystemPromptLearningDashboard } from '@/components/SystemPromptLearningDashboard';
import Link from 'next/link';
import { sendChatMessage } from '@/lib/api';
import { ModelProvider, useModel } from '@/contexts/ModelContext';
import { loadConversationData } from '@/lib/conversationUtils';

function HomeContent() {
  const { selectedModel, setSelectedModel } = useModel();
  const [modelSettings, setModelSettings] = useState<ModelSettingsType>({
    systemPrompt: '',
    temperature: 0.7,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');
  const [newChat, setNewChat] = useState(false);
  const [learningMode, setLearningMode] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Ref to the ChatInterface to call its methods
  const chatInterfaceRef = useRef<{ 
    loadConversation: (history: ChatHistory[], conversationId: string) => void;
    getCurrentConversationId: () => string | null;
  }>(null);

  // Check for mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Handle starting a new chat
  const handleNewChat = useCallback(() => {
    console.debug('Starting new chat...');
    setNewChat(true);
    if (isMobile) {
      setMobileView('chat');
    }
  }, [isMobile]);

  // When chat loads, reset the new chat flag
  const handleChatLoad = useCallback(() => {
    setNewChat(false);
  }, []);

  // Handle conversation loading from history
  const handleLoadConversation = useCallback((modelString: string, conversationId: string) => {
    console.debug(`Loading conversation: ${modelString}::${conversationId}`);
    const conversationData = loadConversationData(modelString, conversationId);
    
    // Load the conversation into the chat interface
    if (chatInterfaceRef.current && conversationData.length > 0) {
      chatInterfaceRef.current.loadConversation(conversationData, conversationId);
    }
    
    // Update current conversation ID
    setCurrentConversationId(conversationId);
    
    // Switch to chat view on mobile
    if (isMobile) {
      setMobileView('chat');
    }
  }, [isMobile]);

  // Handle new conversation creation
  const handleNewConversation = useCallback((conversationId: string) => {
    console.debug(`New conversation created: ${conversationId}`);
    setCurrentConversationId(conversationId);
  }, []);

  // Handle testing prompts for the learning dashboard
  const handleTestPrompt = async (prompt: string, userMessage: string): Promise<string> => {
    if (!selectedModel) {
      return "Please select a model first to test prompts.";
    }

    try {
      const messages = [
        { role: 'system' as const, content: prompt },
        { role: 'user' as const, content: userMessage }
      ];

      const payload = {
        model: `${selectedModel.provider}/${selectedModel.model}`,
        messages,
        temperature: modelSettings.temperature,
        stream: false
      };

      const response = await sendChatMessage(payload);
      
      if (response?.message?.content) {
        return typeof response.message.content === 'string' 
          ? response.message.content 
          : JSON.stringify(response.message.content);
      }
      
      return "No response received from the model.";
    } catch (error) {
      console.error('Error testing prompt:', error);
      return `Error: Could not test prompt. ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // If in learning mode, show the learning dashboard
  if (learningMode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLearningMode(false)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
              <h1 className="text-xl font-semibold">System Prompt Learning Lab</h1>
            </div>
            <ModeToggle />
          </div>
        </div>
        
        <SystemPromptLearningDashboard
          selectedModel={selectedModel}
          modelSettings={modelSettings}
          onSettingsChange={setModelSettings}
          onTestPrompt={handleTestPrompt}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile header */}
      {isMobile && (
        <header className="flex justify-between items-center border-b p-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setMobileView('sidebar')}
            className={mobileView === 'chat' ? 'block' : 'hidden'}
          >
            <User size={20} />
          </Button>
          
          <h1 className="text-lg font-semibold">Ollama WebUI</h1>
          
          <ModeToggle />
        </header>
      )}
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 flex-shrink-0 border-r flex flex-col h-full bg-muted/30 ${
          isMobile ? (mobileView === 'sidebar' ? 'block' : 'hidden') : 'block'
        }`}>
          <div className="p-3 flex flex-col h-full">
            {/* New chat button */}
            <Button 
              onClick={handleNewChat}
              className="mb-4 w-full justify-start"
              variant="outline"
            >
              <Plus size={16} className="mr-2" />
              New Chat
            </Button>
            
            {/* Learning Mode Button */}
            <Button 
              onClick={() => setLearningMode(true)}
              className="mb-4 w-full justify-start"
              variant="secondary"
            >
              <BookOpen size={16} className="mr-2" />
              Learning Lab
            </Button>
            
            {/* Markdown Demo Link */}
            <Link href="/markdown-demo" className="mb-4">
              <Button 
                className="w-full justify-start"
                variant="ghost"
              >
                <FileText size={16} className="mr-2" />
                Markdown Demo
              </Button>
            </Link>
            
            {/* Simple Chat history */}
            <div className="flex-1 mb-4 overflow-y-auto">
              <h2 className="font-medium mb-2 text-sm">Chat History</h2>
              <SimpleHistory 
                onSelectConversation={() => isMobile && setMobileView('chat')}
                onStartNewChat={handleNewChat}
                onLoadConversation={handleLoadConversation}
                newConversationId={currentConversationId}
              />
            </div>
            
            {/* Footer */}
            <div className="mt-auto border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ollama WebUI</span>
                <ModeToggle />
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main chat area */}
        <main className={`flex-1 flex flex-col h-full ${
          isMobile ? (mobileView === 'chat' ? 'block' : 'hidden') : 'block'
        }`}>
          {isMobile && mobileView === 'chat' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMobileView('sidebar')}
              className="absolute top-14 left-3 z-10"
            >
              <User size={16} className="mr-1" />
              <span className="text-xs">Menu</span>
            </Button>
          )}
          
          <ChatInterface 
            ref={chatInterfaceRef}
            selectedModel={selectedModel} 
            modelSettings={modelSettings}
            onSettingsChange={setModelSettings}
            newChat={newChat}
            onChatLoad={handleChatLoad}
            onNewConversation={handleNewConversation}
          />
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ModelProvider>
      <HomeContent />
    </ModelProvider>
  );
}