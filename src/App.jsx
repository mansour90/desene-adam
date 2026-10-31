import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ImageGallery from './components/ImageGallery';
import ImagePreview from './components/ImagePreview';
import ParentSettings from './components/ParentSettings';
import { useImageSearch } from './hooks/useImageSearch';
import { isGoogleDriveConnected } from './services/googleDrive';
import './style.css';

export default function App() {
  const {
    query,
    images,
    suggestions,
    isLoading,
    error,
    search
  } = useImageSearch();

  const [selectedImage, setSelectedImage] = useState(null);
  const [isParentSettingsOpen, setIsParentSettingsOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Verifică statusul Google Drive la încărcare
  useEffect(() => {
    setIsGoogleConnected(isGoogleDriveConnected());
  }, []);

  // La pornire încărcăm automat desene mari exact ca în exemplul din captură
  useEffect(() => {
    search('spongebob characters');
  }, [search]);

  // Căutare manuală, vocală sau prin sugestii conexe
  const handleSearchSubmit = (newQuery) => {
    search(newQuery);
  };

  // Selectare desen pentru previzualizare
  const handleSelectImage = (img) => {
    setSelectedImage(img);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  return (
    <div className="app-container">
      {/* Antet cu logo și buton discret Mod Părinte */}
      <Header
        onOpenParentSettings={() => setIsParentSettingsOpen(true)}
        isGoogleConnected={isGoogleConnected}
      />

      <main className="main-content">
        {/* Zona de căutare mare cu microfon Web Speech ro-RO */}
        <SearchBar
          onSearch={handleSearchSubmit}
          currentQuery={query}
        />

        {/* Galerie stil Google Images (Presetat: Dimensiune Mari + Doar de colorat) */}
        <ImageGallery
          images={images}
          suggestions={suggestions}
          isLoading={isLoading}
          error={error}
          query={query}
          onSearchQuery={handleSearchSubmit}
          onSelectImage={handleSelectImage}
        />
      </main>

      {/* Previzualizare desen în mărime mare & descărcare JPG / Google Drive */}
      {selectedImage && (
        <ImagePreview
          image={selectedImage}
          onClose={handleClosePreview}
          isGoogleConnected={isGoogleConnected}
          onOpenParentSettings={() => setIsParentSettingsOpen(true)}
        />
      )}

      {/* Panou Mod Părinte protejat cu PIN */}
      <ParentSettings
        isOpen={isParentSettingsOpen}
        onClose={() => setIsParentSettingsOpen(false)}
        onAuthChanged={(connected) => setIsGoogleConnected(connected)}
      />
    </div>
  );
}
