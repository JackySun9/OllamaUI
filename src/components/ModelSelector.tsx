import React, { useState, useEffect } from 'react';
import { getProviders, getModels } from '@/lib/api';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { ModelSelection, Provider } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

// Add loading skeleton for select dropdowns
const SelectSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
  </div>
);

interface ModelSelectorProps {
  onModelSelect: (modelSelection: ModelSelection) => void;
  defaultProvider?: string;
  defaultModel?: string;
}

export function ModelSelector({ 
  onModelSelect, 
  defaultProvider = 'ollama',
  defaultModel = ''
}: ModelSelectorProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>(defaultProvider);
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);
  const [manualModel, setManualModel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [providersLoading, setProvidersLoading] = useState<boolean>(true);
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch providers on component mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setProvidersLoading(true);
        setError(null);
        const providersData: Provider[] = await getProviders();
        
        // Log the providers to help with debugging
        console.debug('Providers fetched:', providersData);
        setProviders(providersData);
        
        // Ensure we have a valid provider selected
        if (providersData.length > 0) {
          // Check if current selected provider exists in the list (case insensitive)
          const providerExists = providersData.some(
            provider => provider.id.toLowerCase() === selectedProvider.toLowerCase()
          );
          
          if (!providerExists) {
            console.info(`Selected provider '${selectedProvider}' not found in providers list. Using first available provider.`);
            setSelectedProvider(providersData[0].id);
          } else {
            // Update to match exact casing from the API
            const matchedProvider = providersData.find(
              provider => provider.id.toLowerCase() === selectedProvider.toLowerCase()
            );
            if (matchedProvider && matchedProvider.id !== selectedProvider) {
              console.debug(`Updating provider ID to match API casing: ${matchedProvider.id}`);
              setSelectedProvider(matchedProvider.id);
            }
          }
        }
      } catch (err) {
        setError('Failed to fetch providers');
        console.error('Provider fetch error:', err);
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchProviders();
  }, []);

  // Fetch models when provider changes
  useEffect(() => {
    if (!selectedProvider) return;

    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        setError(null);
        const modelsData = await getModels(selectedProvider);
        
        // Log models for debugging
        console.debug(`Models for ${selectedProvider}:`, modelsData);
        setModels(modelsData);
        
        // Ensure a model is selected if available
        if (modelsData.length > 0) {
          // Check if currently selected model exists in the list (case insensitive)
          const modelExists = selectedModel && 
            modelsData.some(model => model.toLowerCase() === selectedModel.toLowerCase());
            
          if (!modelExists) {
            console.info(`Selected model not in available models list. Using first available model.`);
            setSelectedModel(modelsData[0]);
          } else if (selectedModel) {
            // Update to match exact casing from the API
            const matchedModel = modelsData.find(
              model => model.toLowerCase() === selectedModel.toLowerCase()
            );
            if (matchedModel && matchedModel !== selectedModel) {
              console.debug(`Updating model to match API casing: ${matchedModel}`);
              setSelectedModel(matchedModel);
            }
          }
        } else {
          setError(`No models available for ${selectedProvider}`);
          setSelectedModel('');
        }
      } catch (err) {
        console.error(`Failed to fetch models for ${selectedProvider}:`, err);
        setError(`Failed to fetch models for ${selectedProvider}. Please try again later.`);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [selectedProvider]);

  // Notify parent when selection changes
  useEffect(() => {
    if (manualModel) {
      onModelSelect({
        provider: selectedProvider,
        model: '',
        manualModelString: manualModel
      });
    } else if (selectedModel) {
      onModelSelect({
        provider: selectedProvider,
        model: selectedModel,
        manualModelString: undefined
      });
    }
  }, [selectedProvider, selectedModel, manualModel, onModelSelect]);

  const refreshOllamaModels = async () => {
    if (selectedProvider !== 'ollama') return;
    
    try {
      setLoading(true);
      setModelsLoading(true);
      setError(null);
      const modelsData = await getModels('ollama');
      setModels(modelsData);
      if (modelsData.length > 0) {
        setSelectedModel(modelsData[0]);
      }
    } catch (err) {
      setError('Failed to refresh Ollama models');
      console.error(err);
    } finally {
      setLoading(false);
      setModelsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {providersLoading ? (
        <SelectSkeleton />
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <Select
            value={selectedProvider}
            onValueChange={setSelectedProvider}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={`provider-${provider.id}`} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {modelsLoading ? (
        <SelectSkeleton />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Model</label>
            {selectedProvider === 'ollama' && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshOllamaModels}
                disabled={loading}
              >
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                <span className="ml-1">Refresh</span>
              </Button>
            )}
          </div>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={loading || models.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={`model-${model}`} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Manual Model String (optional)</label>
        <Input
          value={manualModel}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualModel(e.target.value)}
          placeholder="e.g., openrouter/google/gemini-pro"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Enter a specific model string if not listed above. Will override dropdown selection.
        </p>
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
    </div>
  );
} 