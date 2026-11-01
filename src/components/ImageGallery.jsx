import React, { useState } from 'react';
import ImageCard from './ImageCard';
import { Loader2, Frown, LayoutGrid, List } from 'lucide-react';
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
  onSearchQuery,
  onSelectImage
}) {
  const [columnsPerRow, setColumnsPerRow] = useState(2);

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

      {/* Stare 3: Niciun rezultat */}
      {!isLoading && !error && images.length === 0 && (
        <div className="google-gallery-state">
          <div className="google-empty-box">
            <span className="empty-emoji">🔍</span>
            <h3 className="empty-heading">Niciun desen găsit pentru „{query}”</h3>
            <p className="empty-text">Încearcă să cauți personaje cunoscute sau animale:</p>
            <div className="empty-suggestions">
              {['SpongeBob', 'Dinozauri', 'Spider-Man', 'Sonic', 'Mașini de curse', 'Elsa Frozen', 'Pikachu'].map((term) => (
                <button
                  key={term}
                  type="button"
                  className="suggestion-pill"
                  onClick={() => onSearchQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stare 4: Grid-ul dens de imagini stil Google Images */}
      {!isLoading && !error && images.length > 0 && (
        <>
          <div className="gallery-layout-controls">
            <div className="gallery-layout-toggle" role="group" aria-label="Număr de poze pe rând">
              <button
                type="button"
                className={`gallery-layout-button ${columnsPerRow === 2 ? 'active' : ''}`}
                onClick={() => setColumnsPerRow(2)}
                aria-label="Afișează două poze pe rând"
                title="Două poze pe rând"
                aria-pressed={columnsPerRow === 2}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                type="button"
                className={`gallery-layout-button ${columnsPerRow === 1 ? 'active' : ''}`}
                onClick={() => setColumnsPerRow(1)}
                aria-label="Afișează o poză pe rând"
                title="O poză pe rând"
                aria-pressed={columnsPerRow === 1}
              >
                <List size={18} />
              </button>
            </div>
          </div>
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
