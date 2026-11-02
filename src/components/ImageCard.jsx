import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CloudUpload, Heart } from 'lucide-react';
import { isImageSavedInSession } from '../utils/fileUtils';

export default function ImageCard({
  image,
  imageMode = 'lineart',
  onClick,
  isFavorite = false,
  onToggleFavorite,
  isQueued = false,
  onToggleQueue,
  showQueueAction = true
}) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const clickTimeoutRef = useRef(null);
  const longPressTimeoutRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const pointerStartRef = useRef(null);
  const suppressClickRef = useRef(false);
  const isSaved = isImageSavedInSession(image);

  useEffect(() => () => {
    window.clearTimeout(clickTimeoutRef.current);
    window.clearTimeout(longPressTimeoutRef.current);
    window.clearTimeout(feedbackTimeoutRef.current);
  }, []);

  if (hasError) {
    return null;
  }

  const showFeedback = (feedback) => {
    setActionFeedback(feedback);
    window.clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => setActionFeedback(null), 900);
  };

  const cancelLongPress = () => {
    window.clearTimeout(longPressTimeoutRef.current);
    pointerStartRef.current = null;
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    suppressClickRef.current = false;
    window.clearTimeout(longPressTimeoutRef.current);

    if (!showQueueAction || imageMode !== 'lineart' || !onToggleQueue) return;
    longPressTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = true;
      if (!isQueued) onToggleQueue(image);
      showFeedback('queue');
    }, 550);
  };

  const handlePointerMove = (event) => {
    if (!pointerStartRef.current) return;
    const distance = Math.hypot(
      event.clientX - pointerStartRef.current.x,
      event.clientY - pointerStartRef.current.y
    );
    if (distance > 10) cancelLongPress();
  };

  const handleImageClick = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }

    if (event.detail === 0) {
      onClick(image);
      return;
    }

    if (clickTimeoutRef.current) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      if (!isFavorite) onToggleFavorite?.(image);
      showFeedback('favorite');
      return;
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      clickTimeoutRef.current = null;
      onClick(image);
    }, 320);
  };

  return (
    <article className="google-image-card">
      <div className="google-card-frame">
        <button
          type="button"
          className="google-card-open"
          onClick={handleImageClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onPointerLeave={cancelLongPress}
          aria-label={`Deschide imaginea: ${image.title}. Dublă atingere pentru favorite; ține apăsat pentru a adăuga la trimitere.`}
        >
          <img
            src={image.previewUrl}
            alt={image.title}
            className={`google-card-img ${hasLoaded ? 'loaded' : 'loading'}`}
            loading="lazy"
            draggable={false}
            onLoad={() => setHasLoaded(true)}
            onError={() => setHasError(true)}
          />
        </button>

        {actionFeedback && (
          <div className={`google-card-feedback ${actionFeedback}`} aria-hidden="true">
            {actionFeedback === 'favorite'
              ? <Heart size={58} fill="currentColor" />
              : <CloudUpload size={48} />}
          </div>
        )}

        {isSaved && (
          <span className="google-saved-badge" aria-label="Deja trimis în Google Drive" title="Deja trimis în Google Drive">
            <CheckCircle2 size={20} />
          </span>
        )}
      </div>
    </article>
  );
}
