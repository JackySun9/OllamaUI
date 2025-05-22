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

export interface ChatHistory {
  user: {
    content: string | { 
      text: string;
      image?: string;
    };
  };
  assistant: {
    content: string;
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