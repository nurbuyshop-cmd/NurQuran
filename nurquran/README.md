# nurquran — visitors' website (nurquran.toptol.site)

Next.js, exported as a static site. Pages: Home, Read Quran (`/quran`, opens at `/quran/?s=2&a=255` or `?page=50`), Prayer Times, Qibla, Tasbeeh,
Search (`/search`), Notifications (`/notifications`), Advanced Settings (`/settings`).
The full Quran (all 604 pages, 114 surahs, 6236 ayahs) ships with the site as small static files in `public/quran/`
and is loaded page by page while reading. Translations and audio added in the admin panel still come from the API (`NEXT_PUBLIC_API_URL`).

Quran text and fonts:
- Text source: Quran.com API v4 (Quran Foundation) — Uthmani, KFGQPC Hafs and IndoPak Nastaleeq text, QCF V1/V2 word codes. Nothing is typed by hand.
- `npm run quran` — downloads the text again and rebuilds `public/quran/` (checks: 604 pages, 6236 ayahs, every line filled).
- `npm run quran-fonts` — downloads the Quran fonts into `public/fonts/quran/` (already included).
- Fonts in Settings: **Indopak** (IndoPak Nastaleeq), **Mushaf Tajweed** (QCF V4 colour page fonts), **Mushaf** (QCF V1 page fonts, 1405H Madani),
  **Uthmanic** (KFGQPC Uthmanic Hafs). Mushaf fonts are one small file per page and load only for the page being read.
- Colour tajweed needs a browser with COLRv1 colour fonts (Chrome, Edge, Firefox, Android). Safari / iPhone show the Uthmanic font instead.
- Screen Timeout (keep screen on) works only on https.

Recitation (ayah by ayah): `lib/quran/reciters.js` lists 14 reciters (Sudais, Shuraim, Maher Al-Muaiqly, Yasser Ad-Dosari,
Al-Budair, Al-Hudhaify, Alafasy, Al-Ghamdi, Ash-Shatri, Al-Ajamy, Al-Qatami, Abdul Basit, Al-Husary, Al-Minshawi). Audio streams from
EveryAyah.com, one file per ayah: tap an ayah → play starts from that ayah (or the ⏮ button plays the surah from the start), then
continues ayah after ayah through the whole Quran; the ayah being recited turns red and the screen follows it.
The reciter is chosen on the home page (Quran settings) or in the reader's Settings / player gear button.

- `npm install`
- `npm run dev` — local development (http://localhost:3000)
- `npm run build` — creates `out/`; upload the contents of `out/` to the nurquran.toptol.site folder
- `npm run preview` — single-file preview in `preview/dist/`
- `npm run cities` — regenerates `public/data` (world cities with timezones)

Fonts: put `AlMajeedQuranic.ttf` (or `.woff2`) in `public/fonts/`. Adhan recordings: see `public/sounds/README.txt`.

Search: Exact / Affixes / All Roots over the Arabic text, or any translation in `public/quran/tr/`
(Saheeh International, Pickthall, Taisirul Quran, Dr. Abu Bakr Zakaria, Indonesian Ministry, Junagarhi — Quran.com API).
Roots come from the Quranic Arabic Corpus morphology (GPL) in `public/quran/roots.json`. "Ask AI" ranks ayahs by the key
words of a question (Arabic, English, Bengali); it runs in the browser and needs no AI service.
Notifications are written in the admin panel (Notifications page).
