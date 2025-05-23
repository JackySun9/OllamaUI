import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, RotateCcw, Lightbulb } from 'lucide-react';

interface ComparisonResult {
  prompt: string;
  response: string;
  timestamp: number;
}

interface SystemPromptComparisonProps {
  onTestPrompt: (prompt: string, userMessage: string) => Promise<string>;
}

export function SystemPromptComparison({ onTestPrompt }: SystemPromptComparisonProps) {
  const [promptA, setPromptA] = useState('You are a helpful AI assistant.');
  const [promptB, setPromptB] = useState('You are a creative storyteller who speaks in metaphors and vivid imagery.');
  const [testMessage, setTestMessage] = useState('Explain how a computer works.');
  const [resultsA, setResultsA] = useState<ComparisonResult | null>(null);
  const [resultsB, setResultsB] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testPrompts = [
    "Explain how a computer works.",
    "What is the meaning of life?",
    "Write a short story about rain.",
    "How do you make a good decision?",
    "Describe the color blue.",
    "What advice would you give to someone starting their career?",
    "Explain why the sky is blue.",
    "How would you comfort someone who is sad?"
  ];

  const handleRunComparison = async () => {
    if (!testMessage.trim()) return;
    
    setIsLoading(true);
    setResultsA(null);
    setResultsB(null);
    
    try {
      // Test both prompts with the same message
      const [responseA, responseB] = await Promise.all([
        onTestPrompt(promptA, testMessage),
        onTestPrompt(promptB, testMessage)
      ]);
      
      setResultsA({
        prompt: promptA,
        response: responseA,
        timestamp: Date.now()
      });
      
      setResultsB({
        prompt: promptB,
        response: responseB,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error running comparison:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResultsA(null);
    setResultsB(null);
  };

  const swapPrompts = () => {
    const temp = promptA;
    setPromptA(promptB);
    setPromptB(temp);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">System Prompt Comparison</h2>
        <p className="text-muted-foreground">
          Compare how different system prompts affect AI responses to the same input. This helps you understand the impact of prompt engineering.
        </p>
      </div>

      {/* Test Message Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Test Message
          </CardTitle>
          <CardDescription>
            Enter a message to test with both system prompts. Try different types of questions to see varied effects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter your test message here..."
            className="min-h-[80px]"
          />
          
          {/* Quick Test Suggestions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Quick test suggestions:</h4>
            <div className="flex flex-wrap gap-2">
              {testPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setTestMessage(prompt)}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompts Side by Side */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">System Prompt A</CardTitle>
              <Badge variant="outline">Prompt A</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={promptA}
              onChange={(e) => setPromptA(e.target.value)}
              placeholder="Enter your first system prompt..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">System Prompt B</CardTitle>
              <Badge variant="secondary">Prompt B</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={promptB}
              onChange={(e) => setPromptB(e.target.value)}
              placeholder="Enter your second system prompt..."
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button 
          onClick={handleRunComparison}
          disabled={isLoading || !testMessage.trim()}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          {isLoading ? 'Running Comparison...' : 'Run Comparison'}
        </Button>
        
        <Button variant="outline" onClick={swapPrompts} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          Swap Prompts
        </Button>
        
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset Results
        </Button>
      </div>

      {/* Results */}
      {(resultsA || resultsB) && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Comparison Results</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Result A */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Response A</CardTitle>
                  <Badge variant="outline">Prompt A</Badge>
                </div>
                <CardDescription className="text-xs bg-muted p-2 rounded">
                  {promptA}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resultsA ? (
                  <div className="space-y-2">
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{resultsA.response}</p>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="text-center text-muted-foreground">
                    Generating response...
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Result B */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Response B</CardTitle>
                  <Badge variant="secondary">Prompt B</Badge>
                </div>
                <CardDescription className="text-xs bg-muted p-2 rounded">
                  {promptB}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resultsB ? (
                  <div className="space-y-2">
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{resultsB.response}</p>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="text-center text-muted-foreground">
                    Generating response...
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Tips */}
          {resultsA && resultsB && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Compare:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Tone and style differences</li>
                    <li>Level of detail and complexity</li>
                    <li>Structure and organization</li>
                    <li>Creativity vs. accuracy focus</li>
                    <li>Use of examples or metaphors</li>
                    <li>Length and verbosity</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
} 