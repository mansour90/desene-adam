const DEFAULT_ALLOWED_ORIGINS = [
  'https://mansour90.github.io',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

function allowedOrigins(env) {
  const configured = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS;
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  });

  if (allowedOrigins(env).includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

function jsonResponse(request, env, data, status = 200) {
  const headers = corsHeaders(request, env);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { status, headers });
}

function normalizeSearchQuery(rawQuery, mode) {
  let query = rawQuery.trim();
  if (mode === 'color') {
    query = query
      .replace(/\b(coloring|colouring)\s*(pages?|sheets?)?\b/gi, '')
      .replace(/\b(de colorat|planse)\b/gi, '')
      .trim();
    return `${query} colored illustration`;
  }

  if (!/coloring|colouring|de colorat|planse|line art/i.test(query)) {
    query += ' coloring pages';
  } else if (/de colorat/i.test(query)) {
    query = `${query.replace(/de colorat/i, '').trim()} coloring pages`;
  }
  return query;
}

function decodeBingImageResult(match) {
  try {
    const rawJson = match.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
}

function bytesToBase64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function signImageUrl(url, expiresAt, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${expiresAt}:${url}`));
  return bytesToBase64Url(signature);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function searchImages(request, env) {
  const requestUrl = new URL(request.url);
  const rawQuery = (requestUrl.searchParams.get('q') || '').trim();
  const mode = requestUrl.searchParams.get('mode') === 'color' ? 'color' : 'lineart';
  const offset = Math.max(0, Math.min(100, Number(requestUrl.searchParams.get('offset')) || 0));

  if (!rawQuery || rawQuery.length > 200) {
    return jsonResponse(request, env, { error: 'Interogarea trebuie să aibă între 1 și 200 de caractere.', items: [] }, 400);
  }
  if (!env.IMAGE_PROXY_SECRET) {
    return jsonResponse(request, env, { error: 'Worker-ul nu are configurat IMAGE_PROXY_SECRET.' }, 503);
  }

  const query = normalizeSearchQuery(rawQuery, mode);
  const imageTypeFilter = mode === 'color' ? 'filterui:color2-color' : 'filterui:photo-linedrawing';
  const searchBing = async (filter) => {
    const bingUrl = new URL('https://www.bing.com/images/search');
    bingUrl.searchParams.set('q', query);
    if (filter) bingUrl.searchParams.set('qft', filter);
    bingUrl.searchParams.set('form', 'IRFLTR');
    bingUrl.searchParams.set('first', String(offset + 1));

    const response = await fetch(bingUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    if (!response.ok) {
      return { error: response.status, matches: [] };
    }

    const html = await response.text();
    return {
      error: null,
      matches: [...html.matchAll(/m="?({.*?&quot;murl&quot;.*?})"?/g)]
    };
  };

  const mapMatchesToItems = async (matches) => {
    const seenUrls = new Set();
    const items = [];

    for (const [index, match] of matches.entries()) {
      const parsed = decodeBingImageResult(match[1]);
      if (!parsed?.murl || seenUrls.has(parsed.murl)) continue;

      let originalUrl;
      try {
        originalUrl = new URL(parsed.murl);
        if (!['http:', 'https:'].includes(originalUrl.protocol)) continue;
      } catch {
        continue;
      }
      seenUrls.add(originalUrl.href);

      const previewUrl = parsed.turl || originalUrl.href;
      const sourceUrl = parsed.purl || originalUrl.href;
      let sourceDomain = 'Bing Images';
      try {
        sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, '');
      } catch {
        // Păstrăm domeniul implicit dacă Bing returnează un URL sursă invalid.
      }

      let title = String(parsed.t || parsed.desc || rawQuery)
        .replace(/coloring\s*(pages?|books?)?/gi, '')
        .replace(/printable|free|download/gi, '')
        .replace(/desene\s*(de\s*colorat)?|planse\s*(de\s*colorat)?/gi, '')
        .replace(/[-_|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (title.length < 3) title = `${rawQuery} de colorat`;

      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      const signature = await signImageUrl(originalUrl.href, expiresAt, env.IMAGE_PROXY_SECRET);
      const proxyUrl = new URL('/api/proxy-image', requestUrl.origin);
      proxyUrl.searchParams.set('url', originalUrl.href);
      proxyUrl.searchParams.set('exp', String(expiresAt));
      proxyUrl.searchParams.set('sig', signature);

      items.push({
        id: `bing_${crypto.randomUUID?.() || `${Date.now()}_${index}`}`,
        title,
        rawTitle: parsed.t || rawQuery,
        searchTerm: rawQuery,
        previewUrl,
        originalUrl: originalUrl.href,
        proxyUrl: proxyUrl.href,
        width: Number(parsed.w) || 1200,
        height: Number(parsed.h) || 1600,
        mime: 'image/jpeg',
        license: 'Rezultat Bing Images; verifică drepturile la sursă înainte de utilizare.',
        artist: sourceDomain,
        sourceUrl
      });

      if (items.length >= 40) break;
    }

    return items;
  };

  let { error: bingError, matches } = await searchBing(`+filterui:imagesize-large+${imageTypeFilter}`);
  if (bingError) {
    return jsonResponse(request, env, { error: `Bing a răspuns cu HTTP ${bingError}.`, items: [] }, 502);
  }

  const items = await mapMatchesToItems(matches);

  return jsonResponse(request, env, { items, total: items.length });
}

function isPublicImageUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(url.protocol)) return false;
  if (url.username || url.password) return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return false;
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[')) return false;
  return true;
}

async function proxyImage(request, env) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get('url');
  const expiresAt = Number(requestUrl.searchParams.get('exp'));
  const signature = requestUrl.searchParams.get('sig') || '';
  if (!target || target.length > 4096 || !isPublicImageUrl(target) || !env.IMAGE_PROXY_SECRET) {
    return jsonResponse(request, env, { error: 'Adresa imaginii nu este validă.' }, 400);
  }
  if (!Number.isInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || expiresAt > Math.floor(Date.now() / 1000) + 86400) {
    return jsonResponse(request, env, { error: 'Adresa imaginii a expirat.' }, 403);
  }
  const expectedSignature = await signImageUrl(target, expiresAt, env.IMAGE_PROXY_SECRET);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return jsonResponse(request, env, { error: 'Semnătura adresei imaginii nu este validă.' }, 403);
  }

  let currentUrl = target;
  let imageResponse;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    imageResponse = await fetch(currentUrl, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DeseneAdam/1.0)' }
    });

    if (![301, 302, 303, 307, 308].includes(imageResponse.status)) break;
    const location = imageResponse.headers.get('Location');
    if (!location || redirectCount === 3) {
      return jsonResponse(request, env, { error: 'Prea multe redirecționări pentru imagine.' }, 502);
    }

    currentUrl = new URL(location, currentUrl).href;
    if (!isPublicImageUrl(currentUrl)) {
      return jsonResponse(request, env, { error: 'Redirecționare către o adresă blocată.' }, 400);
    }
  }

  if (!imageResponse?.ok) {
    return jsonResponse(request, env, { error: `Sursa imaginii a răspuns cu HTTP ${imageResponse?.status || 502}.` }, 502);
  }

  const contentType = imageResponse.headers.get('Content-Type') || '';
  const contentLength = Number(imageResponse.headers.get('Content-Length') || 0);
  if (!contentType.toLowerCase().startsWith('image/')) {
    return jsonResponse(request, env, { error: 'Sursa nu a returnat un fișier imagine.' }, 415);
  }
  if (contentLength > 15 * 1024 * 1024) {
    return jsonResponse(request, env, { error: 'Imaginea depășește limita de 15 MB.' }, 413);
  }

  const headers = corsHeaders(request, env);
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=86400');
  if (contentLength) headers.set('Content-Length', String(contentLength));
  return new Response(imageResponse.body, { status: 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      if (!cors.has('Access-Control-Allow-Origin')) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'GET') {
      return jsonResponse(request, env, { error: 'Metoda nu este permisă.' }, 405);
    }

    if (request.headers.has('Origin') && !cors.has('Access-Control-Allow-Origin')) {
      return jsonResponse(request, env, { error: 'Origine neautorizată.' }, 403);
    }

    try {
      if (url.pathname === '/api/search-images') return await searchImages(request, env);
      if (url.pathname === '/api/proxy-image') return await proxyImage(request, env);
      if (url.pathname === '/health') return jsonResponse(request, env, { ok: true, service: 'desene-adam-bing-search' });
      return jsonResponse(request, env, { error: 'Endpoint inexistent.' }, 404);
    } catch (error) {
      console.error('Cloudflare Worker error:', error);
      return jsonResponse(request, env, { error: 'Căutarea Bing nu este disponibilă momentan.' }, 502);
    }
  }
};