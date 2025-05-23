import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInputButton } from './VoiceInputButton';
import { VoiceLanguageSelector } from './VoiceLanguageSelector';
import { Mic, Volume2, AlertCircle, CheckCircle2 } from 'lucide-react';

export function VoiceInputDemo() {
  const [demoText, setDemoText] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isSupported, setIsSupported] = useState(true);

  const handleDemoTranscript = (text: string) => {
    setDemoText(text);
  };

  const clearDemo = () => {
    setDemoText('');
  };

  const samplePhrases = [
    "Hello, how are you today?",
    "What's the weather like?",
    "Can you help me with this problem?",
    "Tell me a joke",
    "What time is it?",
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Input Demo
          </CardTitle>
          <CardDescription>
            Test the voice input functionality with real-time speech recognition.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser Support Check */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {isSupported ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Voice input is supported in your browser!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Voice input may not be fully supported in your browser. Try Chrome, Edge, or Safari.</span>
              </>
            )}
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Language:</label>
            <VoiceLanguageSelector
              value={language}
              onChange={setLanguage}
            />
          </div>

          {/* Demo Area */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Try Voice Input:</label>
            <div className="flex gap-2">
              <Textarea
                value={demoText}
                onChange={(e) => setDemoText(e.target.value)}
                placeholder="Click the microphone and start speaking..."
                className="flex-1 min-h-[100px]"
              />
              <div className="flex flex-col gap-2">
                <VoiceInputButton
                  onTranscript={handleDemoTranscript}
                  language={language}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearDemo}
                  className="h-10 w-10"
                  title="Clear text"
                >
                  ×
                </Button>
              </div>
            </div>
          </div>

          {/* Sample Phrases */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Try saying these phrases:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {samplePhrases.map((phrase, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setDemoText(phrase)}
                  className="justify-start text-left h-auto py-2 px-3"
                >
                  "{phrase}"
                </Button>
              ))}
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium mb-2">How to use:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Click the microphone button to start recording</li>
              <li>• Speak clearly into your microphone</li>
              <li>• Your speech will be transcribed in real-time</li>
              <li>• Click the microphone again to stop recording</li>
              <li>• Edit the transcribed text if needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="font-medium">Technology</h5>
              <p className="text-muted-foreground">Web Speech API</p>
            </div>
            <div>
              <h5 className="font-medium">Privacy</h5>
              <p className="text-muted-foreground">Local processing only</p>
            </div>
            <div>
              <h5 className="font-medium">Languages</h5>
              <p className="text-muted-foreground">25+ supported</p>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <h5 className="font-medium mb-2">Browser Compatibility:</h5>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">Chrome ✓</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">Edge ✓</span>
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs">Safari ✓</span>
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded text-xs">Firefox ~</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 