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

## Căutare imagini: Brave Search (recomandat)

Bing Search API a fost retras (aug. 2025), iar Bing blochează cererile din Cloudflare. Creează o cheie gratuită pe https://brave.com/search/api/ și adaug-o ca secret:

```powershell
npx wrangler secret put BRAVE_API_KEY --config cloudflare/wrangler.toml
npx wrangler deploy --config cloudflare/wrangler.toml
```

Cu `BRAVE_API_KEY` setat, Worker-ul folosește Brave (cu SafeSearch strict). Fără cheie revine la Bing, care nu mai funcționează din Cloudflare. `/health` arată providerul activ.

## Conectează GitHub Pages

URL-ul Worker-ului este configurat în `.github/workflows/deploy.yml` ca valoare publică de build; nu trebuie stocat ca secret GitHub. Dacă se schimbă URL-ul afișat de Wrangler, actualizează valoarea `VITE_IMAGE_SEARCH_API_URL` din workflow și publică din nou aplicația.

Secretul HMAC rămâne exclusiv în Cloudflare.

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