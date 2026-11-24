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
    const download = document.createElement('button'); download.type = 'button';
    const key = releaseKey(release), saved = readState();
    const nativeUpdater = () => window.Capacitor?.Plugins?.NaseemUpdater;
    const setInstall = () => { download.textContent = 'Install update'; download.dataset.action = 'install'; };
    if (saved.downloadedBuild === key && saved.downloadId) setInstall();
    else download.textContent = 'Download APK';
    download.addEventListener('click', async () => {
      download.disabled = true;
      try {
        const updater = nativeUpdater();
        if (!updater?.downloadApk || !updater?.installApk) {
          window.open(safeUrl(release.downloadUrl || DEFAULT_APK), '_system');
          status('The APK download page has opened. Download the file, then install it through Android.');
          return;
        }
        if (download.dataset.action === 'install') {
          const state = readState();
          const result = await updater.installApk({ downloadId: String(state.downloadId), sha256: release.sha256 || '' });
          status(result?.needsPermission ? 'Allow Naseem to install unknown apps in Android settings, return here, then tap Install update again.' : 'Android package installer opened. Confirm the update there. If it says the app was not installed, the signature or version does not match this copy.');
        } else {
          status('Downloading the official Naseem APK…');
          if (!/^[a-f0-9]{64}$/i.test(String(release.sha256 || ''))) throw new Error('The release feed has no valid APK SHA-256 checksum yet.');
          const result = await updater.downloadApk({ url: safeUrl(release.downloadUrl || DEFAULT_APK) });
          const state = readState(); state.downloadId = String(result.downloadId); state.pendingBuild = key; delete state.downloadedBuild; writeState(state);
          status('Download started. Android will notify you when the APK is ready.');
        }
      } catch (error) { status(`Update action failed: ${String(error?.message || error)}`, true); }
      finally { download.disabled = false; }
    });
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
        status(`Installed: ${CURRENT} (build ${CURRENT_BUILD}). Newer public release: ${release.version} (build ${buildOf(release)}). Download the APK, then confirm Android's update prompt. If Android says the app was not installed, this copy is signed differently from the public release; uninstall once, then install the public APK.`);
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
  const updater = window.Capacitor?.Plugins?.NaseemUpdater;
  updater?.addListener?.('downloadComplete', event => {
    const state = readState();
    if (String(event?.downloadId) !== String(state.downloadId)) return;
    if (event.success) {
      state.downloadedBuild = state.pendingBuild || state.downloadedBuild; delete state.pendingBuild; writeState(state);
      status('APK downloaded and verified by Android DownloadManager. Tap Install update, then confirm Android’s installer.');
      const button = $('naseemUpdateBanner')?.querySelector('button[data-action], button');
      if (button) { button.textContent = 'Install update'; button.dataset.action = 'install'; }
    } else { delete state.downloadId; delete state.pendingBuild; delete state.downloadedBuild; writeState(state); status(`APK download failed (Android code ${event.reason ?? 'unknown'}). Try again.`, true); }
  }).catch?.(() => {});
  if (updater?.downloadStatus) {
    const saved = readState();
    if (saved.downloadId && saved.pendingBuild) updater.downloadStatus({ downloadId: String(saved.downloadId) }).then(result => {
      const currentState = readState();
      if (currentState.pendingBuild !== saved.pendingBuild || String(currentState.downloadId) !== String(saved.downloadId)) return;
      if (result?.complete) { currentState.downloadedBuild = currentState.pendingBuild; delete currentState.pendingBuild; writeState(currentState); const button = $('naseemUpdateBanner')?.querySelector('button[data-action], button'); if (button) { button.textContent = 'Install update'; button.dataset.action = 'install'; } }
      else if (result?.failed) { delete currentState.downloadId; delete currentState.pendingBuild; writeState(currentState); }
    }).catch(() => {});
  }
  window.NaseemUpdates = { check, isNewer: newer, isUpdateAvailable: updateAvailable, currentVersion: CURRENT, currentBuild: CURRENT_BUILD };
  window.addEventListener('online', () => check(true));
  (window.NaseemPerf ? window.NaseemPerf.idle(() => check(false), 3500) : window.setTimeout(() => check(false), 3500));
})();
