import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Plugin middleware pentru căutare web stil Google Images la dimensiune mare ("Mari" + "Desen cu linii")
// NOTĂ: Rulează DOAR în dev-server local. Pe producție (GitHub Pages) se folosește fallback Wikimedia.
function coloringSearchPlugin() {
  return {
    name: 'coloring-search-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const parsedUrl = new URL(req.url, 'http://localhost');

        // Endpoint: /api/search-images?q=...
        if (parsedUrl.pathname === '/api/search-images') {
          const rawQ = parsedUrl.searchParams.get('q') || 'spongebob';
          try {
            let q = rawQ.trim();
            // Asigurăm căutarea exactă a planșelor de colorat / line art
            if (!/coloring|colouring|de colorat|planse|line art/i.test(q)) {
              q += ' coloring pages';
            } else if (/de colorat/i.test(q)) {
              q = q.replace(/de colorat/i, '').trim() + ' coloring pages';
            }

            // Filtrare presetată identică cu Google Images:
            // filterui:imagesize-large -> Dimensiune "Mari"
            // filterui:photo-linedrawing -> Tip "Desen cu linii" (doar desene de colorat alb-negru)
            const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&qft=+filterui:imagesize-large+filterui:photo-linedrawing&form=IRFLTR&first=1`;
            
            const searchRes = await fetch(searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7'
              }
            });

            if (!searchRes.ok) {
              throw new Error(`Eroare motor căutare: HTTP ${searchRes.status}`);
            }

            const html = await searchRes.text();
            const matches = [...html.matchAll(/m="?({.*?&quot;murl&quot;.*?})"?/g)];

            const items = [];
            const seenUrls = new Set();

            for (let i = 0; i < matches.length; i++) {
              try {
                const rawJson = matches[i][1].replace(/&quot;/g, '"');
                const parsed = JSON.parse(rawJson);
                const originalUrl = parsed.murl;

                if (!originalUrl || seenUrls.has(originalUrl)) continue;
                seenUrls.add(originalUrl);

                // Curățare URL thumbnail
                const thumbUrl = (parsed.turl || originalUrl).replace(/&amp;/g, '&');

                // Nume domeniu sursă
                let sourceDomain = 'Coloring Web';
                try {
                  sourceDomain = new URL(parsed.purl || originalUrl).hostname.replace(/^www\./, '');
                } catch (e) {}

                // Titlu prietenos și curat
                let cleanT = (parsed.t || parsed.desc || rawQ)
                  .replace(/coloring\s*(pages?|books?)?/gi, '')
                  .replace(/printable/gi, '')
                  .replace(/free/gi, '')
                  .replace(/download/gi, '')
                  .replace(/desene\s*(de\s*colorat)?/gi, '')
                  .replace(/planse\s*(de\s*colorat)?/gi, '')
                  .replace(/[\-_|]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();

                if (!cleanT || cleanT.length < 3) {
                  cleanT = `${rawQ.charAt(0).toUpperCase() + rawQ.slice(1)} de colorat`;
                }

                items.push({
                  id: `img_${Date.now()}_${i}`,
                  title: cleanT,
                  rawTitle: parsed.t || rawQ,
                  searchTerm: rawQ,
                  previewUrl: thumbUrl,
                  originalUrl: originalUrl,
                  proxyUrl: `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`,
                  width: 1200, // Dimensiune mare garantată de filtrul imagesize-large
                  height: 1600,
                  mime: 'image/jpeg',
                  license: 'Dimensiune: Mari (Rezoluție înaltă)',
                  artist: sourceDomain,
                  sourceUrl: parsed.purl || originalUrl
                });

                if (items.length >= 40) break;
              } catch (parseErr) {
                // ignoră elemente neparsabile
              }
            }

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ items, total: items.length }));
            return;
          } catch (err) {
            console.error('Eroare căutare imagini:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message, items: [] }));
            return;
          }
        }

        // Endpoint: /api/proxy-image?url=...
        if (parsedUrl.pathname === '/api/proxy-image') {
          const targetUrl = parsedUrl.searchParams.get('url');
          if (!targetUrl) {
            res.writeHead(400);
            res.end('Missing url');
            return;
          }
          try {
            const imgRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': targetUrl
              }
            });

            if (!imgRes.ok) {
              res.writeHead(imgRes.status);
              res.end('Image fetch error');
              return;
            }

            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            const buffer = Buffer.from(await imgRes.arrayBuffer());

            res.writeHead(200, {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=86400'
            });
            res.end(buffer);
            return;
          } catch (e) {
            res.writeHead(502);
            res.end('Proxy image error');
            return;
          }
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
// base: '/desene-adam/' este obligatoriu pentru GitHub Pages (sub-path deployment)
export default defineConfig({
  base: '/desene-adam/',
  plugins: [
    react(),
    coloringSearchPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Desene Adam – Planșe de colorat pentru copii',
        short_name: 'Desene Adam',
        description: 'Aplicație pentru copii pentru căutarea și salvarea desenelor alb-negru de colorat la rezoluție mare',
        theme_color: '#38bdf8',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/desene-adam/',
        scope: '/desene-adam/',
        icons: [
          {
            src: '/desene-adam/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/desene-adam/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/desene-adam/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/api/, /^https:\/\/www\.googleapis\.com/, /^https:\/\/accounts\.google\.com/]
      }
    })
  ]
});
