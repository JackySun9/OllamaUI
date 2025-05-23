import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemPromptLibrary } from '@/components/SystemPromptLibrary';
import { SystemPromptComparison } from '@/components/SystemPromptComparison';
import { ModelSettings } from '@/components/ModelSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModelSettings as ModelSettingsType, ModelSelection } from '@/types';
import { BookOpen, GitCompare, Settings, Lightbulb, Trophy, Target } from 'lucide-react';

interface SystemPromptLearningDashboardProps {
  selectedModel: ModelSelection | null;
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
  onTestPrompt: (prompt: string, userMessage: string) => Promise<string>;
}

export function SystemPromptLearningDashboard({
  selectedModel,
  modelSettings,
  onSettingsChange,
  onTestPrompt
}: SystemPromptLearningDashboardProps) {
  const [currentTab, setCurrentTab] = useState('overview');

  const handlePromptSelect = (prompt: string) => {
    onSettingsChange({
      ...modelSettings,
      systemPrompt: prompt
    });
    // Switch to settings tab to show the applied prompt
    setCurrentTab('settings');
  };

  const learningModules = [
    {
      id: 'basics',
      title: 'System Prompt Basics',
      description: 'Learn what system prompts are and how they work',
      level: 'Beginner',
      tasks: [
        'Try the "Helpful Assistant" prompt',
        'Compare with no system prompt',
        'Notice the difference in tone'
      ]
    },
    {
      id: 'roles',
      title: 'Role-Based Prompts',
      description: 'Explore how different roles affect AI behavior',
      level: 'Beginner',
      tasks: [
        'Test the "Creative Writer" prompt',
        'Try the "Math Tutor" prompt',
        'Ask the same question to both'
      ]
    },
    {
      id: 'comparison',
      title: 'Prompt Comparison',
      description: 'Learn to compare different prompts systematically',
      level: 'Intermediate',
      tasks: [
        'Use the comparison tool',
        'Test with different question types',
        'Analyze the differences'
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Techniques',
      description: 'Master sophisticated prompting strategies',
      level: 'Advanced',
      tasks: [
        'Create custom system prompts',
        'Combine multiple techniques',
        'Test edge cases'
      ]
    }
  ];

  const promptingTips = [
    {
      title: 'Be Specific About Role',
      description: 'Instead of "helpful assistant", try "experienced software engineer" or "patient math tutor"',
      example: 'You are an experienced software engineer specializing in Python web development.'
    },
    {
      title: 'Set Clear Behavior Guidelines',
      description: 'Specify how the AI should respond, what tone to use, and what to avoid',
      example: 'Always ask clarifying questions before providing code solutions. Be concise but thorough.'
    },
    {
      title: 'Include Output Format',
      description: 'Tell the AI how to structure responses for consistency',
      example: 'Structure your responses as: 1) Brief summary, 2) Detailed explanation, 3) Example'
    },
    {
      title: 'Use Context and Constraints',
      description: 'Provide relevant context and any limitations or requirements',
      example: 'You are helping a beginner. Use simple language and provide examples for complex concepts.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">System Prompt Learning Lab</h1>
          <p className="text-lg text-muted-foreground">
            Master the art of prompt engineering through hands-on experimentation
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Challenges
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    What are System Prompts?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    System prompts are instructions that define how an AI should behave, what role it should take, 
                    and how it should respond to users. They're like giving the AI a character and set of guidelines 
                    before the conversation begins.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-medium">Key Benefits:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Consistent AI behavior</li>
                      <li>• Specialized expertise simulation</li>
                      <li>• Controlled tone and style</li>
                      <li>• Enhanced task performance</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">💡 Learning Tip</h4>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      For faster experimentation, consider using smaller models (e.g., llama3.2:3b) instead of large ones (e.g., devstral:24b). Smaller models respond much quicker and are perfect for learning prompt engineering concepts.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Path</CardTitle>
                  <CardDescription>
                    Follow this structured approach to master system prompts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {learningModules.map((module, index) => (
                      <div key={module.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{index + 1}. {module.title}</h4>
                          <Badge variant={module.level === 'Beginner' ? 'default' : module.level === 'Intermediate' ? 'secondary' : 'destructive'}>
                            {module.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <div className="space-y-1">
                          {module.tasks.map((task, taskIndex) => (
                            <div key={taskIndex} className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="w-2 h-2 bg-muted rounded-full" />
                              {task}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prompting Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Pro Tips for Effective System Prompts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {promptingTips.map((tip, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <p className="text-xs text-muted-foreground">{tip.description}</p>
                      <div className="bg-muted p-2 rounded text-xs">
                        <strong>Example:</strong> {tip.example}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library">
            <SystemPromptLibrary onPromptSelect={handlePromptSelect} />
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            <SystemPromptComparison onTestPrompt={onTestPrompt} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Model Settings</CardTitle>
                <CardDescription>
                  Configure your model settings and test your system prompts here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModelSettings
                  settings={modelSettings}
                  onSettingsChange={onSettingsChange}
                  disabled={!selectedModel}
                />
              </CardContent>
            </Card>

            {selectedModel && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Selected Model</h4>
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm">
                          <strong>Provider:</strong> {selectedModel.provider}
                        </p>
                        <p className="text-sm">
                          <strong>Model:</strong> {selectedModel.model}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Temperature</h4>
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm">
                          {modelSettings.temperature} 
                          <span className="text-muted-foreground ml-2">
                            ({modelSettings.temperature < 0.3 ? 'Precise' : 
                              modelSettings.temperature < 0.7 ? 'Balanced' : 'Creative'})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {modelSettings.systemPrompt && (
                    <div>
                      <h4 className="font-medium mb-2">Current System Prompt</h4>
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm whitespace-pre-wrap">{modelSettings.systemPrompt}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  System Prompt Challenges
                </CardTitle>
                <CardDescription>
                  Test your skills with these practical exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {[
                    {
                      title: "The Translator Challenge",
                      difficulty: "Beginner",
                      description: "Create a system prompt for a translator that explains cultural context",
                      task: "Make the AI translate 'Hello, how are you?' to Spanish and explain cultural nuances"
                    },
                    {
                      title: "The Code Reviewer",
                      difficulty: "Intermediate", 
                      description: "Design a prompt for thorough code reviews",
                      task: "Have the AI review a piece of code for security, performance, and best practices"
                    },
                    {
                      title: "The Socratic Teacher",
                      difficulty: "Advanced",
                      description: "Create a prompt that teaches through questions",
                      task: "Ask about a complex topic and ensure the AI guides you to understanding"
                    }
                  ].map((challenge, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{challenge.title}</h4>
                        <Badge variant={challenge.difficulty === 'Beginner' ? 'default' : 
                                     challenge.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                        <p className="text-sm"><strong>Challenge:</strong> {challenge.task}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Try This Challenge
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 