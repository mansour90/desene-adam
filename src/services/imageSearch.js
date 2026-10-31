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

  const response = await fetch(endpoint.toString());
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Căutarea Bing a eșuat (HTTP ${response.status}).`);
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    suggestions,
    total: Number(data.total) || 0
  };
}
