import { registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LocalNotifications } from '@capacitor/local-notifications';

const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// Custom Android plugin (android-native/java/NoorWidgetsPlugin.java) that feeds the home-screen widgets.
const NoorWidgets = isNative ? registerPlugin('NoorWidgets') : null;

const CHANNEL_ID = 'noor-salah-alarm';

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
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.show();
      await StatusBar.setBackgroundColor({ color: '#0b0b0d' });
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) { console.warn('Noor native system-bar setup failed', e); }
  },

  /* ---- Salah alarms (Android local notifications on a high-importance channel) ---- */
  notifications: isNative ? {
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
    async ensureChannel() {
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID, name: 'Salah alarms', description: 'Prayer time alarms',
          importance: 5, visibility: 1, vibration: true, lights: true
        });
      } catch (_) {}
    },
    async cancel(ids) {
      try { await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) }); } catch (_) {}
    },
    async schedule(list) {
      await LocalNotifications.schedule({
        notifications: list.map(n => ({
          id: n.id, title: n.title, body: n.body, channelId: CHANNEL_ID,
          schedule: n.at ? { at: new Date(n.at), allowWhileIdle: true }
                         : { on: { hour: n.hour, minute: n.minute }, allowWhileIdle: true }
        }))
      });
    },
    async pending() {
      try { return (await LocalNotifications.getPending()).notifications.map(n => n.id); } catch (_) { return []; }
    }
  } : null,

  /* ---- Home-screen widgets ---- */
  widgets: isNative ? {
    async setPrayerTimes(times) { try { await NoorWidgets.setPrayerTimes({ json: JSON.stringify(times || {}) }); } catch (_) {} },
    async setTasbeeh(info) { try { await NoorWidgets.setTasbeeh(info); } catch (_) {} },
    async takePending() { try { return (await NoorWidgets.takePending()).count || 0; } catch (_) { return 0; } }
  } : null
};
document.addEventListener('DOMContentLoaded', () => { window.NoorNative.init(); });
