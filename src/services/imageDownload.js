/**
 * Serviciu pentru procesarea, conversia în JPG de calitate înaltă
 * și descărcarea desenelor pentru copii (compatibil mobile & desktop).
 */

import { generateFileName } from '../utils/fileUtils';

/**
 * Încarcă o imagine într-un element HTMLImageElement cu suport CORS
 * @param {string} url 
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Nu s-a putut încărca imaginea pentru procesare.'));
    img.src = url;
  });
}

/**
 * Convertește o imagine într-un Blob JPG cu fundal alb pur (ideal pentru imprimare)
 * Rezolvă problema fundalurilor transparente din PNG/SVG care ar deveni negre în JPG.
 * 
 * @param {string} imageUrl - URL-ul imaginii (original sau preview de rezoluție înaltă)
 * @param {number} [quality=0.95] - Calitate JPEG (0.0 - 1.0)
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function convertToJpgBlob(imageUrl, quality = 0.95) {
  // Încercăm mai întâi fetch pentru a gestiona posibile erori de rețea
  let blobSource = null;
  let objectUrl = null;

  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (response.ok) {
      blobSource = await response.blob();
      objectUrl = URL.createObjectURL(blobSource);
    }
  } catch (e) {
    // Dacă fetch-ul direct eșuează din cauza rețelei, încercăm direct prin Image src
    console.warn('Fetch direct a eșuat, încercăm încărcarea directă prin Image element:', e);
  }

  const srcToLoad = objectUrl || imageUrl;
  const img = await loadImage(srcToLoad);

  // Eliberăm objectUrl dacă a fost creat
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }

  // Determinăm dimensiunile optime pentru imprimare
  const naturalWidth = img.naturalWidth || img.width || 1200;
  const naturalHeight = img.naturalHeight || img.height || 1200;

  const canvas = document.createElement('canvas');
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Nu s-a putut inițializa contextul grafic Canvas.');
  }

  // 1. Umplem fundalul cu alb complet (#ffffff)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, naturalWidth, naturalHeight);

  // 2. Desenăm imaginea
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

  // 3. Exportăm în format image/jpeg
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ blob, width: naturalWidth, height: naturalHeight });
        } else {
          reject(new Error('Conversia în format JPG a eșuat.'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Pregătește un desen JPG pentru încărcarea în Google Drive
 * @param {Object} imageItem - Obiectul imaginii selectate
 * @returns {Promise<{ fileName: string, blob: Blob }>}
 */
export async function prepareColoringDrawingForDrive(imageItem) {
  // URL-ul sursă: folosim proxyUrl sau originalUrl
  const targetUrl = imageItem.proxyUrl || imageItem.originalUrl || imageItem.previewUrl;

  const { blob } = await convertToJpgBlob(targetUrl, 0.95);
  const fileName = generateFileName(imageItem.searchTerm || imageItem.title || 'desen', 'jpg');

  return {
    fileName,
    blob
  };
}
