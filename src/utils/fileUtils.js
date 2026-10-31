/**
 * Utilitare pentru gestionarea numelor de fișiere, curățarea caracterelor
 * și prevenirea duplicatelor în aceeași sesiune.
 */

// Memorie sesiune pentru desene deja descărcate/salvate
const savedImageIds = new Set();
// Contor pentru numărul fișierelor per categorie/termen în sesiune
const termCounters = new Map();

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
export function isImageSavedInSession(imageId) {
  return savedImageIds.has(imageId);
}

/**
 * Marchează o imagine ca fiind salvată în această sesiune
 * @param {string} imageId 
 */
export function markImageSavedInSession(imageId) {
  if (imageId) {
    savedImageIds.add(imageId);
  }
}

/**
 * Resetează istoricul duplicatelor din sesiune
 */
export function resetSessionSavedImages() {
  savedImageIds.clear();
  termCounters.clear();
}
