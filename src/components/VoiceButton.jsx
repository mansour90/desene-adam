import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export default function VoiceButton({ isListening, onToggle, onClickHelp }) {
  return (
    <div className="voice-btn-container">
      <button
        type="button"
        className={`voice-btn ${isListening ? 'listening' : ''}`}
        onClick={onToggle}
        aria-label={isListening ? 'Oprește ascultarea' : 'Caută prin voce'}
        title="Apasă și spune ce vrei să colorezi!"
      >
        {isListening ? (
          <div className="mic-listening-content">
            <span className="pulse-ring"></span>
            <Mic size={32} className="mic-active-icon" />
          </div>
        ) : (
          <Mic size={30} />
        )}
      </button>

      {/* Indicator pulsatoriu când microfonul este activ */}
      {isListening && (
        <div className="voice-listening-tooltip">
          <Volume2 size={16} className="voice-wave-icon" />
          <span>Vorbește acum... te ascult!</span>
        </div>
      )}
    </div>
  );
}
