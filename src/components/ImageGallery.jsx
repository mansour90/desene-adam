import React from 'react';
import ImageCard from './ImageCard';
import { Loader2, Sparkles, Frown, CheckSquare, SlidersHorizontal } from 'lucide-react';

export default function ImageGallery({
  images,
  suggestions,
  isLoading,
  error,
  query,
  onSearchQuery,
  onSelectImage
}) {
  return (
    <section className="google-gallery-section" aria-label="Rezultate căutare imagini de colorat">
      {/* Bara de sugestii stil Google Images (orizontală, scrollable) */}
      {suggestions && suggestions.length > 0 && (
        <div className="google-suggestions-bar">
          <div className="google-suggestions-scroll">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                className="google-sug-chip"
                onClick={() => onSearchQuery(sug)}
              >
                <span>{sug}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicator presetare dimensiune și tip (exact ca în Google Images Instrumente > Mari & Doar de colorat) */}
      <div className="google-tools-indicator">
        <div className="tools-badge-group">
          <span className="tool-active-pill">
            <CheckSquare size={14} className="tool-check" />
            Dimensiune: <strong>Mari</strong>
          </span>
          <span className="tool-active-pill">
            <CheckSquare size={14} className="tool-check" />
            Tip: <strong>Doar de colorat (Line art)</strong>
          </span>
        </div>
        <span className="google-results-count">
          {images.length > 0 ? `${images.length} planșe de rezoluție mare găsite` : ''}
        </span>
      </div>

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
        <div className="google-image-grid">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onClick={onSelectImage}
            />
          ))}
        </div>
      )}
    </section>
  );
}
