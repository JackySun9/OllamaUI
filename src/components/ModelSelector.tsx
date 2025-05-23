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
  currentModel?: ModelSelection | null;
  compact?: boolean;
}

export function ModelSelector({ 
  onModelSelect, 
  defaultProvider = 'ollama',
  defaultModel = '',
  currentModel = null,
  compact = false
}: ModelSelectorProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>(
    currentModel?.provider || defaultProvider
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    currentModel?.model || defaultModel
  );
  const [manualModel, setManualModel] = useState<string>(
    currentModel?.manualModelString || ''
  );
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
        if (selectedProvider === 'ollama') {
          console.debug(`Loaded ${modelsData.length} Ollama models from cache/API:`, modelsData);
        } else {
          console.debug(`Models for ${selectedProvider}:`, modelsData);
        }
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
    // Only notify if we have a valid provider
    if (!selectedProvider) return;
    
    if (manualModel.trim()) {
      onModelSelect({
        provider: selectedProvider,
        model: '',
        manualModelString: manualModel.trim()
      });
    } else if (selectedModel) {
      onModelSelect({
        provider: selectedProvider,
        model: selectedModel,
        manualModelString: undefined
      });
    }
  }, [selectedProvider, selectedModel, manualModel]); // Removed onModelSelect from deps

  const refreshModels = async (retryCount = 0) => {
    if (!selectedProvider) return;
    
    try {
      setLoading(true);
      setModelsLoading(true);
      setError(null);
      
      console.log(`Refreshing models for provider: ${selectedProvider}`);
      
      // For Ollama, show specific loading message
      if (selectedProvider === 'ollama') {
        console.log('Fetching latest Ollama models...');
      }
      
      // Always use cache busting when refreshing
      const modelsData = await getModels(selectedProvider, true);
      setModels(modelsData);
      
      // Only update selected model if current one is not in the new list
      if (modelsData.length > 0) {
        const modelExists = selectedModel && 
          modelsData.some(model => model.toLowerCase() === selectedModel.toLowerCase());
        
        if (!modelExists) {
          setSelectedModel(modelsData[0]);
        }
      }
      
      const successMsg = selectedProvider === 'ollama' 
        ? `Successfully refreshed ${modelsData.length} Ollama models from local installation`
        : `Successfully refreshed ${selectedProvider} models`;
      console.log(successMsg, modelsData);
      
    } catch (err) {
      console.error(`Error refreshing ${selectedProvider} models:`, err);
      
      let errorMessage = `Failed to refresh ${selectedProvider} models.`;
      
      if (selectedProvider === 'ollama') {
        if (err instanceof Error && err.message.includes('503')) {
          errorMessage = 'Ollama service is not running. Please start Ollama and try again.';
        } else if (err instanceof Error && err.message.includes('404')) {
          errorMessage = 'No Ollama models found. Install models with "ollama pull <model-name>".';
        } else {
          errorMessage = 'Failed to connect to Ollama. Please ensure Ollama is running.';
        }
      }
      
      // Retry once if this is the first attempt and it's not a service unavailable error
      if (retryCount === 0 && !(err instanceof Error && err.message.includes('503'))) {
        console.log(`Retrying model refresh for ${selectedProvider}...`);
        setTimeout(() => refreshModels(1), 1000);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setModelsLoading(false);
    }
  };

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'}`}>
      {providersLoading ? (
        <SelectSkeleton />
      ) : (
        <div className="space-y-1">
          {!compact && <label className="text-sm font-medium">Provider</label>}
          <Select
            value={selectedProvider}
            onValueChange={setSelectedProvider}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
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
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            {!compact && <label className="text-sm font-medium">Model</label>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshModels()}
              disabled={loading}
              className={compact ? 'h-7 px-2 text-xs' : ''}
            >
              <RefreshCcw size={compact ? 12 : 14} className={loading ? 'animate-spin' : ''} />
              <span className="ml-1">
                {loading 
                  ? (selectedProvider === 'ollama' ? 'Fetching from Ollama...' : 'Refreshing...') 
                  : (compact ? 'Refresh' : 'Refresh')}
              </span>
            </Button>
          </div>
          <Select
            value={selectedModel}
            onValueChange={setSelectedModel}
            disabled={loading || models.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="z-[10000]">
              {models.map((model) => (
                <SelectItem key={`model-${model}`} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!compact && (
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
      )}

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
    </div>
  );
} 