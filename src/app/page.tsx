// app/page.tsx
"use client";

import React, { useState } from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { ChatInterface } from '@/components/ChatInterface';
import { ModelSelection } from '@/types';
import { ModeToggle } from '@/components/ModeToggle';

export default function Home() {
  const [modelSelection, setModelSelection] = useState<ModelSelection | null>(null);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Ollama WebUI</h1>
        <ModeToggle />
      </header>

      <main className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-card rounded-lg shadow-sm p-4 border">
          <h2 className="text-xl font-semibold mb-4">Model Selection</h2>
          <ModelSelector onModelSelect={setModelSelection} />
        </div>

        <div className="md:col-span-3 bg-card rounded-lg shadow-sm p-4 border">
          <ChatInterface selectedModel={modelSelection} />
        </div>
      </main>

      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Ollama WebUI - Built with Next.js, Tailwind CSS, shadcn/ui, and TypeScript
        </p>
      </footer>
    </div>
  );
}