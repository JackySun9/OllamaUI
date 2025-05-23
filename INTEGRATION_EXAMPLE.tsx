// Example integration for the System Prompt Learning Dashboard
// Add this to your main app component or create a new route

import React, { useState } from 'react';
import { SystemPromptLearningDashboard } from '@/components/SystemPromptLearningDashboard';
import { Button } from '@/components/ui/button';
import { ModelSettings, ModelSelection } from '@/types';
import { BookOpen } from 'lucide-react';

// Example of how to integrate the learning dashboard
export function AppWithLearningMode() {
  const [learningMode, setLearningMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelSelection | null>(null);
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    systemPrompt: '',
    temperature: 0.7
  });

  // Mock function for testing prompts - replace with your actual implementation
  const handleTestPrompt = async (prompt: string, userMessage: string): Promise<string> => {
    // This is where you'd integrate with your existing chat API
    // For now, returning a mock response
    
    // You can use your existing createChatStream function here
    // const response = await createChatStream({
    //   model: selectedModel?.model || 'llama2',
    //   messages: [
    //     { role: 'system', content: prompt },
    //     { role: 'user', content: userMessage }
    //   ],
    //   temperature: modelSettings.temperature,
    //   stream: false
    // });
    
    return `Mock response to "${userMessage}" with system prompt: "${prompt.substring(0, 50)}..."`;
  };

  if (learningMode) {
    return (
      <div className="min-h-screen">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold">Learning Mode</h1>
            <Button 
              variant="outline" 
              onClick={() => setLearningMode(false)}
            >
              Exit Learning Mode
            </Button>
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

  // Your regular app UI
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Ollama WebUI</h1>
          <Button 
            onClick={() => setLearningMode(true)}
            className="gap-2"
            size="lg"
          >
            <BookOpen className="w-5 h-5" />
            Enter Learning Mode
          </Button>
        </div>
        
        {/* Your existing chat interface would go here */}
        <div className="text-center text-muted-foreground">
          <p>Your regular chat interface would be here.</p>
          <p>Click "Enter Learning Mode" to access the system prompt learning tools.</p>
        </div>
      </div>
    </div>
  );
}

// Alternative: Add learning mode as a tab in your existing interface
export function LearningTabExample() {
  return (
    <div className="space-y-4">
      {/* Add this to your existing tabs */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6" />
          <div>
            <h3 className="text-lg font-semibold">System Prompt Learning Lab</h3>
            <p className="text-sm text-muted-foreground">
              Interactive tools to master prompt engineering
            </p>
          </div>
        </div>
        
        <Button className="gap-2">
          <BookOpen className="w-4 h-4" />
          Open Learning Dashboard
        </Button>
      </div>
    </div>
  );
} 