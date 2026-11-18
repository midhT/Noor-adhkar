# Naseem Quran Foundation content service

This Worker is the secure server-side bridge for the Indo-Pak Mushaf editions. The Android/WebView app must never contain a Quran Foundation `client_secret`.

## Why this service exists

Quran Foundation Content APIs require OAuth2 Client Credentials and server-only credentials. The app requests only the data it needs from this Worker; the Worker obtains and caches the API token and sends the required `x-auth-token` and `x-client-id` headers.

## Editions supported by the reader

| Edition | Quran Foundation Mushaf ID | Pages | Reader |
|---|---:|---:|---|
| Indo-Pak | 3 | 604 | Full page |
| Indo-Pak 15-line | 6 | 610 | Exact printed line breaks |
| Indo-Pak 16-line | 7 | 548 | Full page |

Madani remains available through the existing AlQuran Cloud 604-page reader. Makki is not a separate standard page-layout ID in the Quran Foundation Mushaf catalogue; it is generally a surah-revelation classification. Do not label a layout “Makki” without a named, verifiable printed edition.

## Deploy

1. Create a **Backend/server** app in the Quran Foundation Developer Console and request the Content API permissions needed for Quran text, translations and metadata. A frontend/mobile client cannot safely hold the Content API client secret.
2. Install Wrangler locally or use `npx wrangler`.
3. From this directory, run `npx wrangler deploy`.
4. Add secrets to the Worker:
   - `QF_CLIENT_ID`
   - `QF_CLIENT_SECRET`
5. Set `QF_ENV` to `production` only after production access is approved. Pre-live is suitable for development but contains only Al-Fatihah and Al-Baqarah.
6. Set `QF_SCOPE` to the scopes approved for the created app. New Backend/server apps use granular scopes; older credentials may use `content`.
7. Set `ALLOWED_ORIGINS` to the exact web origin(s) used by Naseem. The template allows `https://localhost,capacitor://localhost`; add your hosted origin if applicable.
8. Verify `https://YOUR-WORKER.workers.dev/health` reports `configured: true`.

Example secret commands:

```bash
npx wrangler secret put QF_CLIENT_ID
npx wrangler secret put QF_CLIENT_SECRET
```

Set production environment only after approval:

```bash
npx wrangler secret put QF_CLIENT_ID
npx wrangler secret put QF_CLIENT_SECRET
npx wrangler deploy
```

Update `www/quran-config.js` with the deployed Worker base URL:

```js
window.NASEEM_QF_PROXY_URL = 'https://YOUR-WORKER.workers.dev';
```

Do not place the client secret or access token in that file.

## Endpoints

- `GET /health`
- `GET /api/mushaf/editions`
- `GET /api/mushaf/chapters`
- `GET /api/mushaf/page/:page?mushaf=3|6|7&translation=131`
- `GET /api/mushaf/lookup?mushaf=3|6|7&from=2:255&to=2:255`

The page endpoint requests verse text, word-level Indo-Pak Nastaleeq text, line/page positions, and Dr. Mustafa Khattab’s The Clear Quran translation (resource 131). The frontend uses the line positions only for the 15-line edition; the other Indo-Pak editions render as page-bounded readers.

## Content and font handling

Indo-Pak text and its matching font are fetched at runtime. They are not copied into the app archive. The compatible Quran Foundation IndoPak Nastaleeq font is required for waqf signs and verse-end marks to render correctly. The app loads that font from the Quran Foundation CDN when the user opens an Indo-Pak edition.

The Worker keeps credentials server-side. It does not expose tokens to the app. Content responses are not written to a persistent local database by this integration.
