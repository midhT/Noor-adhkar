import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
window.NoorNative = {
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
      await StatusBar.setBackgroundColor({ color: '#090d20' });
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) { console.warn('Noor native system-bar setup failed', e); }
  }
};
document.addEventListener('DOMContentLoaded', () => { window.NoorNative.init(); });
