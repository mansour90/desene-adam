import { useState, useCallback, useRef } from 'react';
import { searchColoringImages, getRelatedSuggestions } from '../services/imageSearch';

/**
 * Hook reactiv pentru căutarea desenelor alb-negru la rezoluție mare
 */
export function useImageSearch() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchIdRef = useRef(0);

  const search = useCallback(async (searchQuery) => {
    const trimmed = (searchQuery || '').trim();
    if (!trimmed) return;

    const currentSearchId = ++searchIdRef.current;
    setQuery(trimmed);
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setSuggestions(getRelatedSuggestions(trimmed));

    try {
      const result = await searchColoringImages(trimmed, 0);
      if (searchIdRef.current === currentSearchId) {
        setImages(result.items);
        if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
        }
        setIsLoading(false);
      }
    } catch (err) {
      if (searchIdRef.current === currentSearchId) {
        setError('A apărut o problemă la căutarea desenelor. Te rugăm să încerci din nou!');
        setIsLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setImages([]);
    setSuggestions([]);
    setError(null);
    setHasSearched(false);
  }, []);

  return {
    query,
    images,
    suggestions,
    isLoading,
    error,
    hasSearched,
    search,
    clear
  };
}
