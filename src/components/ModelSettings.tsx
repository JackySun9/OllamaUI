import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ModelSettings as ModelSettingsType } from '@/types';

interface ModelSettingsProps {
  settings: ModelSettingsType;
  onSettingsChange: (settings: ModelSettingsType) => void;
  disabled?: boolean;
}

export function ModelSettings({ 
  settings, 
  onSettingsChange, 
  disabled = false 
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
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">System Prompt</label>
        <Textarea
          value={settings.systemPrompt}
          onChange={handleSystemPromptChange}
          placeholder="Instructions for the AI..."
          className="resize-none min-h-[80px]"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Temperature: {settings.temperature.toFixed(1)}</label>
        </div>
        <Slider
          value={[settings.temperature]}
          min={0}
          max={2}
          step={0.1}
          onValueChange={handleTemperatureChange}
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Precise</span>
          <span>Balanced</span>
          <span>Creative</span>
        </div>
      </div>
    </div>
  );
} 