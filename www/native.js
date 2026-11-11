import { registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// Custom Android plugin (android-native/java/NoorWidgetsPlugin.java) that feeds the home-screen widgets.
const NoorWidgets = isNative ? registerPlugin('NoorWidgets') : null;

const CH = { adhan: 'noor-adhan-v1', tone: 'noor-salah-alarm', silent: 'noor-silent-v1' };
const ADHAN_FILE = 'adhan.mp3'; // android/app/src/main/res/raw/adhan.mp3 (copied by scripts/patch-android.mjs)

window.NoorNative = {
  isNative,
  async haptic() {
    if (!isNative) {
      if (navigator.vibrate) navigator.vibrate(12);
      return;
    }
    try { await Haptics.impact({ style: ImpactStyle.Light }); }
    catch (e) { try { await Haptics.vibrate({ duration: 12 }); } catch (_) {} }
  },
  async init() {
    if (!isNative) return;
    try {
      await LocalNotifications.addListener('localNotificationActionPerformed', event => {
        const url = event?.notification?.extra?.url;
        if (typeof url === 'string' && url.startsWith('https://')) window.open(url, '_system');
      });
    } catch (_) {}
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.show();
      const syncStatusBar=async()=>{const dark=window.NaseemTheme?.apply?document.body.classList.contains('light')===false:(window.matchMedia?.('(prefers-color-scheme: dark)').matches!==false);await StatusBar.setBackgroundColor({color:dark?'#0b0b0d':'#f4f2ec'});await StatusBar.setStyle({style:dark?Style.Light:Style.Dark});};
      await syncStatusBar();
      document.addEventListener('naseem:theme-changed',syncStatusBar);
    } catch (e) { console.warn('Noor native system-bar setup failed', e); }
  },

  /* ---- Salah alarms: Android local notifications. Three channels: full Adhan, short tone, silent. ---- */
  notifications: isNative ? {
    CH,
    async permission() {
      try { return (await LocalNotifications.checkPermissions()).display; } catch (_) { return 'denied'; }
    },
    async request() {
      try { return (await LocalNotifications.requestPermissions()).display; } catch (_) { return 'denied'; }
    },
    async exactAlarm() {
      try { return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm; } catch (_) { return 'granted'; }
    },
    async openExactAlarmSettings() {
      try { return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm; } catch (_) { return 'denied'; }
    },
    async ensureChannels() {
      const base = { importance: 5, visibility: 1, vibration: true, lights: true };
      try {
        await LocalNotifications.createChannel({ ...base, id: CH.adhan, name: 'Adhan (full call to prayer)', description: 'Plays the Adhan at prayer time', sound: ADHAN_FILE });
        await LocalNotifications.createChannel({ ...base, id: CH.tone, name: 'Salah tone', description: 'Short notification tone' });
        await LocalNotifications.createChannel({ id: CH.silent, name: 'Salah silent', description: 'Notification without sound', importance: 2, visibility: 1, vibration: false, lights: false });
      } catch (_) {}
    },
    /** Cancels every pending Noor prayer notification with an id in [lo, hi). */
    async cancelRange(lo, hi) {
      try {
        const ids = (await LocalNotifications.getPending()).notifications.map(n => n.id).filter(id => id >= lo && id < hi);
        if (ids.length) await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
      } catch (_) {}
    },
    async schedule(list) {
      const mapped = list.map(n => ({
        id: n.id, title: n.title, body: n.body, channelId: CH[n.channel] || CH.tone,
        ...(n.channel === 'adhan' ? { sound: ADHAN_FILE } : {}),
        schedule: { at: new Date(n.at), allowWhileIdle: true }
      }));
      for (let i = 0; i < mapped.length; i += 40) await LocalNotifications.schedule({ notifications: mapped.slice(i, i + 40) });
    },
    async announceUpdate(version, url) {
      try {
        await LocalNotifications.schedule({ notifications: [{ id: 99001, title: 'Naseem update available', body: `Version ${version} is ready. Tap to view the release and install it manually.`, schedule: { at: new Date(Date.now() + 1200) }, extra: { url } }] });
        return true;
      } catch (_) { return false; }
    },
    async pending() {
      try { return (await LocalNotifications.getPending()).notifications.map(n => n.id); } catch (_) { return []; }
    }
  } : null,

  /* ---- Files: an Android WebView cannot download blob: URLs, so backups go through the share sheet ---- */
  files: isNative ? {
    async shareText(filename, text, title) {
      const written = await Filesystem.writeFile({ path: filename, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: title || filename, dialogTitle: title || 'Save your Naseem backup', url: written.uri });
    }
  } : null,

  /* ---- Home-screen widgets ---- */
  widgets: isNative ? {
    async setPrayerTimes(times) { try { await NoorWidgets.setPrayerTimes({ json: JSON.stringify(times || {}) }); return true; } catch (_) { return false; } },
    async setTasbeeh(info) { try { await NoorWidgets.setTasbeeh(info); return true; } catch (_) { return false; } },
    async setHijriDate(date) { try { await NoorWidgets.setHijriDate({ date: String(date || '') }); return true; } catch (_) { return false; } },
    async takePending() { try { return (await NoorWidgets.takePending()).count || 0; } catch (_) { return 0; } }
  } : null
};
if (isNative) {
  App.addListener('backButton', ({ canGoBack }) => {
    const event = new CustomEvent('naseem:back', { cancelable: true });
    window.dispatchEvent(event);
    if (!event.defaultPrevented) {
      if (canGoBack) window.history.back();
      else App.exitApp();
    }
  }).catch(error => console.warn('Naseem back-button listener unavailable', error));
}

document.addEventListener('DOMContentLoaded', () => { window.NoorNative.init(); });
