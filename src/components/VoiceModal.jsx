import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function VoiceModal({
  isOpen,
  onClose,
  isListening,
  errorInfo,
  onStartListening,
  onStopListening,
  onSelectSuggestion
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyBraveSetting = () => {
    navigator.clipboard.writeText('brave://settings/system');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const QUICK_VOICE_TILES = [
    { title: 'SpongeBob', emoji: '🧽' },
    { title: 'Dinozauri', emoji: '🦖' },
    { title: 'Mașini de curse', emoji: '🏎️' },
    { title: 'Spider-Man', emoji: '🕷️' },
    { title: 'Sonic', emoji: '🦔' },
    { title: 'Elsa Frozen', emoji: '❄️' },
    { title: 'Pisicuțe', emoji: '🐱' },
    { title: 'Pikachu', emoji: '⚡' },
    { title: 'Roboți', emoji: '🤖' },
    { title: 'Prințese', emoji: '👑' }
  ];

  const isBrave = errorInfo?.isBrave || false;
  const isNetworkError = errorInfo?.type === 'network';

  return (
    <div className="voice-modal-backdrop" role="dialog" aria-modal="true">
      <div className="voice-modal-content">
        <button
          type="button"
          className="voice-modal-close"
          onClick={onClose}
          aria-label="Închide"
        >
          <X size={24} />
        </button>

        {/* Zona Microfon Mare Central */}
        <div className="voice-modal-mic-zone">
          <button
            type="button"
            className={`voice-modal-big-mic ${isListening ? 'listening' : ''}`}
            onClick={isListening ? onStopListening : onStartListening}
            aria-label={isListening ? 'Oprește' : 'Vorbește'}
          >
            {isListening && <span className="mic-outer-ring"></span>}
            <Mic size={48} className="big-mic-icon" />
          </button>

          <h3 className="voice-modal-title">
            {isListening
              ? 'Te ascult... Spune ce vrei să colorezi!'
              : errorInfo
              ? 'Hopa! Ceva a împiedicat microfonul'
              : 'Apasă pe microfon și vorbește!'}
          </h3>
          <p className="voice-modal-subtitle">
            {isListening
              ? 'Rostește clar în limba română (ex: SpongeBob, dinozauri, mașini)...'
              : 'Poți spune orice personaj, animal sau obiect preferat!'}
          </p>
        </div>

        {/* Panou dedicat pentru browserul Brave / Network Error */}
        {errorInfo && (
          <div className="brave-fix-card">
            <div className="fix-card-header">
              <AlertTriangle size={22} className="fix-warn-icon" />
              <h4>De ce a apărut eroarea de microfon?</h4>
            </div>

            {isBrave ? (
              <div className="brave-steps">
                <p className="fix-desc">
                  Folosești browserul <strong>Brave</strong>. Brave blochează implicit serviciul Google de recunoaștere vocală din motive de confidențialitate.
                </p>

                <div className="fix-steps-list">
                  <div className="step-item">
                    <span className="step-num">1</span>
                    <div className="step-content">
                      <span>Deschide o filă nouă în Brave și introdu:</span>
                      <div className="code-copy-row">
                        <code>brave://settings/system</code>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={handleCopyBraveSetting}
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          <span>{copied ? 'Copiat!' : 'Copiază'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="step-item">
                    <span className="step-num">2</span>
                    <div className="step-content">
                      <span>Activează opțiunea:</span>
                      <strong>„Use Google services for speech recognition”</strong>
                      <span className="step-hint">(Utilizează serviciile Google pentru recunoașterea vocală)</span>
                    </div>
                  </div>

                  <div className="step-item">
                    <span className="step-num">3</span>
                    <div className="step-content">
                      <span>Reîmprospătează pagina și apasă din nou pe microfon!</span>
                    </div>
                  </div>
                </div>

                <div className="alt-browser-banner">
                  <span>💡 <strong>Alternativă rapidă:</strong> Deschide aplicația în <strong>Microsoft Edge</strong> sau <strong>Google Chrome</strong> la <code>http://localhost:5173/</code> unde microfonul este deja 100% activ!</span>
                </div>
              </div>
            ) : (
              <div className="generic-fix">
                <p className="fix-desc">{errorInfo.message}</p>
                <button
                  type="button"
                  className="retry-mic-btn"
                  onClick={onStartListening}
                >
                  <RefreshCw size={18} />
                  <span>Încearcă din nou</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Zona de opțiuni rapide (Copilul poate alege imediat fără să tasteze) */}
        <div className="quick-voice-section">
          <div className="quick-voice-header">
            <Sparkles size={18} className="sparkle-icon" />
            <span>Sau alege rapid un desen preferat:</span>
          </div>

          <div className="quick-voice-grid">
            {QUICK_VOICE_TILES.map((tile) => (
              <button
                key={tile.title}
                type="button"
                className="quick-tile-btn"
                onClick={() => {
                  onSelectSuggestion(tile.title);
                  onClose();
                }}
              >
                <span className="tile-emoji">{tile.emoji}</span>
                <span className="tile-title">{tile.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
