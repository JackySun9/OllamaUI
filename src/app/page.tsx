// app/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { ModelSelection, ModelSettings as ModelSettingsType } from '@/types';
import { ModeToggle } from '@/components/ModeToggle';
import { Plus, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// History component is already exported from ChatInterface

export default function Home() {
  const [modelSelection, setModelSelection] = useState<ModelSelection | null>(null);
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');
  const [isMobile, setIsMobile] = useState(false);
  const [modelSettings, setModelSettings] = useState<ModelSettingsType>({
    systemPrompt: '',
    temperature: 0.7,
  });
  const [newChat, setNewChat] = useState(true);
  
  // Check if we're on mobile once when component mounts
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Create a listener for model selection events
    const handleModelSelection = (event: CustomEvent<ModelSelection>) => {
      setModelSelection(event.detail);
    };
    
    window.addEventListener('model-selected', handleModelSelection as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      window.removeEventListener('model-selected', handleModelSelection as EventListener);
    };
  }, []);
  
  // Load the last selected model from localStorage
  useEffect(() => {
    const lastModelJson = localStorage.getItem('ollama-webui-last-model');
    
    if (lastModelJson) {
      try {
        const lastModel = JSON.parse(lastModelJson) as ModelSelection;
        setModelSelection(lastModel);
      } catch (e) {
        console.error('Failed to parse last model selection:', e);
      }
    }
  }, []);

  // Handle starting a new chat
  const handleNewChat = useCallback(() => {
    setNewChat(true);
    if (isMobile) {
      setMobileView('chat');
    }
  }, [isMobile]);

  // When chat loads, reset the new chat flag
  const handleChatLoad = useCallback(() => {
    setNewChat(false);
  }, []);

  // Remove the welcome screen conditional rendering and go directly to the chat interface
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
            
            {/* Chat history will be handled by the ChatInterface */}
            <div className="flex-1 mb-4 overflow-y-auto">
              <h2 className="font-medium mb-2 text-sm">Chat History</h2>
              <ChatInterface.History 
                onSelectConversation={() => isMobile && setMobileView('chat')}
                startNewChat={handleNewChat}
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
            selectedModel={modelSelection} 
            modelSettings={modelSettings}
            onSettingsChange={setModelSettings}
            newChat={newChat}
            onChatLoad={handleChatLoad}
          />
        </main>
      </div>
    </div>
  );
}