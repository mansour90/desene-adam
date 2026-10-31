/**
 * Utilitare pentru gestionarea folderelor de sesiune pentru Google Drive
 * Format cerut: YYYY-MM-DD_HH-mm (ex: 2026-10-31_10-30)
 */

const SESSION_STORAGE_KEY = 'desene_adam_session_folder_name';
const SESSION_FOLDER_ID_KEY = 'desene_adam_session_folder_id';

/**
 * Formatează o dată în formatul cerut: YYYY-MM-DD_HH-mm
 * @param {Date} [d=new Date()]
 * @returns {string}
 */
export function formatDateTimeFolder(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Returnează numele folderului de sesiune curent din sessionStorage,
 * sau generează unul nou dacă este prima acțiune din această sesiune.
 * @returns {string}
 */
export function getOrCreateSessionFolderName() {
  let folderName = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!folderName) {
    folderName = formatDateTimeFolder(new Date());
    sessionStorage.setItem(SESSION_STORAGE_KEY, folderName);
  }
  return folderName;
}

/**
 * Returnează ID-ul folderului salvat pe Google Drive pentru această sesiune (dacă există deja creat)
 * @returns {string|null}
 */
export function getSessionFolderId() {
  return sessionStorage.getItem(SESSION_FOLDER_ID_KEY);
}

/**
 * Salvează ID-ul folderului de sesiune Google Drive creat
 * @param {string} id 
 */
export function setSessionFolderId(id) {
  if (id) {
    sessionStorage.setItem(SESSION_FOLDER_ID_KEY, id);
  } else {
    sessionStorage.removeItem(SESSION_FOLDER_ID_KEY);
  }
}

/**
 * Resetează sesiunea pentru a genera un folder nou la următoarea salvare
 */
export function resetSessionFolder() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_FOLDER_ID_KEY);
}
