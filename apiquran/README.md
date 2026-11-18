# apiquran — NurQuran API

Node.js (Express) API. Data is stored as JSON files in `storage/` (no database setup needed); uploaded audio in `uploads/`.

Run locally: `npm install` then `node app.js` (port 4000). Settings: copy `.env.example` to `.env`.
First start creates the owner admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and seeds Surah Al-Fatiha.

## Endpoints
Public: `GET /v1/health`, `GET /v1/meta`, `GET /v1/quran`, `GET /v1/quran/version`, `GET /v1/quran/pages/:n`
Auth: `POST /v1/auth/login`, `GET /v1/auth/me`, `POST /v1/auth/password`
Admin (Bearer token): `GET /v1/admin/stats`, `GET|POST /v1/admin/pages`, `GET|PUT|DELETE /v1/admin/pages/:n`,
`POST /v1/admin/upload` (audio), `GET|PUT /v1/admin/settings`, `GET|POST /v1/admin/admins`, `DELETE /v1/admin/admins/:id`,
`GET /v1/admin/export`, `POST /v1/admin/import`, `GET /v1/admin/log`

Every page is validated (Arabic text, surah/ayah ranges, an ayah may appear on only one page) and the previous
content is backed up to `storage/backups/` before each change.
