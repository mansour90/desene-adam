import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  CloudUpload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { prepareColoringDrawingForDrive } from '../services/imageDownload';
import { uploadDrawingToGoogleDrive, isGoogleDriveConnected } from '../services/googleDrive';
import { isImageSavedInSession, markImageSavedInSession } from '../utils/fileUtils';

export default function ImagePreview({
  image,
  images = [],
  imageMode = 'lineart',
  onSelectImage,
  onClose,
  isGoogleConnected,
  onOpenParentSettings
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [alreadySavedWarning, setAlreadySavedWarning] = useState(false);
  const touchStartX = useRef(null);

  if (!image) return null;

  const isAlreadySaved = isImageSavedInSession(image);

  const navigateImage = (direction) => {
    if (images.length < 2) return;
    const currentIndex = images.findIndex((item) => item.id === image.id);
    const safeIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (safeIndex + direction + images.length) % images.length;
    onSelectImage?.(images[nextIndex]);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 50) return;
    navigateImage(distance < 0 ? 1 : -1);
  };

  if (imageMode === 'color') {
    return (
      <div
        className="color-viewer-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Vizualizare imagine colorată"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key === 'ArrowRight') navigateImage(1);
          if (event.key === 'ArrowLeft') navigateImage(-1);
        }}
        tabIndex={-1}
      >
        <button
          type="button"
          className="color-viewer-close"
          onClick={onClose}
          aria-label="Închide imaginea"
          title="Închide"
        >
          <X size={26} />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="color-viewer-nav color-viewer-prev"
              onClick={() => navigateImage(-1)}
              aria-label="Imaginea anterioară"
              title="Imaginea anterioară"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              type="button"
              className="color-viewer-nav color-viewer-next"
              onClick={() => navigateImage(1)}
              aria-label="Imaginea următoare"
              title="Imaginea următoare"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
        <img
          src={image.originalUrl || image.previewUrl}
          alt={image.title}
          className="color-viewer-image"
          onError={(event) => {
            if (event.currentTarget.src !== image.previewUrl) {
              event.currentTarget.src = image.previewUrl;
            }
          }}
        />
      </div>
    );
  }

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

    const googleActive = isGoogleConnected || isGoogleDriveConnected();
    if (!googleActive) {
      setSaveSuccess(false);
      setStatusMessage('Conectează Google Drive din Mod Părinte înainte de a trimite desenul.');
      return;
    }

    setAlreadySavedWarning(false);
    setIsProcessing(true);
    setUploadProgress(10);
    setStatusMessage('Pregătim desenul în format JPG...');
    setSaveSuccess(false);

    try {
      const { fileName, blob } = await prepareColoringDrawingForDrive(image);

      setUploadProgress(40);

      setStatusMessage('Încărcăm desenul în Google Drive...');
      const driveUpload = await uploadDrawingToGoogleDrive(
        blob,
        fileName,
        (percent) => setUploadProgress(percent)
      );
      markImageSavedInSession(image);
      setStatusMessage(`Trimis cu succes în Google Drive (${driveUpload.folderName})!`);

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

        {!isProcessing && statusMessage && !saveSuccess && (
          <div className="preview-error-banner" role="alert">
            <AlertCircle size={24} />
            <p>{statusMessage}</p>
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
                <span>TRIMIS ÎN DRIVE! (TRIMITE DIN NOU)</span>
              </>
            ) : (
              <>
                <CloudUpload size={36} />
                <span>TRIMITE ÎN GOOGLE DRIVE</span>
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
