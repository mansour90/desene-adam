# Desene Adam 🎨 – Aplicație PWA pentru Copii

Aplicație web progresivă (PWA) modernă, intuitivă și veselă, special concepută pentru copii de aproximativ 7 ani, pentru căutarea, previzualizarea, descărcarea și salvarea în Google Drive a desenelor și planșelor de colorat alb-negru.

---

## 🚀 Caracteristici Implementate

1. **Design prietenos pentru copii (Mobile-First):**
   - Culori pastelate vesele: albastru ceresc, turcoaz mint, galben solar și violet pastel.
   - Butoane mari, colțuri rotunjite, pictograme mari și font rotunjit (`Fredoka` & `Nunito`).
   - Fără reclame, fără linkuri externe către internet accesibile copilului.

2. **Căutare Bing Images:**
   - Bing Images este apelat printr-un Cloudflare Worker, astfel încât căutarea funcționează și pe GitHub Pages fără apeluri browser blocate de CORS.
   - Moduri separate pentru planșe alb-negru și imagini colorate, cu filtrul Bing de dimensiune mare.
   - Dacă Bing nu găsește rezultate, aplicația încearcă Wikimedia Commons, inclusiv pentru termeni românești precum „dinozauri”.
   - Worker-ul proxy-uiește imaginile originale cu URL-uri semnate temporar pentru conversia și trimiterea în Drive.

3. **Căutare Vocală în Limba Română (`ro-RO`):**
   - Folosește **Web Speech API**.
   - Buton mare cu microfon animat (efect pulsatoriu când ascultă).
   - Recunoaște comanda vocală, populează automat câmpul de căutare și lansează căutarea instantaneu.

4. **8 Categorii Rapide cu Ilustrații:**
   - 🦖 Dinozauri
   - 🚗 Mașini
   - 🦁 Animale
   - 👑 Prințese
   - 🤖 Roboți
   - ✈️ Avioane
   - 🦸 Supereroi
   - 🚀 Spațiu

5. **Descărcare & Conversie JPG:**
   - Conversie în format **JPG** de înaltă calitate cu fundal alb pur `#ffffff` (prin HTML5 Canvas), optimizat pentru imprimantă.
   - Generare nume clare de fișiere: `dinozaur_01.jpg`, `dinozaur_02.jpg`, `masini_01.jpg`.
   - Prevenire duplicate în cadrul aceleiași sesiuni.

6. **Integrare Google Drive (Backup Cloud):**
   - Structură organizată automată:
     ```
     Google Drive/
       Desene Adam/
         2026-10-31_10-30/
           dinozaur_01.jpg
           dinozaur_02.jpg
     ```
   - Creare automată a folderului rădăcină și a subfolderului de sesiune cu data și ora.
   - Încărcare multipart JPEG cu afișare procentuală a progresului (0 - 100%).

7. **Mod Părinte discret (Protejat cu PIN):**
   - Accesibil discret din colțul ecranului.
   - Protecție cu PIN numeric (PIN prestabilit: `290590`).
   - Conectare / deconectare cont Google prin Google Identity Services.
   - Buton de testare a conexiunii Google Drive.
   - Posibilitate de schimbare a PIN-ului și de resetare a sesiunii curente.
   - Vizualizare istoric salvări recente cu link direct către Google Drive.

8. **PWA (Progressive Web App):**
   - `vite-plugin-pwa` configurat cu Service Worker (`registerType: 'autoUpdate'`).
   - Manifest web, iconițe 192x192 și 512x512.
   - Afișare `standalone`, instalabilă direct pe Android (din Chrome) sau pe PC/tabletă.
   - Nu cache-uiește cererile private sau tokenurile Google Drive.

---

## 🛠️ Comenzi de Rulare

Proiectul este amplasat în:
`C:\Users\Alaa\.gemini\antigravity\scratch\desene-adam`

### 1. Pornire server de dezvoltare local:
```bash
npm run dev
```
Aplicația va fi accesibilă la adresa: `http://localhost:5173/` (sau `http://127.0.0.1:5173/`)

### 2. Creare build de producție:
```bash
npm run build
```

### 3. Previzualizare build de producție:
```bash
npm run preview
```

---

## 🔑 Configurare Google Drive (Opțional)

Aplicația este 100% funcțională din prima secundă chiar și fără Google Drive conectat: la apăsarea butonului „SALVEAZĂ DESENUL”, desenele sunt descărcate direct în memoria dispozitivului ca JPG de înaltă rezoluție.

Pentru a activa sincronizarea automată în Google Drive:
1. Accesează **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Creează un proiect nou sau folosește unul existent.
3. Activează **Google Drive API** din *APIs & Services > Enable APIs and Services*.
4. Configurează ecranul de consimțământ OAuth (*OAuth consent screen*): tip *External*, adăugând domeniul de test `https://www.googleapis.com/auth/drive.file`.
5. Creează credențiale (*Credentials > Create Credentials > OAuth client ID*):
   - Tip: **Web application**
   - Origini JavaScript autorizate: `http://localhost:5173` și `http://127.0.0.1:5173`
6. Copiază **Client ID**-ul generat (format `xxx.apps.googleusercontent.com`).
7. Deschide în aplicație **Mod Părinte** (PIN: `290590`), lipește Client ID-ul în câmpul dedicat și apasă **Salvează**, apoi apasă **Conectează contul Google**.
*(Alternativ, poți introduce `VITE_GOOGLE_CLIENT_ID=xxx` în fișierul `.env`).*

## ☁️ Configurare căutare Bing pe GitHub Pages

GitHub Pages servește fișiere statice și nu poate rula middleware-ul Vite. Căutarea Bing publică folosește un Cloudflare Worker separat:

1. Instalează Node.js și rulează `npx wrangler login` din folderul proiectului.
2. Creează un secret pentru semnarea URL-urilor proxy: `npx wrangler secret put IMAGE_PROXY_SECRET --config cloudflare/wrangler.toml`. Introdu o valoare aleatoare lungă când Wrangler o cere; nu o salva în Git și nu o trimite în chat.
3. Publică Worker-ul: `npx wrangler deploy --config cloudflare/wrangler.toml`.
4. Copiază URL-ul Worker afișat la deploy.
5. Workflow-ul GitHub Pages folosește URL-ul Worker configurat în `.github/workflows/deploy.yml`; nu este necesar un secret separat pentru acest URL public.
6. La următorul push pe `main`, workflow-ul reconstruiește și publică aplicația.

Originea publică `https://mansour90.github.io` și originile locale de dezvoltare sunt deja permise în `cloudflare/wrangler.toml`. Dacă domeniul site-ului se schimbă, actualizează `ALLOWED_ORIGINS` și redeployează Worker-ul. Configurația completă se află în [cloudflare/README.md](cloudflare/README.md).
