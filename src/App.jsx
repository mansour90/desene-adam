import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ImageGallery from './components/ImageGallery';
import ImagePreview from './components/ImagePreview';
import ParentSettings from './components/ParentSettings';
import ImageCollection from './components/ImageCollection';
import VoiceSearchControl from './components/VoiceSearchControl';
import { useImageSearch } from './hooks/useImageSearch';
import { isGoogleDriveConnected, uploadDrawingToGoogleDrive } from './services/googleDrive';
import { prepareColoringDrawingForDrive } from './services/imageDownload';
import { markImageSavedInSession } from './utils/fileUtils';
import {
  FAVORITES_STORAGE_KEY,
  SEND_QUEUE_STORAGE_KEY,
  getImageCollectionKey,
  readImageCollection,
  writeImageCollection
} from './utils/imageCollections';
import { ArrowUp, House, Send, Heart, Settings, LoaderCircle, CloudUpload } from 'lucide-react';
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
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => isGoogleDriveConnected());
  const [imageMode, setImageMode] = useState('lineart');
  const [columnsPerRow, setColumnsPerRow] = useState(2);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [favorites, setFavorites] = useState(() => readImageCollection(FAVORITES_STORAGE_KEY));
  const [sendQueue, setSendQueue] = useState(() => readImageCollection(SEND_QUEUE_STORAGE_KEY));
  const [isSendingQueue, setIsSendingQueue] = useState(false);
  const [sendProgress, setSendProgress] = useState({ done: 0, total: 0 });
  const [sendMessage, setSendMessage] = useState('');
  const [previewMode, setPreviewMode] = useState('lineart');
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    writeImageCollection(FAVORITES_STORAGE_KEY, favorites);
  }, [favorites]);

  useEffect(() => {
    writeImageCollection(SEND_QUEUE_STORAGE_KEY, sendQueue);
  }, [sendQueue]);

  useEffect(() => {
    const updateScrollTopVisibility = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
    updateScrollTopVisibility();
    return () => window.removeEventListener('scroll', updateScrollTopVisibility);
  }, []);

  // Căutare manuală, vocală sau prin sugestii conexe
  const handleSearchSubmit = (newQuery) => {
    search(newQuery, imageMode);
  };

  const handleImageModeChange = (newMode) => {
    setImageMode(newMode);
    if (query) {
      search(query, newMode);
    }
  };

  // Selectare desen pentru previzualizare
  const handleSelectImage = (img, mode = imageMode, sourceImages = images) => {
    setSelectedImage(img);
    setPreviewMode(mode);
    setPreviewImages(sourceImages);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  const updateCollection = (setter, updater) => {
    setter((current) => updater(current));
  };

  const handleToggleFavorite = (image, mode = imageMode) => {
    const key = getImageCollectionKey(image);
    updateCollection(setFavorites, (current) => {
      if (current.some((item) => item.key === key)) {
        return current.filter((item) => item.key !== key);
      }
      return [{ key, image, mode }, ...current];
    });
  };

  const handleToggleQueue = (image) => {
    if (imageMode !== 'lineart' && activeTab === 'home') return;
    const key = getImageCollectionKey(image);
    updateCollection(setSendQueue, (current) => {
      if (current.some((item) => item.key === key)) {
        return current.filter((item) => item.key !== key);
      }
      return [{ key, image, mode: 'lineart' }, ...current];
    });
    setSendMessage('');
  };

  const handleSendAll = async () => {
    if (!sendQueue.length || isSendingQueue) return;
    if (!(isGoogleConnected || isGoogleDriveConnected())) {
      setSendMessage('Conectează Google Drive din Setări > Mod Părinte pentru a trimite pozele.');
      setIsParentSettingsOpen(true);
      return;
    }

    const queueToSend = [...sendQueue];
    let completed = 0;
    let failed = 0;
    setIsSendingQueue(true);
    setSendProgress({ done: 0, total: queueToSend.length });
    setSendMessage('');

    for (const queuedItem of queueToSend) {
      try {
        const { fileName, blob } = await prepareColoringDrawingForDrive(queuedItem.image);
        await uploadDrawingToGoogleDrive(blob, fileName);
        markImageSavedInSession(queuedItem.image);
        updateCollection(setSendQueue, (current) =>
          current.filter((item) => item.key !== queuedItem.key)
        );
        completed += 1;
      } catch (error) {
        console.error(`Nu s-a putut trimite imaginea ${queuedItem.image.title}:`, error);
        failed += 1;
      }
      setSendProgress({ done: completed + failed, total: queueToSend.length });
    }

    setIsSendingQueue(false);
    setSendMessage(
      failed
        ? `${completed} trimise. ${failed} au rămas în coadă pentru reîncercare.`
        : `${completed} ${completed === 1 ? 'poză trimisă' : 'poze trimise'} în Google Drive.`
    );
  };

  const navigationItems = [
    { id: 'home', label: 'Acasă', icon: House },
    { id: 'queue', label: 'Trimite', icon: Send, count: sendQueue.length },
    { id: 'favorites', label: 'Favorite', icon: Heart, count: favorites.length },
    { id: 'settings', label: 'Setări', icon: Settings }
  ];

  return (
    <div className="app-container">
      {/* Antet cu logo și buton discret Mod Părinte */}
      <Header />

      <main className={`main-content app-screen app-screen-${activeTab}`}>
        {activeTab === 'home' ? (
          <>
        {/* Zona de căutare mare cu microfon Web Speech ro-RO */}
        <SearchBar
          onSearch={handleSearchSubmit}
          currentQuery={query}
          imageMode={imageMode}
          onImageModeChange={handleImageModeChange}
          columnsPerRow={columnsPerRow}
          onColumnsPerRowChange={setColumnsPerRow}
        />

        {/* Galerie stil Google Images (Presetat: Dimensiune Mari + Doar de colorat) */}
        <ImageGallery
          images={images}
          suggestions={suggestions}
          isLoading={isLoading}
          error={error}
          query={query}
          imageMode={imageMode}
          favorites={favorites}
          queue={sendQueue}
          onToggleFavorite={handleToggleFavorite}
          onToggleQueue={handleToggleQueue}
          onSelectImage={handleSelectImage}
          columnsPerRow={columnsPerRow}
        />
          </>
        ) : activeTab === 'favorites' ? (
          <ImageCollection
            title="Favorite"
            emptyText="Atinge de două ori o poză ca să o adaugi la favorite."
            items={favorites}
            favorites={favorites}
            queue={sendQueue}
            onSelectImage={handleSelectImage}
            onToggleFavorite={handleToggleFavorite}
            onToggleQueue={handleToggleQueue}
          />
        ) : activeTab === 'queue' ? (
          <>
            <ImageCollection
              title="Poze de trimis"
              emptyText="Ține apăsat pe o planșă alb-negru din Acasă ca să o adaugi aici."
              items={sendQueue}
              favorites={favorites}
              queue={sendQueue}
              onSelectImage={handleSelectImage}
              onToggleFavorite={handleToggleFavorite}
              onToggleQueue={handleToggleQueue}
              queueOnly
            />
            {sendMessage && <p className="send-queue-message" role="status">{sendMessage}</p>}
            {sendQueue.length > 0 && (
              <div className="send-all-panel">
                {isSendingQueue && (
                  <div className="send-all-progress" role="status">
                    Se trimit {sendProgress.done} din {sendProgress.total} poze...
                  </div>
                )}
                <button
                  type="button"
                  className="send-all-button"
                  onClick={handleSendAll}
                  disabled={isSendingQueue}
                >
                  {isSendingQueue ? <LoaderCircle className="spinner-icon" size={22} /> : <CloudUpload size={22} />}
                  <span>{isSendingQueue ? 'SE TRIMIT POZELE...' : 'TRIMITE TOATE POZELE'}</span>
                  <strong>{sendQueue.length}</strong>
                </button>
              </div>
            )}
          </>
        ) : (
          <section className="settings-screen">
            <h2>Setări</h2>
            <p>Gestionează aplicația și contul pentru salvarea desenelor.</p>
            <button type="button" className="settings-parent-row" onClick={() => setIsParentSettingsOpen(true)}>
              <span className="settings-parent-icon"><Settings size={22} /></span>
              <span className="settings-parent-copy">
                <strong>Mod Părinte</strong>
                <small>Google Drive, PIN și istoricul trimiterilor</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          </section>
        )}
      </main>

      {showScrollTop && (
        <button
          type="button"
          className="scroll-top-button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Mergi la începutul paginii"
          title="Sus"
        >
          <ArrowUp size={24} />
        </button>
      )}

      {/* Previzualizare desen în mărime mare & descărcare JPG / Google Drive */}
      {selectedImage && (
        <ImagePreview
          image={selectedImage}
          images={previewImages}
          imageMode={previewMode}
          onSelectImage={(image) => handleSelectImage(image, previewMode)}
          onClose={handleClosePreview}
          isGoogleConnected={isGoogleConnected}
        />
      )}

      {/* Panou Mod Părinte protejat cu PIN */}
      <ParentSettings
        isOpen={isParentSettingsOpen}
        onClose={() => setIsParentSettingsOpen(false)}
        onAuthChanged={(connected) => setIsGoogleConnected(connected)}
      />

      <nav className="bottom-navigation" aria-label="Navigare principală">
        {navigationItems.map(({ id, label, icon: Icon, count }) => (
          <React.Fragment key={id}>
            <button
              type="button"
              className={`bottom-navigation-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <span className="bottom-navigation-icon-wrap">
                <Icon size={22} fill={id === 'favorites' && activeTab === id ? 'currentColor' : 'none'} />
                {count > 0 && <span className="bottom-navigation-count">{count > 99 ? '99+' : count}</span>}
              </span>
              <span>{label}</span>
            </button>
            {id === 'queue' && (
              <VoiceSearchControl
                onSearch={handleSearchSubmit}
                onActivateHome={() => {
                  setActiveTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
