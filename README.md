# Desene Adam 🎨 – Aplicație PWA pentru Copii

Aplicație web progresivă (PWA) modernă, intuitivă și veselă, special concepută pentru copii de aproximativ 7 ani, pentru căutarea, previzualizarea, descărcarea și salvarea în Google Drive a desenelor și planșelor de colorat alb-negru.

---

## 🚀 Caracteristici Implementate

1. **Design prietenos pentru copii (Mobile-First):**
   - Culori pastelate vesele: albastru ceresc, turcoaz mint, galben solar și violet pastel.
   - Butoane mari, colțuri rotunjite, pictograme mari și font rotunjit (`Fredoka` & `Nunito`).
   - Fără reclame, fără linkuri externe către internet accesibile copilului.

2. **Căutare Reală de Imagini Alb-Negru:**
   - Integrare directă cu **Wikimedia Commons API** (CORS origin=*, mii de desene libere de drepturi).
   - Filtrare strictă a fotografiilor și a conținutului nepotrivit.
   - Dicționar integrat română-engleză pentru traducerea termenilor căutați de copii.
   - Păstrarea licențelor (Public Domain, Creative Commons) și a atribuirii autorilor.

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
   - Protecție cu PIN numeric (PIN prestabilit: `1234`).
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
7. Deschide în aplicație **Mod Părinte** (PIN: `1234`), lipește Client ID-ul în câmpul dedicat și apasă **Salvează**, apoi apasă **Conectează contul Google**.
*(Alternativ, poți introduce `VITE_GOOGLE_CLIENT_ID=xxx` în fișierul `.env`).*
