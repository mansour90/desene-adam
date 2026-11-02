import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import VoiceButton from './VoiceButton';
import VoiceModal from './VoiceModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { playCommandReceivedSound, playListeningSound } from '../services/voiceSounds';

export default function VoiceSearchControl({ onSearch, onActivateHome }) {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const searchTimeoutRef = useRef(null);
  const { isListening, transcript, errorInfo, startListening, stopListening } = useSpeechRecognition({
    onResult: (spokenText) => {
      playCommandReceivedSound();
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = window.setTimeout(() => {
        setIsVoiceModalOpen(false);
        onSearch?.(spokenText);
      }, 1200);
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

  useEffect(() => () => window.clearTimeout(searchTimeoutRef.current), []);

  const handleStartListening = () => {
    window.clearTimeout(searchTimeoutRef.current);
    playListeningSound();
    startListening();
  };

  return (
    <>
      <div className="bottom-nav-voice-slot">
        <VoiceButton
          isListening={isListening}
          onToggle={() => {
            onActivateHome?.();
            setIsVoiceModalOpen(true);
            handleStartListening();
          }}
        />
      </div>
      {createPortal(
        <VoiceModal
          isOpen={isVoiceModalOpen}
          onClose={() => {
            window.clearTimeout(searchTimeoutRef.current);
            stopListening();
            setIsVoiceModalOpen(false);
          }}
          isListening={isListening}
          transcript={transcript}
          errorInfo={errorInfo}
          onStartListening={handleStartListening}
          onStopListening={stopListening}
        />,
        document.body
      )}
    </>
  );
}