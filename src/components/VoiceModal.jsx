import React, { useState } from 'react';
import {
  Mic,
  X,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

export default function VoiceModal({
  isOpen,
  onClose,
  isListening,
  transcript = '',
  errorInfo,
  onStartListening,
  onStopListening
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyBraveSetting = () => {
    navigator.clipboard.writeText('brave://settings/system');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isBrave = errorInfo?.isBrave || false;
  const hasTranscript = Boolean(transcript.trim());

  return (
    <div className="voice-modal-backdrop" role="dialog" aria-modal="true">
      <div className={`voice-modal-content ${errorInfo ? 'has-error' : ''}`}>
        <button
          type="button"
          className="voice-modal-close"
          onClick={onClose}
          aria-label="Închide"
        >
          <X size={24} />
        </button>

        <div className="voice-modal-mic-zone">
          <button
            type="button"
            className={`voice-modal-big-mic ${isListening ? 'listening' : ''} ${hasTranscript ? 'detected' : ''}`}
            onClick={isListening ? onStopListening : onStartListening}
            aria-label={isListening ? 'Oprește' : 'Vorbește'}
          >
            <Mic size={48} className="big-mic-icon" />
          </button>

          {hasTranscript && (
            <p className="voice-modal-transcript has-text" aria-live="polite" aria-atomic="true">
              {transcript}
            </p>
          )}
        </div>

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

      </div>
    </div>
  );
}
