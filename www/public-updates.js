/* Public Naseem release checker. Cache-busted feed + GitHub API fallback; same-label builds use Android versionCode. */
(() => {
  'use strict';
  const CURRENT = document.querySelector('meta[name="naseem-version"]')?.content || '0.0.0';
  const CURRENT_BUILD = Number.parseInt(document.querySelector('meta[name="naseem-version-code"]')?.content || '0', 10) || 0;
  const FEED = 'https://raw.githubusercontent.com/midhT/Naseem-public/main/release.json';
  const CONTENT_API = 'https://api.github.com/repos/midhT/Naseem-public/contents/release.json?ref=main';
  const RELEASES = 'https://github.com/midhT/Naseem-public/releases/latest';
  const DEFAULT_APK = 'https://github.com/midhT/Naseem-public/releases/latest/download/app-release.apk';
  const KEY = 'naseem-public-update-state-v1';
  const $ = id => document.getElementById(id);
  const parse = value => String(value || '0').replace(/^v/i, '').split(/[.+-]/).slice(0, 3).map(x => Number.parseInt(x, 10) || 0);
  const newer = (a, b) => { const x = parse(a), y = parse(b); for (let i = 0; i < 3; i++) { if (x[i] !== y[i]) return x[i] > y[i]; } return false; };
  const buildOf = release => Number.parseInt(release?.androidVersionCode ?? release?.versionCode ?? '0', 10) || 0;
  const updateAvailable = release => newer(release?.version, CURRENT) || (String(release?.version || '') === CURRENT && buildOf(release) > CURRENT_BUILD);
  const releaseKey = release => `${release.version}+${buildOf(release)}`;
  const safeUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname === 'raw.githubusercontent.com') ? u.href : RELEASES; } catch (_) { return RELEASES; } };
  const readState = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { return {}; } };
  const writeState = state => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  function status(message, bad = false) { const el = $('naseemUpdateStatus'); if (el) { el.textContent = message; el.dataset.state = bad ? 'error' : 'normal'; } }
  async function fetchJson(url, headers = {}) {
    const controller = new AbortController(), timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json', ...headers }, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { window.clearTimeout(timer); }
  }
  async function fetchRelease() {
    let firstError;
    try { return await fetchJson(`${FEED}?_=${Date.now()}`); }
    catch (error) { firstError = error; }
    // GitHub's contents API is an independent route to the same authoritative release feed.
    try {
      const file = await fetchJson(`${CONTENT_API}&_=${Date.now()}`, { Accept: 'application/vnd.github+json' });
      if (!file?.content || file.encoding !== 'base64') throw new Error('GitHub release metadata is missing.');
      const bytes = Uint8Array.from(atob(file.content.replace(/\s/g, '')), c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) { throw new Error(`Release feed unavailable (${firstError?.message || 'primary source'}; fallback: ${error?.message || 'failed'}).`); }
  }
  function show(release, announce = false) {
    if ($('naseemUpdateBanner')) return;
    const banner = document.createElement('aside');
    banner.id = 'naseemUpdateBanner'; banner.className = 'naseem-update-banner';
    const copy = document.createElement('div'), build = buildOf(release);
    const title = document.createElement('strong'); title.textContent = `Naseem ${release.version}${build ? ` · build ${build}` : ''} is available`;
    const note = document.createElement('small'); note.textContent = String(release.notesSummary || 'A new version is ready. Review the release notes before installing.').slice(0, 220);
    copy.append(title, note);
    const download = document.createElement('button'); download.type = 'button'; download.textContent = 'Download APK';
    download.addEventListener('click', () => { window.open(safeUrl(release.downloadUrl || DEFAULT_APK), '_system'); });
    const notes = document.createElement('button'); notes.type = 'button'; notes.textContent = 'Notes';
    notes.addEventListener('click', () => { window.open(safeUrl(release.releaseUrl || RELEASES), '_system'); });
    const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.setAttribute('aria-label', 'Dismiss'); dismiss.textContent = '×';
    dismiss.addEventListener('click', () => { const state = readState(); state.dismissedBuild = releaseKey(release); state.dismissedVersion = release.version; writeState(state); banner.remove(); });
    banner.append(copy, download, notes, dismiss);
    document.querySelector('.app-shell')?.prepend(banner);
    const native = window.NoorNative?.notifications;
    if (announce && native?.permission && native?.announceUpdate) native.permission().then(p => { if (p === 'granted') native.announceUpdate(release.version, safeUrl(release.releaseUrl || RELEASES)); }).catch(() => {});
  }
  let checking = false;
  async function check(force = false) {
    const state = readState(), cachedRelease = state.release;
    if (checking) return { ok: false, busy: true };
    checking = true;
    status('Checking the latest Naseem release…');
    try {
      const release = await fetchRelease();
      if (!release || typeof release.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(release.version)) throw new Error('The public release feed is invalid.');
      if (!Number.isSafeInteger(buildOf(release)) || buildOf(release) < 1) throw new Error('The public release build number is invalid.');
      const available = updateAvailable(release);
      state.checkedAt = Date.now(); state.latest = release.version; state.latestBuild = buildOf(release); state.release = release;
      writeState(state);
      if (available) {
        const key = releaseKey(release);
        if (state.notifiedBuild !== key) { state.notifiedBuild = key; writeState(state); if (state.dismissedBuild !== key) show(release, true); }
        else if (state.dismissedBuild !== key && !$('naseemUpdateBanner')) show(release);
        status(`Naseem ${release.version} (build ${buildOf(release)}) is available. Download the APK, then confirm Android's update prompt.`);
      } else {
        status(release.version === CURRENT && buildOf(release) <= CURRENT_BUILD
          ? `Naseem is up to date (${CURRENT}, build ${CURRENT_BUILD}).`
          : `You are using ${CURRENT} · latest release is ${release.version} (build ${buildOf(release)}).`);
      }
      return { ok: true, updateAvailable: available, version: release.version, androidVersionCode: buildOf(release), release };
    } catch (error) {
      if (cachedRelease && updateAvailable(cachedRelease)) {
        if (state.dismissedBuild !== releaseKey(cachedRelease)) show(cachedRelease);
        status(`Could not refresh the release feed. Your last known update, build ${buildOf(cachedRelease)}, is still available.`, true);
        return { ok: false, updateAvailable: true, version: cachedRelease.version, androidVersionCode: buildOf(cachedRelease), error: String(error?.message || error) };
      }
      status('Could not reach the Naseem release feed. Check your connection and try again.', true);
      return { ok: false, error: String(error?.message || error) };
    } finally { checking = false; }
  }
  const manual = $('naseemCheckUpdates');
  manual?.addEventListener('click', async () => { manual.disabled = true; manual.textContent = 'Checking…'; try { await check(true); } finally { manual.disabled = false; manual.textContent = 'Check for updates'; } });
  window.NaseemUpdates = { check, isNewer: newer, isUpdateAvailable: updateAvailable, currentVersion: CURRENT, currentBuild: CURRENT_BUILD };
  window.addEventListener('online', () => check(true));
  window.setTimeout(() => check(false), 3500);
})();
