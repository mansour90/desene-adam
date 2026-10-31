import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// Înregistrare automată PWA Service Worker
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('Versiune nouă Desene Adam disponibilă.');
    },
    onOfflineReady() {
      console.log('Aplicația Desene Adam este pregătită pentru utilizare offline!');
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
