// app/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInterface } from '@/components/ChatInterface';
import { ModelSelection } from '@/types';
import { ModeToggle } from '@/components/ModeToggle';

export default function Home() {
  const [modelSelection, setModelSelection] = useState<ModelSelection | null>(null);
  const [mobileView, setMobileView] = useState<'models' | 'chat'>('chat');
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on mobile once when component mounts
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Handle model selection with useCallback to prevent recreation on each render
  const handleModelSelect = useCallback((model: ModelSelection) => {
    setModelSelection(model);
    
    // Switch to chat view on mobile after model selection
    if (isMobile) {
      setMobileView('chat');
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8">
      <header className="flex justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold">Ollama WebUI</h1>
        <div className="flex items-center gap-2">
          <div className="md:hidden flex gap-2">
            <button 
              onClick={() => setMobileView('models')}
              className={`px-3 py-1 text-sm rounded-md ${mobileView === 'models' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
              Models
            </button>
            <button 
              onClick={() => setMobileView('chat')}
              className={`px-3 py-1 text-sm rounded-md ${mobileView === 'chat' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
            >
              Chat
            </button>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className={`md:col-span-1 bg-card rounded-lg shadow-sm p-3 sm:p-4 border ${mobileView === 'models' ? 'block' : 'hidden md:block'}`}>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Model Selection</h2>
          <ModelSelector onModelSelect={handleModelSelect} />
        </div>

        <div className={`md:col-span-3 bg-card rounded-lg shadow-sm p-3 sm:p-4 border ${mobileView === 'chat' ? 'block' : 'hidden md:block'}`}>
          <ChatInterface selectedModel={modelSelection} />
        </div>
      </main>

      <footer className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground">
        <p>
          Ollama WebUI - Built with Next.js, Tailwind CSS, shadcn/ui, and TypeScript
        </p>
      </footer>
    </div>
  );
}