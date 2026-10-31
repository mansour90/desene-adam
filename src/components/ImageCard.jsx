import React, { useState } from 'react';
import { Eye, CheckCircle2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { isImageSavedInSession } from '../utils/fileUtils';

export default function ImageCard({ image, onClick }) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isSaved = isImageSavedInSession(image.id);

  if (hasError) {
    return null;
  }

  const dimensionText = image.width && image.height ? `${image.width} × ${image.height}` : 'Mari';

  return (
    <article
      className="google-image-card"
      onClick={() => onClick(image)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(image);
        }
      }}
      aria-label={`Vezi desenul: ${image.title}`}
    >
      <div className="google-card-frame">
        {!hasLoaded && (
          <div className="google-card-skeleton">
            <ImageIcon size={28} className="skeleton-icon" />
          </div>
        )}

        <img
          src={image.previewUrl}
          alt={image.title}
          className={`google-card-img ${hasLoaded ? 'loaded' : 'loading'}`}
          loading="lazy"
          onLoad={() => setHasLoaded(true)}
          onError={() => setHasError(true)}
        />

        {/* Badge Salvat în sesiune */}
        {isSaved && (
          <div className="google-saved-badge">
            <CheckCircle2 size={14} />
            <span>Salvat</span>
          </div>
        )}

        {/* Badge Dimensiune mare */}
        <div className="google-dim-badge">
          <span>{dimensionText}</span>
        </div>

        {/* Hover overlay */}
        <div className="google-hover-overlay">
          <span className="google-hover-btn">
            <Eye size={18} />
            <span>Colorează</span>
          </span>
        </div>
      </div>

      <div className="google-card-info">
        <h3 className="google-card-title" title={image.title}>
          {image.title}
        </h3>
        <div className="google-card-domain-row">
          <span className="google-card-domain">{image.artist || 'coloring web'}</span>
          <span className="google-card-tag">Mari</span>
        </div>
      </div>
    </article>
  );
}
