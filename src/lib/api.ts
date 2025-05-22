import { Provider, ChatRequest, ChatResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const getProviders = async (): Promise<Provider[]> => {
  const response = await fetch(`${API_BASE_URL}/providers`);
  if (!response.ok) {
    throw new Error('Failed to fetch providers');
  }
  const data = await response.json();
  return data.providers;
};

export const getModels = async (provider: string): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/models/${provider}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch models for provider: ${provider}`);
  }
  const data = await response.json();
  return data.models;
};

export const sendChatMessage = async (
  payload: ChatRequest
): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }
  
  return response.json();
};

export const createChatStream = (
  payload: ChatRequest,
  onMessage: (data: Record<string, unknown>) => void,
  onError: (error: Error | unknown) => void,
  onClose: () => void
) => {
  const ws = new WebSocket(`ws://${API_BASE_URL.replace(/^http[s]?:\/\//, '')}/chat/stream`);
  
  ws.onopen = () => {
    ws.send(JSON.stringify(payload));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      onError(error);
    }
  };
  
  ws.onerror = (error) => {
    onError(error);
  };
  
  ws.onclose = () => {
    onClose();
  };
  
  return {
    close: () => ws.close(),
  };
}; 