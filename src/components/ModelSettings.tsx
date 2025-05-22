import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ModelSettings as ModelSettingsType } from '@/types';

interface ModelSettingsProps {
  settings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ModelSettings({ 
  settings, 
  onSettingsChange, 
  disabled = false,
  compact = false
}: ModelSettingsProps) {
  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({
      ...settings,
      systemPrompt: e.target.value
    });
  };

  const handleTemperatureChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      temperature: value[0]
    });
  };

  return (
    <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
      {/* System Prompt */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          System Prompt
          {disabled && <span className="text-muted-foreground"> (Select a model first)</span>}
        </label>
        <Textarea
          value={settings.systemPrompt || ''}
          onChange={handleSystemPromptChange}
          placeholder="Enter instructions for the AI assistant..."
          className={`resize-none ${compact ? 'min-h-[60px] text-sm' : 'min-h-[80px]'}`}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          System prompts guide the AI behavior and responses.
        </p>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-foreground">
            Temperature
          </label>
          <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
            {settings.temperature?.toFixed(1) || '0.7'}
          </span>
        </div>
        
        <div className="px-1">
          <Slider
            value={[settings.temperature || 0.7]}
            min={0}
            max={2}
            step={0.1}
            onValueChange={handleTemperatureChange}
            disabled={disabled}
            className="w-full"
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>0.0 - Precise</span>
          <span>1.0 - Balanced</span>
          <span>2.0 - Creative</span>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Lower values make responses more focused, higher values more creative.
        </p>
      </div>
    </div>
  );
} 