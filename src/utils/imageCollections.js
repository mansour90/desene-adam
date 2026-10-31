export const FAVORITES_STORAGE_KEY = 'desene_adam_favorites';
export const SEND_QUEUE_STORAGE_KEY = 'desene_adam_send_queue';

export function getImageCollectionKey(image) {
  return image?.key || image?.originalUrl || image?.previewUrl || String(image?.id || '');
}

export function readImageCollection(storageKey) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(stored) ? stored.filter((image) => image && getImageCollectionKey(image)) : [];
  } catch {
    return [];
  }
}

export function writeImageCollection(storageKey, images) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(images));
  } catch (error) {
    console.error('Nu s-a putut salva colecția de imagini:', error);
  }
}