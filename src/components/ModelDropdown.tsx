import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ModelSelector';
import { ModelSettings } from '@/components/ModelSettings';
import { ModelSelection, ModelSettings as ModelSettingsType } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bot, ChevronDown } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ModelDropdownProps {
  selectedModel: ModelSelection | null;
  onModelSelect: (model: ModelSelection) => void;
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
}

export function ModelDropdown({ 
  selectedModel, 
  onModelSelect, 
  modelSettings, 
  onSettingsChange 
}: ModelDropdownProps) {
  // Format the model name for display
  const getDisplayModelName = () => {
    if (!selectedModel) return 'Select a model';
    
    if (selectedModel.manualModelString) {
      return selectedModel.manualModelString;
    }
    
    if (selectedModel.provider === 'ollama') {
      return selectedModel.model;
    }
    
    return `${selectedModel.provider}/${selectedModel.model}`;
  };
  
  // Handle model selection - memoized to prevent infinite loops
  const handleModelSelect = useCallback((model: ModelSelection) => {
    onModelSelect(model);
  }, [onModelSelect]);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 h-9 px-3 border rounded-lg bg-background hover:bg-muted"
        >
          <Bot size={18} className="text-primary" />
          <span className="max-w-[120px] truncate font-medium">{getDisplayModelName()}</span>
          <ChevronDown size={16} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[100] bg-background border shadow-lg rounded-lg" align="end" sideOffset={8}>
        <Tabs defaultValue="model">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="model" className="space-y-4 p-4">
            <h3 className="text-sm font-medium">Select Model</h3>
            <div className="max-h-[300px] overflow-y-auto">
              <ModelSelector 
                onModelSelect={handleModelSelect} 
                currentModel={selectedModel}
                compact
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 p-4">
            <h3 className="text-sm font-medium">Model Settings</h3>
            <ModelSettings 
              settings={modelSettings} 
              onSettingsChange={onSettingsChange} 
              disabled={!selectedModel}
              compact
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
} 