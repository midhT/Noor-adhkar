package com.noor.adhkar;

import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Bridge between the Noor web app and its Android home-screen widgets. */
@CapacitorPlugin(name = "NoorWidgets")
public class NoorWidgetsPlugin extends Plugin {

    @PluginMethod
    public void setPrayerTimes(PluginCall call) {
        String json = call.getString("json", "{}");
        synchronized (NoorWidgetStore.LOCK) {
            NoorWidgetStore.prefs(getContext()).edit().putString(NoorWidgetStore.PRAYER_JSON, json).apply();
        }
        PrayerWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setTasbeeh(PluginCall call) {
        String name = call.getString("name", "Tasbeeh");
        int count = call.getInt("count", 0);
        int target = call.getInt("target", 100);
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences.Editor e = NoorWidgetStore.prefs(getContext()).edit();
            e.putString(NoorWidgetStore.TASBEEH_NAME, name);
            e.putInt(NoorWidgetStore.TASBEEH_COUNT, Math.max(0, count));
            e.putInt(NoorWidgetStore.TASBEEH_TARGET, Math.max(1, target));
            e.apply();
        }
        TasbeehWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    /** Returns taps made on the widget since the app last synced, and clears them. */
    @PluginMethod
    public void takePending(PluginCall call) {
        int pending;
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences p = NoorWidgetStore.prefs(getContext());
            pending = p.getInt(NoorWidgetStore.TASBEEH_PENDING, 0);
            if (pending != 0) p.edit().putInt(NoorWidgetStore.TASBEEH_PENDING, 0).apply();
        }
        JSObject out = new JSObject();
        out.put("count", pending);
        call.resolve(out);
    }
}
