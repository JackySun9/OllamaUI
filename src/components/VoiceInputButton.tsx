import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string, append?: boolean) => void;
  disabled?: boolean;
  language?: string;
  className?: string;
}

export function VoiceInputButton({ 
  onTranscript, 
  disabled = false, 
  language = 'en-US',
  className = '' 
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    continuous: false, // Don't auto-restart, let user control
    interimResults: true,
    lang: language,
    onResult: (text: string, isFinal: boolean) => {
      if (isFinal) {
        onTranscript(text, false); // Replace the current text
        stopRecording();
      } else {
        // Show interim results
        onTranscript(text, false);
      }
    },
    onError: (errorMessage: string) => {
      console.error('Voice input error:', errorMessage);
      stopRecording();
    }
  });

  const startRecording = () => {
    if (!isSupported) {
      alert('Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    resetTranscript();
    setIsRecording(true);
    startListening();
  };

  const stopRecording = () => {
    setIsRecording(false);
    stopListening();
  };

  const toggleRecording = () => {
    if (isRecording || isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Show interim transcript while recording
  useEffect(() => {
    if (interimTranscript && isListening) {
      onTranscript(interimTranscript, false);
    }
  }, [interimTranscript, isListening, onTranscript]);

  if (!isSupported) {
    return null; // Don't show the button if voice input isn't supported
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant={isRecording || isListening ? "default" : "outline"}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled}
        className={`h-10 w-10 rounded-full transition-all duration-200 ${
          isRecording || isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : ''
        } ${className}`}
        title={isRecording || isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={18} />
        ) : (
          <Mic size={18} />
        )}
      </Button>
      
      {/* Recording indicator */}
      {(isRecording || isListening) && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
      )}
      
      {/* Error display */}
      {error && (
        <div className="absolute top-12 left-0 right-0 text-xs text-red-500 bg-background border rounded p-2 shadow-lg z-10">
          {error}
        </div>
      )}
    </div>
  );
} 