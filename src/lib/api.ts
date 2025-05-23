import { Provider, ChatRequest, ChatResponse } from '@/types';

// Interface for raw API provider response (may have different field names)
interface RawApiProvider {
  id?: string;
  name?: string;
  key?: string;
  display_name?: string;
  [key: string]: unknown; // Allow for other unknown fields
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_TIMEOUT = 120000; // Increased to 120 seconds for large models

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
};

// Helper to handle API errors
const handleApiError = async (response: Response, context: string): Promise<never> => {
  let errorMessage = `${context} (Status: ${response.status})`;
  
  try {
    // Try to parse error details from the response
    const errorData = await response.json();
    if (errorData?.detail || errorData?.error || errorData?.message) {
      errorMessage += `: ${errorData.detail || errorData.error || errorData.message}`;
    }
  } catch {
    // If we can't parse JSON, use the status text
    errorMessage += response.statusText ? `: ${response.statusText}` : '';
  }
  
  throw new Error(errorMessage);
};

export const getProviders = async (): Promise<Provider[]> => {
  // Define fallback providers to use if API call fails
  const fallbackProviders: Provider[] = [
    { id: 'ollama', name: 'Ollama' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'openrouter', name: 'OpenRouter' },
    { id: 'groq', name: 'Groq' }
  ];

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/providers`);
    
    if (!response.ok) {
      await handleApiError(response, 'Failed to fetch providers');
    }
    
    const data = await response.json();
    console.log('Raw API response data:', data);
    
    if (!data.providers || !Array.isArray(data.providers) || data.providers.length === 0) {
      console.warn('Invalid or empty provider data received from API. Using fallback providers.');
      return fallbackProviders;
    }
    
    // Validate that providers have the expected structure
    const validProviders = data.providers.filter((provider: any) => 
      provider && 
      typeof provider.id === 'string' && 
      typeof provider.name === 'string' &&
      provider.id.trim() !== '' &&
      provider.name.trim() !== ''
    );
    
    if (validProviders.length === 0) {
      console.warn('No valid providers found after validation. Using fallback providers.');
      return fallbackProviders;
    }
    
    return validProviders;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Provider fetch error: ${error.message}`);
    } else {
      console.error('Unknown error while fetching providers');
    }
    
    // Return fallback providers instead of throwing an error
    console.info('Using fallback providers due to API error');
    return fallbackProviders;
  }
};

export const getModels = async (provider: string): Promise<string[]> => {
  if (!provider) {
    throw new Error('Provider is required to fetch models');
  }
  
  // Define fallback models for each provider
  const fallbackModelsByProvider: Record<string, string[]> = {
    'ollama': ['llama3:latest', 'mistral:latest', 'gemma:latest', 'phi3:latest', 'qwen2:latest'],
    'openai': ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o'],
    'anthropic': ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    'openrouter': ['openai/gpt-4o', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct'],
    'groq': ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']
  };
  
  // Get fallback models for this provider, or a generic fallback if provider not recognized
  const getFallbackModels = () => {
    return fallbackModelsByProvider[provider] || ['default-model'];
  };
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/models/${provider}`);
    
    if (!response.ok) {
      await handleApiError(response, `Failed to fetch models for provider: ${provider}`);
    }
    
    const data = await response.json();
    if (!data.models || !Array.isArray(data.models) || data.models.length === 0) {
      console.warn(`Invalid or empty model data received for provider: ${provider}. Using fallback models.`);
      return getFallbackModels();
    }
    
    return data.models;
  } catch (error) {
    // Provide fallback for any provider
    console.warn(`Error fetching models for ${provider}. Using fallback models.`);
    if (error instanceof Error) {
      console.error(`Model fetch error: ${error.message}`);
    }
    
    return getFallbackModels();
  }
};

export const sendChatMessage = async (
  payload: ChatRequest
): Promise<ChatResponse> => {
  if (!payload.model) {
    throw new Error('Model is required to send a chat message');
  }
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      await handleApiError(response, 'Failed to send chat message');
    }
    
    const data = await response.json();
    if (!data.message || !data.model) {
      throw new Error('Invalid response received from chat API');
    }
    
    return data;
  } catch (error) {
    // Check for specific errors and provide user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        throw new Error(`Request to model ${payload.model} timed out. The model might be loading or processing a large request.`);
      }
      if (payload.model.includes('ollama/') && (
        error.message.includes('Failed to connect') || 
        error.message.includes('Network Error')
      )) {
        throw new Error('Unable to reach the Ollama service. Please ensure Ollama is running on your machine.');
      }
      throw new Error(`Chat error: ${error.message}`);
    }
    throw new Error('Unknown error during chat request');
  }
};

export const createChatStream = (
  payload: ChatRequest,
  onMessage: (data: Record<string, unknown>) => void,
  onError: (error: Error | unknown) => void,
  onClose: () => void
) => {
  if (!payload.model) {
    onError(new Error('Model is required for streaming chat'));
    return { close: () => {} };
  }
  
  // Fix WebSocket URL formation
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsBaseUrl = API_BASE_URL.replace(/^http[s]?:\/\//, '');
  const wsUrl = `${wsProtocol}//${wsBaseUrl}/chat/stream`;
  
  console.log('Connecting to WebSocket URL:', wsUrl);
  const ws = new WebSocket(wsUrl);
  
  // Set connection timeout
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState !== WebSocket.OPEN) {
      ws.close();
      onError(new Error('WebSocket connection timed out'));
    }
  }, 10000); // 10s connection timeout
  
  ws.onopen = () => {
    clearTimeout(connectionTimeout);
    console.log('WebSocket connection opened, sending payload');
    ws.send(JSON.stringify({...payload, stream: true}));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      onMessage(data);
    } catch (error) {
      onError(new Error(`Failed to parse streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };
  
  ws.onerror = (event) => {
    clearTimeout(connectionTimeout);
    
    // Create a more detailed error message
    let errorMessage = 'WebSocket connection error';
    
    if (payload.model.includes('ollama/')) {
      errorMessage += '. Please ensure Ollama is running on your machine.';
    }
    
    onError(new Error(errorMessage + (event.type === 'error' ? ' (WebSocket error event)' : '')));
  };
  
  ws.onclose = (event) => {
    clearTimeout(connectionTimeout);
    
    // Check for abnormal closure
    if (event.code !== 1000) {
      onError(new Error(`WebSocket closed abnormally with code ${event.code}: ${event.reason || 'Unknown reason'}`));
    }
    
    onClose();
  };
  
  return {
    close: () => {
      clearTimeout(connectionTimeout);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    },
  };
}; 