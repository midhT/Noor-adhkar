/* Public Naseem release checker. Android build codes allow same-label in-place updates. */
(() => {
  'use strict';
  const CURRENT = document.querySelector('meta[name="naseem-version"]')?.content || '0.0.0';
  const CURRENT_BUILD = Number.parseInt(document.querySelector('meta[name="naseem-version-code"]')?.content || '0', 10) || 0;
  const FEED = 'https://raw.githubusercontent.com/midhT/Naseem-public/main/release.json';
  const RELEASES = 'https://github.com/midhT/Naseem-public/releases/latest';
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
  function show(release, announce = false) {
    if ($('naseemUpdateBanner')) return;
    const banner = document.createElement('aside');
    banner.id = 'naseemUpdateBanner'; banner.className = 'naseem-update-banner';
    const copy = document.createElement('div');
    const build = buildOf(release);
    const title = document.createElement('strong'); title.textContent = `Naseem ${release.version}${build ? ` · build ${build}` : ''} is available`;
    const note = document.createElement('small'); note.textContent = String(release.notesSummary || 'A new version is ready. Review the release notes before installing.').slice(0, 220);
    copy.append(title, note);
    const download = document.createElement('button'); download.type = 'button'; download.textContent = 'Download APK';
    download.addEventListener('click', () => { window.open(safeUrl(release.downloadUrl || release.releaseUrl), '_system'); });
    const notes = document.createElement('button'); notes.type = 'button'; notes.textContent = 'Notes';
    notes.addEventListener('click', () => { window.open(safeUrl(release.releaseUrl || RELEASES), '_system'); });
    const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.setAttribute('aria-label', 'Dismiss'); dismiss.textContent = '×';
    dismiss.addEventListener('click', () => { const state = readState(); state.dismissedBuild = releaseKey(release); state.dismissedVersion = release.version; writeState(state); banner.remove(); });
    banner.append(copy, download, notes, dismiss);
    document.querySelector('.app-shell')?.prepend(banner);
    const native = window.NoorNative?.notifications;
    if (announce && native?.permission && native?.announceUpdate) native.permission().then(p => { if (p === 'granted') native.announceUpdate(release.version, safeUrl(release.releaseUrl || RELEASES)); }).catch(() => {});
  }
  async function check(force = false) {
    const state = readState(), cachedRelease = state.release;
    if (!force && Date.now() - Number(state.checkedAt || 0) < 12 * 60 * 60 * 1000) {
      const available = cachedRelease && updateAvailable(cachedRelease);
      if (available && state.dismissedBuild !== releaseKey(cachedRelease)) show(cachedRelease);
      return { ok: true, skipped: true, updateAvailable: !!available, version: state.latest || null, androidVersionCode: state.latestBuild || 0 };
    }
    status('Checking GitHub for a newer version…');
    try {
      const response = await fetch(FEED, { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const release = await response.json();
      if (!release || typeof release.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(release.version)) throw new Error('The public release feed is invalid.');
      const available = updateAvailable(release);
      state.checkedAt = Date.now(); state.latest = release.version; state.latestBuild = buildOf(release); state.release = release;
      writeState(state);
      if (available) {
        const key = releaseKey(release);
        if (state.notifiedBuild !== key) {
          state.notifiedBuild = key; writeState(state);
          if (state.dismissedBuild !== key) show(release, true);
        } else if (state.dismissedBuild !== key && !$('naseemUpdateBanner')) show(release);
        status(`Naseem ${release.version}${buildOf(release) ? ` (build ${buildOf(release)})` : ''} is available. Download the APK to update.`);
      } else {
        status(release.version === CURRENT && buildOf(release) <= CURRENT_BUILD
          ? `Naseem is up to date (${CURRENT}, build ${CURRENT_BUILD}).`
          : `You are using ${CURRENT}; latest release is ${release.version}.`);
      }
      return { ok: true, updateAvailable: available, version: release.version, androidVersionCode: buildOf(release), release };
    } catch (error) {
      status('Could not check for updates. Connect to the internet and try again.', true);
      return { ok: false, error: String(error?.message || error) };
    }
  }
  const manual = $('naseemCheckUpdates');
  manual?.addEventListener('click', async () => {
    manual.disabled = true; manual.textContent = 'Checking…';
    await check(true);
    manual.disabled = false; manual.textContent = 'Check for updates';
  });
  window.NaseemUpdates = { check, isNewer: newer, isUpdateAvailable: updateAvailable, currentVersion: CURRENT, currentBuild: CURRENT_BUILD };
  window.addEventListener('online', () => check(true));
  window.setTimeout(() => check(false), 5000);
})();
