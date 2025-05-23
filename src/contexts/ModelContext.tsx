import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ModelSelection } from '@/types';

interface ModelContextType {
  selectedModel: ModelSelection | null;
  setSelectedModel: (model: ModelSelection | null) => void;
  getModelString: (model: ModelSelection | null) => string;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<ModelSelection | null>(null);

  // Helper function to convert ModelSelection to string
  const getModelString = (model: ModelSelection | null): string => {
    if (!model) return '';
    
    return model.manualModelString || 
      (model.provider === 'ollama' 
        ? `ollama/${model.model}` 
        : model.model);
  };

  // Load saved model on mount
  useEffect(() => {
    const lastModelJson = localStorage.getItem('ollama-webui-last-model');
    if (lastModelJson) {
      try {
        const lastModel = JSON.parse(lastModelJson) as ModelSelection;
        setSelectedModel(lastModel);
      } catch (e) {
        console.error('Failed to parse last model selection:', e);
      }
    }
  }, []);

  // Save model to localStorage whenever it changes
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem('ollama-webui-last-model', JSON.stringify(selectedModel));
    }
  }, [selectedModel]);

  const value: ModelContextType = {
    selectedModel,
    setSelectedModel,
    getModelString,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
}; 