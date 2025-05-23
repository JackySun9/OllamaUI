import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface VoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export function useVoiceInput(options: VoiceInputOptions = {}): VoiceInputReturn {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const isStoppedRef = useRef(false);

  // Check if Speech Recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    if (recognitionRef.current) {
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = lang;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        isStoppedRef.current = false;
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interim += transcriptPart;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          onResult?.(finalTranscript, true);
        }

        setInterimTranscript(interim);
        if (interim) {
          onResult?.(interim, false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        onError?.(errorMessage);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        
        // Restart listening if it wasn't manually stopped
        if (!isStoppedRef.current && continuous) {
          setTimeout(() => {
            if (!isStoppedRef.current) {
              startListening();
            }
          }, 100);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, continuous, interimResults, lang, onResult, onError]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      isStoppedRef.current = false;
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isStoppedRef.current = true;
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
} 