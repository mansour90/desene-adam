import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import VoiceButton from './VoiceButton';
import VoiceModal from './VoiceModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function SearchBar({ onSearch, currentQuery }) {
  const [inputValue, setInputValue] = useState(currentQuery || '');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Când query-ul se schimbă extern, actualizăm câmpul
  useEffect(() => {
    if (currentQuery !== undefined) {
      setInputValue(currentQuery);
    }
  }, [currentQuery]);

  // Hook pentru recunoașterea vocală
  const {
    isListening,
    errorInfo,
    startListening,
    stopListening
  } = useSpeechRecognition({
    onResult: (spokenText) => {
      setInputValue(spokenText);
      setIsVoiceModalOpen(false);
      // Pornim căutarea automat după recunoaștere
      if (onSearch) {
        onSearch(spokenText);
      }
    }
  });

  const handleToggleVoice = () => {
    setIsVoiceModalOpen(true);
    startListening();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleSelectQuickVoice = (text) => {
    setInputValue(text);
    setIsVoiceModalOpen(false);
    if (onSearch) {
      onSearch(text);
    }
  };

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ex: SpongeBob, dinozauri, mașini, Elsa..."
            aria-label="Câmp de căutare desene"
          />

          {inputValue && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClear}
              aria-label="Șterge textul"
            >
              <X size={22} />
            </button>
          )}

          <button
            type="submit"
            className="search-submit-btn"
            aria-label="Caută desene"
            title="Caută"
          >
            <Search size={26} />
            <span className="search-btn-label">Caută</span>
          </button>
        </div>

        {/* Buton mare cu microfon */}
        <VoiceButton
          isListening={isListening}
          onToggle={handleToggleVoice}
        />
      </form>

      {/* Modal Asistent Vocal & Diagnostic */}
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
        onSelectSuggestion={handleSelectQuickVoice}
      />
    </div>
  );
}
