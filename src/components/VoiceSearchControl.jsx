import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import VoiceButton from './VoiceButton';
import VoiceModal from './VoiceModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function VoiceSearchControl({ onSearch, onActivateHome }) {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const { isListening, errorInfo, startListening, stopListening } = useSpeechRecognition({
    onResult: (spokenText) => {
      setIsVoiceModalOpen(false);
      onSearch?.(spokenText);
    }
  });

  useEffect(() => {
    if (!isVoiceModalOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isVoiceModalOpen]);

  const handleSelectSuggestion = (text) => {
    setIsVoiceModalOpen(false);
    onSearch?.(text);
  };

  return (
    <>
      <div className="bottom-nav-voice-slot">
        <VoiceButton
          isListening={isListening}
          onToggle={() => {
            onActivateHome?.();
            setIsVoiceModalOpen(true);
            startListening();
          }}
        />
      </div>
      {createPortal(
        <VoiceModal
          isOpen={isVoiceModalOpen}
          onClose={() => {
            stopListening();
            setIsVoiceModalOpen(false);
          }}
          isListening={isListening}
          errorInfo={errorInfo}
          onStartListening={startListening}
          onStopListening={stopListening}
          onSelectSuggestion={handleSelectSuggestion}
        />,
        document.body
      )}
    </>
  );
}