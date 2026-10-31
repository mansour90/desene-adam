import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  CloudUpload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadColoringDrawingAsJpg } from '../services/imageDownload';
import { uploadDrawingToGoogleDrive, isGoogleDriveConnected } from '../services/googleDrive';
import { isImageSavedInSession } from '../utils/fileUtils';

export default function ImagePreview({
  image,
  onClose,
  isGoogleConnected,
  onOpenParentSettings
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [driveResult, setDriveResult] = useState(null);
  const [alreadySavedWarning, setAlreadySavedWarning] = useState(false);

  if (!image) return null;

  const isAlreadySaved = isImageSavedInSession(image.id);

  // Declanșare confetti festiv pentru copil la salvare cu succes
  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f472b6']
      });
    } catch (e) {}
  };

  const handleSaveDrawing = async (force = false) => {
    // Verificăm dacă desenul a fost deja salvat în această sesiune
    if (isAlreadySaved && !force && !alreadySavedWarning) {
      setAlreadySavedWarning(true);
      return;
    }

    setAlreadySavedWarning(false);
    setIsProcessing(true);
    setUploadProgress(10);
    setStatusMessage('Pregătim desenul în format JPG...');

    try {
      // 1. Convertim și descărcăm imaginea JPG local pe dispozitiv
      const downloadResult = await downloadColoringDrawingAsJpg(image, true);
      const { fileName, blob } = downloadResult;

      setUploadProgress(40);

      // 2. Dacă Google Drive este conectat, încărcăm și în cloud în folderul sesiunii
      const googleActive = isGoogleConnected || isGoogleDriveConnected();

      if (googleActive && blob) {
        setStatusMessage('Încărcăm desenul în Google Drive...');
        const driveUpload = await uploadDrawingToGoogleDrive(
          blob,
          fileName,
          (percent) => setUploadProgress(percent)
        );
        setDriveResult(driveUpload);
        setStatusMessage(`Salvat cu succes în Google Drive (${driveUpload.folderName}) și pe dispozitiv!`);
      } else {
        setUploadProgress(100);
        setStatusMessage('Desen salvat cu succes pe dispozitivul tău!');
      }

      setSaveSuccess(true);
      triggerCelebration();
    } catch (err) {
      console.error('Eroare la salvare:', err);
      setStatusMessage(`Hopa! A apărut o problemă: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="preview-overlay" role="dialog" aria-modal="true">
      <div className="preview-container">
        {/* Bara de sus cu buton Înapoi */}
        <div className="preview-header">
          <button
            type="button"
            className="back-btn"
            onClick={onClose}
            aria-label="Înapoi la desene"
          >
            <ArrowLeft size={28} />
            <span className="back-btn-label">ÎNAPOI LA DESENE</span>
          </button>

          <span className="preview-title-badge">{image.title}</span>
        </div>

        {/* Zona principală de afișare a imaginii */}
        <div className="preview-image-stage">
          <div className="preview-paper-sheet">
            <img
              src={image.previewUrl}
              alt={image.title}
              className="preview-large-img"
            />
          </div>
        </div>

        {/* Notificare desen deja salvat */}
        {alreadySavedWarning && (
          <div className="already-saved-banner">
            <ShieldAlert size={24} className="warning-icon" />
            <div className="warning-text">
              <strong>Ai salvat deja acest desen în această sesiune!</strong>
              <p>Dorești să îl salvezi încă o dată?</p>
            </div>
            <div className="warning-actions">
              <button
                type="button"
                className="confirm-resave-btn"
                onClick={() => handleSaveDrawing(true)}
              >
                Da, salvează din nou
              </button>
              <button
                type="button"
                className="cancel-resave-btn"
                onClick={() => setAlreadySavedWarning(false)}
              >
                Nu, am înțeles
              </button>
            </div>
          </div>
        )}

        {/* Indicator de progres la încărcare */}
        {isProcessing && (
          <div className="preview-progress-box">
            <div className="progress-labels">
              <span className="progress-status-text">{statusMessage}</span>
              <span className="progress-percent-text">{uploadProgress}%</span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Mesaj de succes */}
        {saveSuccess && !isProcessing && (
          <div className="preview-success-banner">
            <CheckCircle size={32} className="success-icon" />
            <div className="success-content">
              <strong>Super! Desenul a fost salvat cu succes!</strong>
              <p>{statusMessage}</p>
            </div>
          </div>
        )}

        {/* Buton principal uriaș: SALVEAZĂ DESENUL */}
        <div className="preview-actions">
          <button
            type="button"
            className={`save-main-btn ${saveSuccess ? 'btn-saved' : ''}`}
            onClick={() => handleSaveDrawing(false)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 size={36} className="spinner-icon" />
                <span>SE SALVEAZĂ...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle size={36} />
                <span>DESEN SALVAT! (SALVEAZĂ DIN NOU)</span>
              </>
            ) : (
              <>
                <Download size={36} />
                <span>SALVEAZĂ DESENUL</span>
              </>
            )}
          </button>
        </div>

        {/* Metadate și sursă curată */}
        <div className="preview-meta-footer">
          <div className="meta-info-item">
            <span>Licență: <strong>{image.license || 'Liberă / Public Domain'}</strong></span>
            {image.artist && <span> • Autor: {image.artist}</span>}
          </div>

          {!isGoogleConnected && (
            <div className="drive-hint">
              <span>💡 Părinții pot conecta Google Drive din </span>
              <button
                type="button"
                className="inline-parent-link"
                onClick={onOpenParentSettings}
              >
                Mod Părinte
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
