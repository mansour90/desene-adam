/**
 * Serviciu pentru integrarea cu Google Identity Services (GIS) și Google Drive v3 API.
 * Asigură structura de foldere cerută:
 *   Desene Adam/
 *     YYYY-MM-DD_HH-mm/
 *       dinozaur_01.jpg
 */

import { getOrCreateSessionFolderName, getSessionFolderId, setSessionFolderId } from '../utils/dateFolders';

const STORAGE_KEY_TOKEN = 'desene_adam_drive_token';
const STORAGE_KEY_TOKEN_EXP = 'desene_adam_drive_token_exp';
const STORAGE_KEY_CLIENT_ID = 'desene_adam_google_client_id';
const STORAGE_KEY_ROOT_FOLDER_NAME = 'desene_adam_root_folder_name';
const STORAGE_KEY_ROOT_FOLDER_ID = 'desene_adam_root_folder_id';
const STORAGE_KEY_RECENT_SAVES = 'desene_adam_recent_saves';

/**
 * Returnează Client ID-ul Google configurat (din env sau din setările părintelui)
 */
export function getGoogleClientId() {
  const customId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  if (customId && customId.trim()) return customId.trim();
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

/**
 * Salvează Client ID-ul Google din setările părintelui
 */
export function setGoogleClientId(clientId) {
  if (clientId) {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  }
}

/**
 * Returnează numele folderului rădăcină (implicit "Desene Adam")
 */
export function getRootFolderName() {
  return localStorage.getItem(STORAGE_KEY_ROOT_FOLDER_NAME) || 'Desene Adam';
}

/**
 * Configurează numele folderului rădăcină
 */
export function setRootFolderName(name) {
  localStorage.setItem(STORAGE_KEY_ROOT_FOLDER_NAME, name || 'Desene Adam');
  // Resetăm ID-ul pentru a căuta noul nume
  localStorage.removeItem(STORAGE_KEY_ROOT_FOLDER_ID);
}

/**
 * Returnează token-ul curent dacă este valid și neexpirat
 */
export function getValidAccessToken() {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const exp = localStorage.getItem(STORAGE_KEY_TOKEN_EXP);
  if (!token || !exp) return null;

  // Verifică expirarea (adăugăm 60s marjă de siguranță)
  if (Date.now() > Number(exp) - 60000) {
    return null;
  }
  return token;
}

/**
 * Verifică dacă utilizatorul este conectat la Google Drive
 */
export function isGoogleDriveConnected() {
  return !!getValidAccessToken();
}

/**
 * Deconectează contul Google Drive din aplicație
 */
export function disconnectGoogleDrive() {
  const token = getValidAccessToken();
  if (token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(token, () => {});
    } catch (e) {
      console.warn('Nu s-a putut revoca tokenul:', e);
    }
  }
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TOKEN_EXP);
  localStorage.removeItem(STORAGE_KEY_ROOT_FOLDER_ID);
}

/**
 * Inițiază fluxul de autentificare Google OAuth 2.0 Token Client (Google Identity Services)
 * @returns {Promise<string>} Token-ul de acces
 */
export function requestGoogleDriveAuth() {
  return new Promise((resolve, reject) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      reject(new Error('Google Client ID nu este configurat. Vă rugăm să îl completați în Mod Părinte.'));
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error('Librăria Google Identity Services nu s-a încărcat încă. Verificați conexiunea la internet.'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error) {
            reject(new Error(`Eroare autentificare Google: ${response.error}`));
            return;
          }
          if (response.access_token) {
            const expiresIn = Number(response.expires_in || 3599);
            const expTime = Date.now() + expiresIn * 1000;
            localStorage.setItem(STORAGE_KEY_TOKEN, response.access_token);
            localStorage.setItem(STORAGE_KEY_TOKEN_EXP, String(expTime));
            resolve(response.access_token);
          } else {
            reject(new Error('Nu s-a primit un token de acces valid.'));
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Obține sau creează folderul principal („Desene Adam”)
 */
async function getOrCreateRootFolder(accessToken) {
  const rootName = getRootFolderName();
  const cachedId = localStorage.getItem(STORAGE_KEY_ROOT_FOLDER_ID);

  // Verificăm dacă folderul cached există încă
  if (cachedId) {
    try {
      const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cachedId}?fields=id,name,trashed`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (checkRes.ok) {
        const file = await checkRes.json();
        if (!file.trashed && file.name === rootName) {
          return cachedId;
        }
      }
    } catch (e) {
      // continuăm spre căutare
    }
  }

  // Căutăm folderul după nume
  const query = `name = '${rootName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    throw new Error(`Eroare la căutarea folderului rădăcină: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const foundId = searchData.files[0].id;
    localStorage.setItem(STORAGE_KEY_ROOT_FOLDER_ID, foundId);
    return foundId;
  }

  // Creează folderul dacă nu există
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: rootName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    throw new Error(`Nu s-a putut crea folderul "${rootName}" în Google Drive.`);
  }

  const createdFolder = await createRes.json();
  localStorage.setItem(STORAGE_KEY_ROOT_FOLDER_ID, createdFolder.id);
  return createdFolder.id;
}

/**
 * Obține sau creează folderul de sesiune curent (ex: 2026-10-31_10-30) în folderul rădăcină
 */
async function getOrCreateSessionFolder(accessToken, rootFolderId) {
  const sessionFolderName = getOrCreateSessionFolderName();
  const cachedSessionFolderId = getSessionFolderId();

  if (cachedSessionFolderId) {
    try {
      const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files/${cachedSessionFolderId}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (checkRes.ok) {
        const file = await checkRes.json();
        if (!file.trashed) return cachedSessionFolderId;
      }
    } catch (e) {
      // continuăm
    }
  }

  // Căutăm dacă există deja un folder cu acest nume de sesiune în folderul părinte
  const query = `name = '${sessionFolderName}' and '${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const foundId = searchData.files[0].id;
      setSessionFolderId(foundId);
      return foundId;
    }
  }

  // Creăm folderul pentru această sesiune
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: sessionFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId]
    })
  });

  if (!createRes.ok) {
    throw new Error(`Nu s-a putut crea folderul sesiunii "${sessionFolderName}".`);
  }

  const newFolder = await createRes.json();
  setSessionFolderId(newFolder.id);
  return newFolder.id;
}

/**
 * Încarcă un desen JPG în Google Drive în folderul sesiunii curente
 * @param {Blob} imageBlob - Imaginea în format JPEG
 * @param {string} fileName - Numele fișierului (ex: dinozaur_01.jpg)
 * @param {Function} [onProgress] - Callback pentru afișarea procentului (0 - 100)
 * @returns {Promise<{ fileId: string, webViewLink: string, folderName: string }>}
 */
export async function uploadDrawingToGoogleDrive(imageBlob, fileName, onProgress) {
  let accessToken = getValidAccessToken();
  if (!accessToken) {
    // Încercăm să obținem autentificarea
    accessToken = await requestGoogleDriveAuth();
  }

  if (onProgress) onProgress(15);

  // 1. Asigurăm folderul principal „Desene Adam”
  const rootFolderId = await getOrCreateRootFolder(accessToken);
  if (onProgress) onProgress(35);

  // 2. Asigurăm folderul de sesiune „YYYY-MM-DD_HH-mm”
  const sessionFolderId = await getOrCreateSessionFolder(accessToken, rootFolderId);
  const sessionFolderName = getOrCreateSessionFolderName();
  if (onProgress) onProgress(55);

  // 3. Încărcare fișier prin multipart upload
  const metadata = {
    name: fileName,
    parents: [sessionFolderId],
    mimeType: 'image/jpeg'
  };

  const boundary = '-------deseneadam3141592653589';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
  const fileHeader = `Content-Type: image/jpeg\r\n\r\n`;

  // Construire payload multipart ca Blob
  const multipartBlob = new Blob([
    delimiter,
    metaPart,
    delimiter,
    fileHeader,
    imageBlob,
    closeDelimiter
  ], { type: `multipart/related; boundary=${boundary}` });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round(55 + (e.loaded / e.total) * 40);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        const res = JSON.parse(xhr.responseText);

        // Înregistrăm salvarea în istoricul din Mod Părinte
        recordRecentSave({
          id: res.id,
          fileName,
          folderName: `${getRootFolderName()}/${sessionFolderName}`,
          date: new Date().toISOString(),
          webViewLink: res.webViewLink || `https://drive.google.com/file/d/${res.id}/view`,
          status: 'Succes'
        });

        resolve({
          fileId: res.id,
          webViewLink: res.webViewLink || `https://drive.google.com/file/d/${res.id}/view`,
          folderName: sessionFolderName
        });
      } else {
        let errDesc = 'Eroare încărcare Google Drive';
        try {
          const errJson = JSON.parse(xhr.responseText);
          errDesc = errJson.error?.message || errDesc;
        } catch (e) {}
        reject(new Error(errDesc));
      }
    };

    xhr.onerror = () => reject(new Error('Eroare de rețea la încărcarea în Google Drive.'));
    xhr.send(multipartBlob);
  });
}

/**
 * Înregistrează o salvare recentă în memoria locală pentru consultare în Mod Părinte
 */
function recordRecentSave(entry) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY_RECENT_SAVES) || '[]');
    const updated = [entry, ...existing].slice(0, 30); // păstrăm ultimele 30
    localStorage.setItem(STORAGE_KEY_RECENT_SAVES, JSON.stringify(updated));
  } catch (e) {
    console.error('Nu s-a putut salva istoricul:', e);
  }
}

/**
 * Returnează lista celor mai recente salvări pentru Mod Părinte
 */
export function getRecentSaves() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_RECENT_SAVES) || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Curăță istoricul salvărilor
 */
export function clearRecentSaves() {
  localStorage.removeItem(STORAGE_KEY_RECENT_SAVES);
}

/**
 * Testează conexiunea Google Drive (pentru panoul Mod Părinte)
 */
export async function testGoogleDriveConnection() {
  const token = getValidAccessToken();
  if (!token) {
    throw new Error('Niciun cont nu este conectat în acest moment.');
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Test conexiune eșuat: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.user;
}
