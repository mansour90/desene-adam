import React, { useState } from 'react';
import { CheckCircle2, Heart, CloudUpload, X } from 'lucide-react';
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
  const isSaved = isImageSavedInSession(image);

  if (hasError) {
    return null;
  }

  return (
    <article className="google-image-card">
      <div className="google-card-frame">
        <button
          type="button"
          className="google-card-open"
          onClick={() => onClick(image)}
          aria-label={`Deschide imaginea: ${image.title}`}
        >
          <img
            src={image.previewUrl}
            alt={image.title}
            className={`google-card-img ${hasLoaded ? 'loaded' : 'loading'}`}
            loading="lazy"
            onLoad={() => setHasLoaded(true)}
            onError={() => setHasError(true)}
          />
        </button>

        {onToggleFavorite && (
          <button
            type="button"
            className={`image-card-action favorite-action ${isFavorite ? 'selected' : ''}`}
            onClick={() => onToggleFavorite(image)}
            aria-label={isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
          >
            <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {showQueueAction && imageMode === 'lineart' && onToggleQueue && (
          <button
            type="button"
            className={`image-card-action queue-action ${isQueued ? 'selected' : ''}`}
            onClick={() => onToggleQueue(image)}
            aria-label={isQueued ? 'Elimină din coada de trimitere' : 'Adaugă în coada de trimitere'}
            aria-pressed={isQueued}
            title={isQueued ? 'Elimină din coadă' : 'Adaugă pentru trimitere'}
          >
            {isQueued ? <X size={17} /> : <CloudUpload size={17} />}
          </button>
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
