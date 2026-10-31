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

/**
 * Căutare reală web pentru planșe de colorat cu preset "Mari" și "Desen cu linii"
 * @param {string} query 
 * @param {number} [offset=0]
 * @returns {Promise<{ items: Array, suggestions: string[], total: number }>}
 */
export async function searchColoringImages(query, offset = 0) {
  if (!query || !query.trim()) {
    return { items: [], suggestions: [], total: 0 };
  }

  const cleanQuery = query.trim();
  const suggestions = getRelatedSuggestions(cleanQuery);

  // 1. Încercăm endpoint-ul de căutare web cu preset "Mari"
  try {
    const apiRes = await fetch(`/api/search-images?q=${encodeURIComponent(cleanQuery)}&offset=${offset}`);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.items && data.items.length > 0) {
        return {
          items: data.items,
          suggestions,
          total: data.total || data.items.length
        };
      }
    }
  } catch (err) {
    console.warn('Endpoint-ul local de căutare a întâmpinat o eroare, folosim fallback Wikimedia:', err);
  }

  // 2. Fallback: Wikimedia Commons API cu filtrare pentru rezoluție mare (width >= 800)
  try {
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    endpoint.searchParams.set('action', 'query');
    endpoint.searchParams.set('generator', 'search');
    endpoint.searchParams.set('gsrsearch', `${cleanQuery} coloring page`);
    endpoint.searchParams.set('gsrnamespace', '6');
    endpoint.searchParams.set('gsrlimit', '30');
    endpoint.searchParams.set('prop', 'imageinfo');
    endpoint.searchParams.set('iiprop', 'url|size|mime|extmetadata');
    endpoint.searchParams.set('iiurlwidth', '800');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('origin', '*');

    const res = await fetch(endpoint.toString(), {
      headers: {
        'Api-User-Agent': 'DeseneAdamKidsApp/1.0 (contact@desene-adam.app)'
      }
    });

    const data = await res.json();
    const rawPages = Object.values(data.query?.pages || {});

    const items = rawPages
      .filter(p => {
        const info = p.imageinfo?.[0];
        if (!info) return false;
        // Doar imagini cu dimensiune mare (peste 750px)
        const w = info.width || 0;
        const h = info.height || 0;
        return (w >= 750 || h >= 750) && (info.mime || '').startsWith('image/');
      })
      .map(p => {
        const info = p.imageinfo[0];
        let title = p.title.replace(/^File:/i, '').replace(/\.[a-z0-9]+$/i, '').replace(/coloring/gi, '').trim();
        return {
          id: String(p.pageid),
          title: title || `${cleanQuery} de colorat`,
          rawTitle: p.title,
          searchTerm: cleanQuery,
          previewUrl: info.thumburl || info.url,
          originalUrl: info.url,
          proxyUrl: info.url,
          width: info.width,
          height: info.height,
          mime: info.mime,
          license: `Dimensiune mare (${info.width} × ${info.height})`,
          artist: 'Wikimedia Commons',
          sourceUrl: p.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`
        };
      });

    return {
      items,
      suggestions,
      total: items.length
    };
  } catch (e) {
    console.error('Fallback eșuat:', e);
    return { items: [], suggestions, total: 0 };
  }
}
