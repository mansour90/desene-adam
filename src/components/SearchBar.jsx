import React, { useState, useEffect } from 'react';
import { Contrast, Palette, Search, X } from 'lucide-react';

const QUICK_SEARCHES = [
  { label: 'Dinozauri', emoji: '🦖' },
  { label: 'Mașini', emoji: '🚗' },
  { label: 'Animale', emoji: '🦁' },
  { label: 'Prințese', emoji: '👑' },
  { label: 'Roboți', emoji: '🤖' },
  { label: 'Avioane', emoji: '✈️' },
  { label: 'Supereroi', emoji: '🦸' },
  { label: 'Spațiu', emoji: '🚀' }
];

export default function SearchBar({ onSearch, currentQuery, imageMode, onImageModeChange }) {
  const [inputValue, setInputValue] = useState(currentQuery || '');

  // Când query-ul se schimbă extern, actualizăm câmpul
  useEffect(() => {
    if (currentQuery !== undefined) {
      setInputValue(currentQuery);
    }
  }, [currentQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className="search-section">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ex: SpongeBob, dinozauri, mașini, Elsa..."
            aria-label="Câmp de căutare desene"
          />

          {inputValue && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClear}
              aria-label="Șterge textul"
            >
              <X size={22} />
            </button>
          )}

          <button
            type="submit"
            className="search-submit-btn"
            aria-label="Caută desene"
            title="Caută"
          >
            <Search size={26} />
            <span className="search-btn-label">Caută</span>
          </button>
        </div>
      </form>

      <div className="search-options-row">
        <div className="gallery-mode-toggle" role="group" aria-label="Tipul desenelor">
          <button
            type="button"
            className={`gallery-layout-button ${imageMode === 'lineart' ? 'active' : ''}`}
            onClick={() => onImageModeChange('lineart')}
            aria-label="Rezultate alb-negru"
            title="Alb-negru"
            aria-pressed={imageMode === 'lineart'}
          >
            <Contrast size={18} />
            <span>Alb-negru</span>
          </button>
          <button
            type="button"
            className={`gallery-layout-button ${imageMode === 'color' ? 'active' : ''}`}
            onClick={() => onImageModeChange('color')}
            aria-label="Rezultate colorate"
            title="Color"
            aria-pressed={imageMode === 'color'}
          >
            <Palette size={18} />
            <span>Color</span>
          </button>
        </div>
      </div>

      <div className="google-suggestions-bar" aria-label="Categorii rapide">
        <div className="google-suggestions-scroll">
          {QUICK_SEARCHES.map(({ label, emoji }) => (
            <button
              key={label}
              type="button"
              className="google-sug-chip"
              onClick={() => onSearch(label)}
            >
              <span aria-hidden="true">{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
