export interface Provider {
  id: string;
  name: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ChatMessage {
  role: MessageRole;
  content: string | MessageContent[];
}

// New types for multiple output formats
export type OutputType = 'text' | 'code' | 'command' | 'json' | 'xml' | 'markdown' | 'math' | 'table';

export interface OutputBlock {
  type: OutputType;
  content: string;
  language?: string; // For code blocks (e.g., 'javascript', 'python', 'bash')
  title?: string; // Optional title for the block
  metadata?: Record<string, string | number | boolean>; // Additional metadata
}

export interface ParsedAssistantContent {
  blocks: OutputBlock[];
  rawContent: string; // Keep original content for fallback
}

export interface ChatHistory {
  user: {
    content: string | { 
      text: string;
      image?: string;
    };
  };
  assistant: {
    content: string | ParsedAssistantContent;
  };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  system_prompt?: string;
  temperature: number;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  model: string;
}

export interface ModelSettings {
  systemPrompt: string;
  temperature: number;
}

export interface ModelSelection {
  provider: string;
  model: string;
  manualModelString?: string;
} 