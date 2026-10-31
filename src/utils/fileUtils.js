/**
 * Utilitare pentru gestionarea numelor de fișiere, curățarea caracterelor
 * și prevenirea duplicatelor în aceeași sesiune.
 */

// Memorie sesiune pentru desene deja descărcate/salvate
const savedImageIds = new Set();
const SAVED_IMAGE_KEYS_STORAGE_KEY = 'desene_adam_saved_image_keys';
// Contor pentru numărul fișierelor per categorie/termen în sesiune
const termCounters = new Map();

function getImageIdentityKeys(imageOrId) {
  if (typeof imageOrId === 'string') return [imageOrId];
  if (!imageOrId) return [];
  return [imageOrId.originalUrl, imageOrId.previewUrl, imageOrId.id].filter(Boolean).map(String);
}

/**
 * Elimină diacriticele și caracterele speciale pentru a crea un nume sigur de fișier
 * ex: "Mașini de curse!" -> "masini_de_curse"
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeFilename(str) {
  if (!str) return 'desen';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimină diacriticele
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30) || 'desen';
}

/**
 * Generează un nume de fișier curat și numerotat precum: dinozaur_01.jpg, dinozaur_02.jpg
 * @param {string} term - Termenul căutat sau titlul imaginii
 * @param {string} [extension='jpg']
 * @returns {string}
 */
export function generateFileName(term, extension = 'jpg') {
  const base = sanitizeFilename(term);
  const currentCount = (termCounters.get(base) || 0) + 1;
  termCounters.set(base, currentCount);

  const numStr = String(currentCount).padStart(2, '0');
  return `${base}_${numStr}.${extension}`;
}

/**
 * Verifică dacă o imagine a fost deja salvată în această sesiune
 * @param {string} imageId 
 * @returns {boolean}
 */
export function isImageSavedInSession(imageOrId) {
  const keys = getImageIdentityKeys(imageOrId);
  if (keys.some((key) => savedImageIds.has(key))) return true;

  try {
    const savedKeys = JSON.parse(localStorage.getItem(SAVED_IMAGE_KEYS_STORAGE_KEY) || '[]');
    return keys.some((key) => savedKeys.includes(key));
  } catch {
    return false;
  }
}

/**
 * Marchează o imagine ca fiind salvată în această sesiune
 * @param {string} imageId 
 */
export function markImageSavedInSession(imageOrId) {
  const keys = getImageIdentityKeys(imageOrId);
  if (!keys.length) return;

  keys.forEach((key) => savedImageIds.add(key));
  try {
    const storedKeys = JSON.parse(localStorage.getItem(SAVED_IMAGE_KEYS_STORAGE_KEY) || '[]');
    const mergedKeys = [...new Set([...storedKeys, ...keys])];
    localStorage.setItem(SAVED_IMAGE_KEYS_STORAGE_KEY, JSON.stringify(mergedKeys));
  } catch (error) {
    console.error('Nu s-a putut salva lista desenelor trimise:', error);
  }
}

/**
 * Resetează istoricul duplicatelor din sesiune
 */
export function resetSessionSavedImages() {
  savedImageIds.clear();
  termCounters.clear();
}
