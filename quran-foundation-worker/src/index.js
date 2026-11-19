/**
 * Naseem Quran Foundation Content API proxy.
 * Deploy as a Cloudflare Worker. Keep QF_CLIENT_SECRET exclusively in Worker secrets.
 */
let cachedToken = null;
let tokenExpiresAt = 0;
let tokenPromise = null;

const ENVIRONMENTS = {
  prelive: {
    auth: 'https://prelive-oauth2.quran.foundation',
    api: 'https://apis-prelive.quran.foundation',
  },
  production: {
    auth: 'https://oauth2.quran.foundation',
    api: 'https://apis.quran.foundation',
  },
};

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '*').split(',').map(x => x.trim()).filter(Boolean);
  const allowOrigin = allowed.includes('*') ? '*' : (allowed.includes(origin) ? origin : allowed[0] || 'null');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, status, origin, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin, env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? 'public, max-age=900' : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function getToken(env) {
  if (cachedToken && Date.now() < tokenExpiresAt - 45000) return cachedToken;
  if (tokenPromise) return tokenPromise;
  tokenPromise = (async () => {
    if (!env.QF_CLIENT_ID || !env.QF_CLIENT_SECRET) {
      throw new Error('Quran Foundation credentials are not configured on the Worker.');
    }
    const environment = ENVIRONMENTS[env.QF_ENV || 'prelive'];
    if (!environment) throw new Error('QF_ENV must be prelive or production.');
    const basic = btoa(`${env.QF_CLIENT_ID}:${env.QF_CLIENT_SECRET}`);
    const response = await fetch(`${environment.auth}/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Naseem-Quran-Worker/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: env.QF_SCOPE || 'content.quran.read content.translations.read',
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.message || `Quran Foundation token request failed (${response.status}).`);
    }
    cachedToken = payload.access_token;
    tokenExpiresAt = Date.now() + Math.max(60, Number(payload.expires_in) || 3600) * 1000;
    return cachedToken;
  })().finally(() => { tokenPromise = null; });
  return tokenPromise;
}

async function qfFetch(env, path) {
  const environment = ENVIRONMENTS[env.QF_ENV || 'prelive'];
  if (!environment) throw new Error('QF_ENV must be prelive or production.');
  const token = await getToken(env);
  const url = `${environment.api}/content/api/v4/${path}`;
  const makeRequest = async accessToken => fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-auth-token': accessToken,
      'x-client-id': env.QF_CLIENT_ID,
      'User-Agent': 'Naseem-Quran-Worker/1.0',
    },
  });
  let response = await makeRequest(token);
  if (response.status === 401) {
    cachedToken = null;
    tokenExpiresAt = 0;
    response = await makeRequest(await getToken(env));
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body.message || body.error || `Quran Foundation API returned ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }
    if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405, origin, env);

    const url = new URL(request.url);
    if (url.pathname === '/health') {
      const configured = Boolean(env.QF_CLIENT_ID && env.QF_CLIENT_SECRET);
      return json({ ok: true, provider: 'Quran Foundation', configured, environment: env.QF_ENV || 'prelive' }, 200, origin, env);
    }

    try {
      let data;
      if (url.pathname === '/api/mushaf/chapters') {
        data = await qfFetch(env, 'chapters?language=en');
      } else if (url.pathname === '/api/mushaf/editions') {
        data = {
          editions: [
            { id: 3, key: 'indopak', label: 'Indo-Pak', pages: 604, layout: 'page' },
            { id: 6, key: 'indopak15', label: 'Indo-Pak 15-line', pages: 610, layout: 'printed-lines' },
            { id: 7, key: 'indopak16', label: 'Indo-Pak 16-line', pages: 548, layout: 'page' },
          ],
        };
      } else if (url.pathname === '/api/mushaf/lookup') {
        const mushaf = Number(url.searchParams.get('mushaf'));
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to') || from;
        if (![3, 6, 7].includes(mushaf) || !from || !/^\d{1,3}:\d{1,3}$/.test(from) || !/^\d{1,3}:\d{1,3}$/.test(to || '')) {
          return json({ message: 'Valid mushaf, from and to verse keys are required.' }, 400, origin, env);
        }
        const query = new URLSearchParams({ mushaf: String(mushaf), from, to });
        data = await qfFetch(env, `pages/lookup?${query}`);
      } else {
        const match = url.pathname.match(/^\/api\/mushaf\/page\/(\d+)$/);
        if (!match) return json({ message: 'Not found.' }, 404, origin, env);
        const page = Number(match[1]);
        const mushaf = Number(url.searchParams.get('mushaf'));
        const pages = { 3: 604, 6: 610, 7: 548 };
        if (!pages[mushaf] || page < 1 || page > pages[mushaf]) {
          return json({ message: 'Page or Mushaf edition is out of range.' }, 400, origin, env);
        }
        const query = new URLSearchParams({
          mushaf: String(mushaf),
          words: 'true',
          word_fields: 'text_indopak_nastaleeq',
          fields: 'text_indopak_nastaleeq',
          translations: url.searchParams.get('translation') || '131',
          per_page: '50',
        });
        data = await qfFetch(env, `verses/by_page/${page}?${query}`);
      }
      return json(data, 200, origin, env);
    } catch (error) {
      const status = Number(error.status) || 502;
      return json({ message: error.message || 'Quran service unavailable.' }, status, origin, env);
    }
  },
};
