import { useEffect, useState } from 'react';
import { searchColoringImages } from '../services/imageSearch';

const STORAGE_KEY = 'adam-topic-icons-v1';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Aduce câte o poză reală pentru fiecare buton (prima imagine colorată din căutare)
 * și o păstrează în aplicație. Cererile merg una câte una, ca să nu depășim limita API-ului.
 * Dacă o poză lipsește sau nu se încarcă, butonul rămâne cu emoji.
 */
export function useTopicIcons(topics) {
  const [icons, setIcons] = useState(readCache);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cache = readCache();
      let failures = 0;

      for (const { label, en } of topics) {
        if (cancelled || failures >= 3) return;
        if (cache[label]) continue;

        try {
          const result = await searchColoringImages(en, 0, 'color');
          const url = result.items.find((item) => item.previewUrl)?.previewUrl;
          if (url) {
            cache[label] = url;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
            if (!cancelled) setIcons({ ...cache });
            failures = 0;
          } else {
            failures += 1;
          }
        } catch {
          failures += 1;
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topics]);

  return icons;
}
