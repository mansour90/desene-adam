# Cloudflare Bing Worker

Worker-ul furnizează `GET /api/search-images` și `GET /api/proxy-image` pentru aplicația găzduită pe GitHub Pages. CORS permite site-ul public și localhost-ul de dezvoltare; URL-urile pentru proxy de imagine sunt semnate HMAC și expiră după 24 de ore.

## Deploy inițial

Din rădăcina repository-ului:

```powershell
npx wrangler login
npx wrangler secret put IMAGE_PROXY_SECRET --config cloudflare/wrangler.toml
npx wrangler deploy --config cloudflare/wrangler.toml
```

La promptul secretului, generează o valoare aleatoare lungă și păstreaz-o doar în Cloudflare. Nu o adăuga în `.env`, Git sau GitHub Actions; doar Worker-ul are nevoie de ea.

Wrangler afișează un URL de forma:

```text
https://desene-adam-bing-search.<subdomain>.workers.dev
```

## Conectează GitHub Pages

În repository-ul `mansour90/desene-adam`, deschide **Settings → Secrets and variables → Actions → New repository secret** și adaugă:

- Name: `VITE_IMAGE_SEARCH_API_URL`
- Value: URL-ul `workers.dev` afișat de Wrangler, fără slash la final

După salvare, retrigger-ează workflow-ul `Deploy Desene Adam → GitHub Pages` din Actions sau fă push la o schimbare. Valoarea este injectată numai în buildul frontendului; secretul HMAC rămâne exclusiv în Cloudflare.

## Origini permise

`cloudflare/wrangler.toml` permite implicit:

- `https://mansour90.github.io`
- `http://localhost:5173` și `http://127.0.0.1:5173`
- `http://localhost:5174` și `http://127.0.0.1:5174`

Dacă se schimbă domeniul public sau portul de dezvoltare, actualizează `ALLOWED_ORIGINS` și rulează din nou deploy-ul.

Endpoint-ul `/health` verifică dacă Worker-ul este online:

```text
https://desene-adam-bing-search.<subdomain>.workers.dev/health
```