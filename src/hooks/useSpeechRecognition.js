import { useState, useEffect, useCallback, useRef } from 'react';
import { speechServiceInstance } from '../services/speechRecognition';

/**
 * Hook reactiv pentru căutarea vocală cu suport complet pentru detecție Brave și auto-dismiss
 */
export function useSpeechRecognition({ onResult } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorInfo, setErrorInfo] = useState(null);
  const [isSupported] = useState(() => speechServiceInstance.checkSupported());

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const errorTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      speechServiceInstance.stopListening();
    };
  }, []);

  const dismissError = useCallback(() => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorInfo(null);
  }, []);

  const startListening = useCallback(() => {
    dismissError();
    setTranscript('');

    speechServiceInstance.startListening({
      onStart: () => {
        setIsListening(true);
      },
      onTranscript: (text) => {
        setTranscript(text);
      },
      onResult: (text) => {
        setTranscript(text);
        if (onResultRef.current) {
          onResultRef.current(text);
        }
      },
      onError: (errObj) => {
        setErrorInfo(errObj);
        setIsListening(false);
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        // Lăsăm mesajul vizibil 8 secunde pentru a putea citi instrucțiunile
        errorTimeoutRef.current = setTimeout(() => {
          setErrorInfo(null);
        }, 8000);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  }, [dismissError]);

  const stopListening = useCallback(() => {
    speechServiceInstance.stopListening();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    errorInfo,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    dismissError
  };
}
