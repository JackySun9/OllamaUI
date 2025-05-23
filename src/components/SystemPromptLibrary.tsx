import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, BookOpen, Zap, User, Bot, PenTool, Calculator, Languages } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  example?: string;
}

const systemPrompts: SystemPrompt[] = [
  {
    id: 'helpful-assistant',
    name: 'Helpful Assistant',
    description: 'A friendly, helpful AI assistant',
    category: 'Basic',
    difficulty: 'Beginner',
    icon: <Bot className="w-4 h-4" />,
    prompt: 'You are a helpful, harmless, and honest AI assistant. Provide clear, accurate, and concise responses to the user\'s questions.',
    example: 'Ask: "What is the capital of France?" to see basic helpful behavior.'
  },
  {
    id: 'creative-writer',
    name: 'Creative Writer',
    description: 'Specialized in creative writing and storytelling',
    category: 'Creative',
    difficulty: 'Intermediate',
    icon: <PenTool className="w-4 h-4" />,
    prompt: 'You are a creative writing assistant with expertise in storytelling, poetry, and creative expression. Help users develop compelling narratives, interesting characters, and vivid descriptions. Be imaginative and inspiring while maintaining good writing principles.',
    example: 'Try: "Write a short story about a robot learning to paint" to see creative output.'
  },
  {
    id: 'socratic-teacher',
    name: 'Socratic Teacher',
    description: 'Teaches through questions and guided discovery',
    category: 'Educational',
    difficulty: 'Advanced',
    icon: <BookOpen className="w-4 h-4" />,
    prompt: 'You are a Socratic teacher. Instead of giving direct answers, guide students to discover solutions through thoughtful questions. Ask probing questions that help them think critically and arrive at understanding on their own. Be patient and encouraging.',
    example: 'Ask: "How does photosynthesis work?" to see question-based teaching.'
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code with constructive feedback',
    category: 'Programming',
    difficulty: 'Intermediate',
    icon: <Zap className="w-4 h-4" />,
    prompt: 'You are an experienced software engineer conducting code reviews. Analyze code for:\n- Correctness and functionality\n- Best practices and conventions\n- Performance considerations\n- Security implications\n- Readability and maintainability\n\nProvide constructive feedback with specific suggestions for improvement.',
    example: 'Share some code and ask for a review to see detailed technical feedback.'
  },
  {
    id: 'math-tutor',
    name: 'Math Tutor',
    description: 'Patient math teacher with step-by-step explanations',
    category: 'Educational',
    difficulty: 'Intermediate',
    icon: <Calculator className="w-4 h-4" />,
    prompt: 'You are a patient and encouraging math tutor. Break down complex problems into manageable steps. Show your work clearly, explain the reasoning behind each step, and check for understanding. Adapt your explanations to the student\'s level.',
    example: 'Try: "Solve for x: 2x + 5 = 15" to see step-by-step math guidance.'
  },
  {
    id: 'language-partner',
    name: 'Language Learning Partner',
    description: 'Helps with language learning and practice',
    category: 'Educational',
    difficulty: 'Intermediate',
    icon: <Languages className="w-4 h-4" />,
    prompt: 'You are a friendly language learning partner. Help users practice their target language by:\n- Having conversations at their level\n- Correcting mistakes gently with explanations\n- Teaching new vocabulary in context\n- Explaining grammar rules clearly\n- Encouraging practice and progress\n\nAsk what language they want to practice first.',
    example: 'Say: "I want to practice Spanish" to start a language exchange.'
  },
  {
    id: 'debate-partner',
    name: 'Debate Partner',
    description: 'Engages in respectful, logical debates',
    category: 'Critical Thinking',
    difficulty: 'Advanced',
    icon: <User className="w-4 h-4" />,
    prompt: 'You are an intelligent debate partner who engages in respectful, logical discussions. Present well-reasoned arguments, ask for evidence, point out logical fallacies constructively, and help explore different perspectives on topics. Stay objective and focus on ideas, not personal attacks.',
    example: 'Propose: "Universal basic income would benefit society" to start a debate.'
  }
];

interface SystemPromptLibraryProps {
  onPromptSelect: (prompt: string) => void;
}

export function SystemPromptLibrary({ onPromptSelect }: SystemPromptLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const categories = ['All', ...Array.from(new Set(systemPrompts.map(p => p.category)))];
  
  const filteredPrompts = selectedCategory === 'All' 
    ? systemPrompts 
    : systemPrompts.filter(p => p.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">System Prompt Library</h2>
        <p className="text-muted-foreground">
          Explore different system prompts to understand how they shape AI behavior. Click "Use Prompt" to apply them to your chat.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Prompt Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPrompts.map(prompt => (
          <Card key={prompt.id} className="h-full flex flex-col">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {prompt.icon}
                  <CardTitle className="text-lg">{prompt.name}</CardTitle>
                </div>
                <Badge className={getDifficultyColor(prompt.difficulty)}>
                  {prompt.difficulty}
                </Badge>
              </div>
              <CardDescription>{prompt.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col space-y-4">
              <div className="flex-1">
                <h4 className="font-medium mb-2">System Prompt:</h4>
                <div className="bg-muted p-3 rounded-md text-sm">
                  {prompt.prompt}
                </div>
              </div>
              
              {prompt.example && (
                <div>
                  <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">Try this:</h4>
                  <p className="text-sm text-muted-foreground italic">
                    {prompt.example}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => onPromptSelect(prompt.prompt)}
                  className="flex-1"
                  size="sm"
                >
                  Use Prompt
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(prompt.prompt)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Prompt Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Your Own System Prompt</CardTitle>
          <CardDescription>
            Experiment with your own system prompts. Try different approaches and see how they affect the AI's behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Write your custom system prompt here..."
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button 
              onClick={() => onPromptSelect(customPrompt)}
              disabled={!customPrompt.trim()}
              className="flex-1"
            >
              Use Custom Prompt
            </Button>
            <Button 
              variant="outline"
              onClick={() => setCustomPrompt('')}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 