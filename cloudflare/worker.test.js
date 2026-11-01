import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import worker from './worker.js';

const originalFetch = globalThis.fetch;
const origin = 'https://mansour90.github.io';
const env = {
  IMAGE_PROXY_SECRET: 'test-secret-only',
  ALLOWED_ORIGINS: origin
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('Bing search maps results and returns a signed Worker image proxy URL', async () => {
  const bingItem = {
    t: 'Colorful SpongeBob illustration',
    murl: 'https://images.example.test/drawing.png',
    turl: 'https://th.bing.com/th?id=test',
    purl: 'https://source.example.test/page',
    w: 1400,
    h: 1800
  };
  const encoded = JSON.stringify(bingItem).replaceAll('"', '&quot;');
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.match(url.href, /^https:\/\/www\.bing\.com\/images\/search\?/);
    assert.match(url.searchParams.get('qft'), /color2-color/);
    return new Response(`<a m="${encoded}"></a>`, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  };

  const response = await worker.fetch(new Request(
    'https://worker.example.test/api/search-images?q=spongebob&mode=color',
    { headers: { Origin: origin } }
  ), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].artist, 'source.example.test');
  assert.equal(body.items[0].width, 1400);
  assert.equal(new URL(body.items[0].proxyUrl).pathname, '/api/proxy-image');
  assert.ok(new URL(body.items[0].proxyUrl).searchParams.has('sig'));
});

test('Bing search parses image metadata when the HTML attribute spans multiple lines', async () => {
  const bingItem = {
    t: 'Coloring page',
    murl: 'https://images.example.test/drawing.png',
    turl: 'https://th.bing.com/th?id=test'
  };
  const encoded = JSON.stringify(bingItem)
    .replaceAll('"', '&quot;')
    .replace('&quot;murl&quot;', '\n&quot;murl&quot;');
  globalThis.fetch = async () => new Response(`<a m="${encoded}"></a>`, { status: 200 });

  const response = await worker.fetch(new Request(
    'https://worker.example.test/api/search-images?q=spongebob&mode=color',
    { headers: { Origin: origin } }
  ), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].originalUrl, bingItem.murl);
});

test('Bing line-art search never returns generic images when its strict filter has no matches', async () => {
  let requestCount = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    requestCount += 1;
    assert.match(url.searchParams.get('qft'), /photo-linedrawing/);
    return new Response('<html></html>', { status: 200 });
  };

  const response = await worker.fetch(new Request(
    'https://worker.example.test/api/search-images?q=spongebob&mode=lineart',
    { headers: { Origin: origin } }
  ), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(requestCount, 1);
  assert.equal(body.items.length, 0);
});

test('signed image proxy serves images and rejects unsigned URLs', async () => {
  const imageUrl = 'https://images.example.test/drawing.png';
  const now = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.IMAGE_PROXY_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${now + 60}:${imageUrl}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signedBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const proxyUrl = new URL('https://worker.example.test/api/proxy-image');
  proxyUrl.searchParams.set('url', imageUrl);
  proxyUrl.searchParams.set('exp', String(now + 60));
  proxyUrl.searchParams.set('sig', signature);

  globalThis.fetch = async () => new Response(new Uint8Array([137, 80, 78, 71]), {
    status: 200,
    headers: { 'Content-Type': 'image/png' }
  });

  const response = await worker.fetch(new Request(proxyUrl, { headers: { Origin: origin } }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/png');

  proxyUrl.searchParams.set('sig', 'invalid');
  const rejected = await worker.fetch(new Request(proxyUrl, { headers: { Origin: origin } }), env);
  assert.equal(rejected.status, 403);
});

test('Worker allows configured CORS origin and rejects unlisted origins', async () => {
  const allowed = await worker.fetch(new Request('https://worker.example.test/health', {
    headers: { Origin: origin }
  }), env);
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), origin);

  const rejected = await worker.fetch(new Request('https://worker.example.test/health', {
    headers: { Origin: 'https://evil.example' }
  }), env);
  assert.equal(rejected.status, 403);
});
