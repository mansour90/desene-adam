import React from 'react';
import ImageCard from './ImageCard';
import { Loader2, Frown } from 'lucide-react';
import { getImageCollectionKey } from '../utils/imageCollections';

export default function ImageGallery({
  images,
  isLoading,
  error,
  query,
  imageMode,
  favorites = [],
  queue = [],
  onToggleFavorite,
  onToggleQueue,
  onSelectImage,
  columnsPerRow
}) {
  return (
    <section className="google-gallery-section" aria-label="Rezultate căutare imagini de colorat">
      {/* Stare 1: Se încarcă rezultatele */}
      {isLoading && (
        <div className="google-gallery-state">
          <div className="google-loader-box">
            <div className="bouncing-pencil-wrapper">
              <span className="bouncing-emoji">✏️</span>
            </div>
            <Loader2 size={36} className="spinner-icon" />
            <h3 className="loading-heading">Căutăm cele mai mari planșe de colorat...</h3>
            <p className="loading-text">Filtrăm doar desene la rezoluție mare (Mari) pentru imprimare perfectă!</p>
          </div>
        </div>
      )}

      {/* Stare 2: Eroare */}
      {!isLoading && error && (
        <div className="google-gallery-state">
          <div className="google-error-box">
            <Frown size={44} className="error-icon" />
            <h3 className="error-heading">Nu am putut încărca rezultatele</h3>
            <p className="error-text">{error}</p>
          </div>
        </div>
      )}

      {/* Stare 3: Niciun rezultat / ecran de start */}
      {!isLoading && !error && images.length === 0 && (
        <div className="google-gallery-state">
          <div className="google-empty-box">
            <span className="empty-emoji">{query ? '🔍' : '👆'}</span>
            <h3 className="empty-heading">
              {query ? `Niciun desen găsit pentru „${query}”` : 'Apasă pe un desen'}
            </h3>
            {query && <p className="empty-text">Apasă pe alt desen de sus sau caută altceva.</p>}
          </div>
        </div>
      )}

      {/* Stare 4: Grid-ul dens de imagini stil Google Images */}
      {!isLoading && !error && images.length > 0 && (
        <>
          <div className={`google-image-grid ${columnsPerRow === 1 ? 'is-single-column' : 'is-two-columns'}`}>
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                imageMode={imageMode}
                onClick={onSelectImage}
                isFavorite={favorites.some((item) => item.key === getImageCollectionKey(image))}
                onToggleFavorite={onToggleFavorite}
                isQueued={queue.some((item) => item.key === getImageCollectionKey(image))}
                onToggleQueue={onToggleQueue}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
