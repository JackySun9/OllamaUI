import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Settings } from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { ModelSettings } from '@/components/ModelSettings';
import { ModelSelection, ModelSettings as ModelSettingsType } from '@/types';
import { useModel } from '@/contexts/ModelContext';

interface ModelDropdownProps {
  modelSettings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
}

export function ModelDropdown({ 
  modelSettings, 
  onSettingsChange 
}: ModelDropdownProps) {
  const { selectedModel, setSelectedModel } = useModel();
  const [showSettings, setShowSettings] = useState(false);

  const handleModelSelect = (model: ModelSelection) => {
    setSelectedModel(model);
  };

  const getDisplayName = () => {
    if (!selectedModel) return 'Select Model';
    
    if (selectedModel.manualModelString) {
      return selectedModel.manualModelString;
    }
    
    if (selectedModel.provider === 'ollama') {
      return selectedModel.model;
    }
    
    return `${selectedModel.provider}/${selectedModel.model}`;
  };

  if (showSettings) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Model Settings</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(false)}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
        <ModelSettings
          settings={modelSettings}
          onSettingsChange={onSettingsChange}
          disabled={!selectedModel}
          compact={true}
        />
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 min-w-[200px] justify-between"
        >
          <span className="truncate">{getDisplayName()}</span>
          <div className="flex items-center gap-1">
            <Settings 
              size={14} 
              className="text-muted-foreground hover:text-foreground cursor-pointer" 
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(true);
              }}
            />
            <ChevronDown size={14} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[9999] bg-background border shadow-lg rounded-lg" align="end" sideOffset={8}>
        <ModelSelector 
          currentModel={selectedModel}
          onModelSelect={handleModelSelect}
          compact={false}
        />
      </PopoverContent>
    </Popover>
  );
} 