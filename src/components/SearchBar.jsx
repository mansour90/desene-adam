import React, { useState, useEffect } from 'react';
import { Contrast, LayoutGrid, List, Palette, Search, X } from 'lucide-react';
import { useTopicIcons } from '../hooks/useTopicIcons';

// Butoane doar cu poză (fără text). `q` = termenul căutat, `en` = căutarea pentru poza butonului,
// `label` = doar pentru accesibilitate, `emoji` = rezerva dacă poza nu se încarcă.
const QUICK_SEARCHES = [
  { label: 'SpongeBob', q: 'SpongeBob', en: 'SpongeBob SquarePants cartoon', emoji: '🧽' },
  { label: 'Spider-Man', q: 'Spider-Man', en: 'Spider-Man cartoon', emoji: '🕷️' },
  { label: 'Sonic', q: 'Sonic the Hedgehog', en: 'Sonic the Hedgehog cartoon', emoji: '🦔' },
  { label: 'Pikachu', q: 'Pikachu', en: 'Pikachu cartoon', emoji: '⚡' },
  { label: 'Elsa Frozen', q: 'Elsa Frozen', en: 'Elsa Frozen cartoon', emoji: '❄️' },
  { label: 'Dinozauri', q: 'Dinozauri', en: 'cute cartoon dinosaur', emoji: '🦖' },
  { label: 'Mașini', q: 'Mașini', en: 'cartoon car', emoji: '🚗' },
  { label: 'Mașini de curse', q: 'Mașini de curse', en: 'cartoon race car', emoji: '🏎️' },
  { label: 'Animale', q: 'Animale', en: 'cute cartoon lion', emoji: '🦁' },
  { label: 'Cățeluși', q: 'Cățeluși', en: 'cute cartoon puppy', emoji: '🐶' },
  { label: 'Pisicuțe', q: 'Pisicuțe', en: 'cute cartoon kitten', emoji: '🐱' },
  { label: 'Prințese', q: 'Prințese', en: 'cartoon princess', emoji: '👑' },
  { label: 'Unicorn', q: 'Unicorn', en: 'cute cartoon unicorn', emoji: '🦄' },
  { label: 'Roboți', q: 'Roboți', en: 'cute cartoon robot', emoji: '🤖' },
  { label: 'Avioane', q: 'Avioane', en: 'cartoon airplane', emoji: '✈️' },
  { label: 'Spațiu', q: 'Spațiu', en: 'cartoon rocket', emoji: '🚀' },
  { label: 'Supereroi', q: 'Supereroi', en: 'cartoon superhero', emoji: '🦸' },
  { label: 'Pompieri', q: 'Mașină de pompieri', en: 'cartoon fire truck', emoji: '🚒' },
  { label: 'Tractor', q: 'Tractor', en: 'cartoon tractor', emoji: '🚜' },
  { label: 'Fluturi', q: 'Fluturi', en: 'cartoon butterfly', emoji: '🦋' }
];

// Poze proprii: pune fișierul în public/icons/ și trece-l aici, de ex. { 'Spider-Man': 'spiderman.png' }.
// Are prioritate față de poza adusă automat din căutare.
const CUSTOM_ICON_FILES = {};

function TopicIcon({ emoji, src }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) return <span aria-hidden="true">{emoji}</span>;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}

export default function SearchBar({
  onSearch,
  currentQuery,
  imageMode,
  onImageModeChange,
  columnsPerRow,
  onColumnsPerRowChange
}) {
  const [inputValue, setInputValue] = useState(currentQuery || '');
  const topicIcons = useTopicIcons(QUICK_SEARCHES);

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
            placeholder="Caută un desen..."
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
        <div className="gallery-layout-toggle" role="group" aria-label="Număr de poze pe rând">
          <button
            type="button"
            className={`gallery-layout-button ${columnsPerRow === 2 ? 'active' : ''}`}
            onClick={() => onColumnsPerRowChange(2)}
            aria-label="Afișează două poze pe rând"
            title="Două poze pe rând"
            aria-pressed={columnsPerRow === 2}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            type="button"
            className={`gallery-layout-button ${columnsPerRow === 1 ? 'active' : ''}`}
            onClick={() => onColumnsPerRowChange(1)}
            aria-label="Afișează o poză pe rând"
            title="O poză pe rând"
            aria-pressed={columnsPerRow === 1}
          >
            <List size={18} />
          </button>
        </div>
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

      <div className="emoji-grid" role="group" aria-label="Alege un desen">
        {QUICK_SEARCHES.map(({ label, q, emoji }) => {
          const customFile = CUSTOM_ICON_FILES[label];
          const src = customFile ? `${import.meta.env.BASE_URL}icons/${customFile}` : topicIcons[label];
          return (
            <button
              key={label}
              type="button"
              className={`emoji-btn ${src ? 'has-img' : ''} ${currentQuery === q ? 'active' : ''}`}
              onClick={() => onSearch(q)}
              aria-label={label}
              title={label}
            >
              <TopicIcon emoji={emoji} src={src} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
