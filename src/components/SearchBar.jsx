import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch, currentQuery }) {
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
    </div>
  );
}
