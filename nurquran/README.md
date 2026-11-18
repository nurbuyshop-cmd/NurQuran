# nurquran — visitors' website (nurquran.toptol.site)

Next.js, exported as a static site. Pages: Home, Read Quran (`/quran`), Prayer Times, Qibla, Tasbeeh.
Quran text is loaded from the API (`NEXT_PUBLIC_API_URL`, default https://apiquran.toptol.site); Surah Al-Fatiha is bundled as a fallback.

- `npm install`
- `npm run dev` — local development (http://localhost:3000)
- `npm run build` — creates `out/`; upload the contents of `out/` to the nurquran.toptol.site folder
- `npm run preview` — single-file preview in `preview/dist/`
- `npm run cities` — regenerates `public/data` (world cities with timezones)

Fonts: put `AlMajeedQuranic.ttf` (or `.woff2`) in `public/fonts/`. Adhan recordings: see `public/sounds/README.txt`.
