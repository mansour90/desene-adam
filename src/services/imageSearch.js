/**
 * Serviciu de căutare imagini alb-negru la dimensiune mare ("Mari" + "Desen cu linii"),
 * identic cu rezultatele Google Images din exemplul trimis.
 */

// Dicționar de sugestii / tag-uri conexe ca pe Google Images
const SMART_SUGGESTIONS = {
  spongebob: ['Patrick Star', 'Sandy Cheeks', 'Squidward', 'Mr. Krabs', 'Plankton', 'Gary melcul', 'Bikini Bottom', 'Zâmbitor'],
  dinozaur: ['T-Rex', 'Triceratops', 'Pterodactil', 'Brontozaur', 'Stegozaur', 'Velociraptor', 'Pui dinozaur'],
  dinozauri: ['T-Rex', 'Triceratops', 'Pterodactil', 'Brontozaur', 'Stegozaur', 'Velociraptor', 'Pui dinozaur'],
  masina: ['Mașini de curse', 'Formula 1', 'Poliție', 'Pompieri', 'Monster Truck', 'Tractor', 'Camioane'],
  masini: ['Mașini de curse', 'Formula 1', 'Poliție', 'Pompieri', 'Monster Truck', 'Tractor', 'Camioane'],
  animal: ['Cățeluși', 'Pisicuțe', 'Leu', 'Elefant', 'Ursuleț', 'Iepuraș', 'Delfin', 'Ponei'],
  animale: ['Cățeluși', 'Pisicuțe', 'Leu', 'Elefant', 'Ursuleț', 'Iepuraș', 'Delfin', 'Ponei'],
  printesa: ['Elsa Frozen', 'Rapunzel', 'Castel fermecat', 'Rochie', 'Coroană', 'Unicorn', 'Cenușăreasa'],
  printese: ['Elsa Frozen', 'Rapunzel', 'Castel fermecat', 'Rochie', 'Coroană', 'Unicorn', 'Cenușăreasa'],
  robot: ['Transformers', 'Roboți uriași', 'Robot prietenos', 'Cyborg', 'Navă spațială'],
  roboti: ['Transformers', 'Roboți uriași', 'Robot prietenos', 'Cyborg', 'Navă spațială'],
  avion: ['Avion de pasageri', 'Avion de vânătoare', 'Elicopter', 'Planor', 'Piloți'],
  avioane: ['Avion de pasageri', 'Avion de vânătoare', 'Elicopter', 'Planor', 'Piloți'],
  spiderman: ['Omul Păianjen', 'Miles Morales', 'Spider-Gwen', 'Venom', 'Pânză de păianjen'],
  supererou: ['Spider-Man', 'Batman', 'Superman', 'Iron Man', 'Hulk', 'Răzbunătorii'],
  supereroi: ['Spider-Man', 'Batman', 'Superman', 'Iron Man', 'Hulk', 'Răzbunătorii'],
  spatiu: ['Astronaut', 'Rachetă spațială', 'Planete', 'Luna', 'Extratereștri', 'Sistemul solar'],
  pokemon: ['Pikachu', 'Charizard', 'Bulbasaur', 'Squirtle', 'Eevee', 'Mewtwo'],
  sonic: ['Sonic the Hedgehog', 'Tails', 'Knuckles', 'Shadow', 'Super Sonic'],
  frozen: ['Elsa', 'Anna', 'Olaf', 'Sven', 'Castel de gheață']
};

/**
 * Returnează sugestii inteligente ca pe Google Images pentru termenul căutat
 * @param {string} query 
 * @returns {string[]}
 */
export function getRelatedSuggestions(query) {
  if (!query) return ['SpongeBob', 'Dinozauri', 'Mașini', 'Spider-Man', 'Animale', 'Roboți'];

  const normalized = query.toLowerCase().trim();
  for (const [key, suggestions] of Object.entries(SMART_SUGGESTIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return suggestions;
    }
  }

  // Sugestii generale de stil de colorat
  return [
    `${query} ușor`,
    `${query} fericit`,
    `${query} mare`,
    `${query} contur clar`,
    `${query} simplu`
  ];
}

function getWikimediaSearchTerms(query, mode) {
  const topic = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(coloring|colouring)\s*(pages?|sheets?)?\b/g, '')
    .replace(/\b(de|desene|planse|colorat|characters?|pages?|pictures?|images?)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => ({
      dinozaur: 'dinosaur',
      dinozauri: 'dinosaur',
      masina: 'car',
      masini: 'cars',
      animal: 'animal',
      animale: 'animals',
      printesa: 'princess',
      printese: 'princess',
      robot: 'robot',
      roboti: 'robots',
      avion: 'airplane',
      avioane: 'airplanes',
      spatiu: 'space'
    })[word] || word)
    .join(' ');

  if (!topic) return [];
  return mode === 'lineart' ? [`${topic} coloring`, topic] : [topic];
}

async function searchWikimediaImages(query, offset, mode) {
  const searchTerms = getWikimediaSearchTerms(query, mode);

  for (const searchTerm of searchTerms) {
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    endpoint.searchParams.set('action', 'query');
    endpoint.searchParams.set('generator', 'search');
    endpoint.searchParams.set('gsrsearch', searchTerm);
    endpoint.searchParams.set('gsrnamespace', '6');
    endpoint.searchParams.set('gsrlimit', '40');
    endpoint.searchParams.set('gsroffset', String(offset));
    endpoint.searchParams.set('prop', 'imageinfo');
    endpoint.searchParams.set('iiprop', 'url|size|mime|extmetadata');
    endpoint.searchParams.set('iiurlwidth', '800');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('origin', '*');

    const response = await fetch(endpoint.toString());
    if (!response.ok) {
      throw new Error(`Căutarea Wikimedia Commons a eșuat (HTTP ${response.status}).`);
    }

    const data = await response.json();
    const items = Object.values(data.query?.pages || {})
      .filter((page) => {
        const info = page.imageinfo?.[0];
        const width = Number(info?.width) || 0;
        const height = Number(info?.height) || 0;
        return info?.url && info.mime?.startsWith('image/') && (width >= 600 || height >= 600);
      })
      .map((page) => {
        const info = page.imageinfo[0];
        const title = String(page.title || query)
          .replace(/^File:/i, '')
          .replace(/\.[a-z0-9]+$/i, '');

        return {
          id: `commons_${page.pageid}`,
          title: title || `${query} de colorat`,
          rawTitle: page.title || query,
          searchTerm: query,
          previewUrl: info.thumburl || info.url,
          originalUrl: info.url,
          proxyUrl: info.url,
          width: Number(info.width) || 1200,
          height: Number(info.height) || 1600,
          mime: info.mime,
          license: info.extmetadata?.LicenseShortName?.value || 'Wikimedia Commons; verifică licența la sursă.',
          artist: 'Wikimedia Commons',
          sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`
        };
      });

    if (items.length > 0) {
      return { items, total: items.length };
    }
  }

  return { items: [], total: 0 };
}

/**
 * Căutare reală web pentru planșe de colorat cu preset "Mari" și "Desen cu linii"
 * @param {string} query 
 * @param {number} [offset=0]
 * @returns {Promise<{ items: Array, suggestions: string[], total: number }>}
 */
export async function searchColoringImages(query, offset = 0, mode = 'lineart') {
  if (!query || !query.trim()) {
    return { items: [], suggestions: [], total: 0 };
  }

  const cleanQuery = query.trim();
  const suggestions = getRelatedSuggestions(cleanQuery);
  const workerBaseUrl = (import.meta.env.VITE_IMAGE_SEARCH_API_URL || '').trim().replace(/\/+$/, '');

  if (import.meta.env.PROD && !workerBaseUrl) {
    throw new Error('Căutarea Bing nu este configurată. Adaugă VITE_IMAGE_SEARCH_API_URL în GitHub Actions.');
  }

  const endpoint = workerBaseUrl
    ? new URL('/api/search-images', `${workerBaseUrl}/`)
    : new URL('/api/search-images', window.location.origin);
  endpoint.searchParams.set('q', cleanQuery);
  endpoint.searchParams.set('offset', String(offset));
  endpoint.searchParams.set('mode', mode);

  let response = null;
  let data = {};
  let workerError = null;
  try {
    response = await fetch(endpoint.toString());
    data = await response.json().catch(() => ({}));
    if (!response.ok) {
      workerError = new Error(data.error || `Căutarea Bing a eșuat (HTTP ${response.status}).`);
    }
  } catch (error) {
    workerError = error;
  }

  const bingItems = Array.isArray(data?.items) ? data.items : [];
  if (response?.ok && bingItems.length > 0) {
    return {
      items: bingItems,
      suggestions: data?.suggestions?.length ? data.suggestions : suggestions,
      total: Number(data.total) || bingItems.length
    };
  }

  const fallback = await searchWikimediaImages(cleanQuery, offset, mode);
  if (fallback.items.length > 0) {
    return { ...fallback, suggestions };
  }
  if (workerError) throw workerError;

  return { ...fallback, suggestions };
}
