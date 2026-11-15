package com.noor.adhkar;

import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Bridge between the Naseem web app and its Android home-screen widgets. */
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
        String arabic = call.getString("arabic", "");
        int count = call.getInt("count", 0);
        int target = call.getInt("target", 100);
        if (arabic == null) arabic = "";
        if (arabic.length() > 60) arabic = arabic.substring(0, 60);
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences.Editor e = NoorWidgetStore.prefs(getContext()).edit();
            e.putString(NoorWidgetStore.TASBEEH_NAME, name);
            e.putString(NoorWidgetStore.TASBEEH_ARABIC, arabic);
            e.putInt(NoorWidgetStore.TASBEEH_COUNT, Math.max(0, count));
            e.putInt(NoorWidgetStore.TASBEEH_TARGET, Math.max(1, target));
            e.apply();
        }
        TasbeehWidgetProvider.refreshAll(getContext());
        CustomWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setHijriDate(PluginCall call) {
        String date = call.getString("date", "");
        synchronized (NoorWidgetStore.LOCK) {
            NoorWidgetStore.prefs(getContext()).edit()
                .putString(NoorWidgetStore.HIJRI_DATE, date)
                .putString(NoorWidgetStore.HIJRI_SYNC_DAY, NoorWidgetStore.todayKey()).apply();
        }
        HijriWidgetProvider.refreshAll(getContext());
        CustomWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    /** Daily reflection text taken from the app's Glance content; trimmed so a malformed feed cannot bloat storage. */
    @PluginMethod
    public void setReflection(PluginCall call) {
        String text = call.getString("text", "");
        String source = call.getString("source", "");
        if (text == null) text = "";
        if (source == null) source = "";
        text = text.trim();
        source = source.trim();
        if (text.length() > 400) text = text.substring(0, 400);
        if (source.length() > 80) source = source.substring(0, 80);
        synchronized (NoorWidgetStore.LOCK) {
            NoorWidgetStore.prefs(getContext()).edit()
                .putString(NoorWidgetStore.REFLECTION_TEXT, text)
                .putString(NoorWidgetStore.REFLECTION_SOURCE, source).apply();
        }
        ReflectionWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void setWidgetStyle(PluginCall call) {
        String theme = call.getString("theme", "dark");
        String accent = call.getString("accent", "emerald");
        String density = call.getString("density", "comfortable");
        if (!theme.equals("light") && !theme.equals("dark")) theme = "dark";
        if (!accent.equals("emerald") && !accent.equals("silver") && !accent.equals("blue")) accent = "emerald";
        if (!density.equals("compact") && !density.equals("comfortable")) density = "comfortable";
        synchronized (NoorWidgetStore.LOCK) {
            NoorWidgetStore.prefs(getContext()).edit()
                .putString(NoorWidgetStore.WIDGET_THEME, theme)
                .putString(NoorWidgetStore.WIDGET_ACCENT, accent)
                .putString(NoorWidgetStore.WIDGET_DENSITY, density).apply();
        }
        NoorWidgetStore.refreshEverything(getContext());
        call.resolve();
    }

    /** Saves the app-wide defaults for the Custom widget; placed instances keep their own settings once configured. */
    @PluginMethod
    public void setCustomWidget(PluginCall call) {
        String requestedBlocks = call.getString("blocks", "prayer,tasbeeh,hijri");
        StringBuilder safeBlocks = new StringBuilder();
        for (String block : requestedBlocks.split(",")) {
            String key = block.trim();
            if (key.equals("prayer") || key.equals("tasbeeh") || key.equals("hijri") || key.equals("dua")) {
                if (safeBlocks.length() > 0) safeBlocks.append(',');
                safeBlocks.append(key);
            }
        }
        if (safeBlocks.length() == 0) { call.reject("Choose at least one supported widget content block."); return; }
        String blocks = safeBlocks.toString();
        String layout = call.getString("layout", "comfortable");
        String dua = call.getString("dua", "Read a daily dua in Naseem");
        String action = call.getString("action", "open");
        if (!action.equals("count") && !action.equals("open")) action = "open";
        if (!layout.equals("compact") && !layout.equals("comfortable")) layout = "comfortable";
        if (dua.length() > 180) dua = dua.substring(0, 180);
        synchronized (NoorWidgetStore.LOCK) {
            NoorWidgetStore.prefs(getContext()).edit()
                .putString(NoorWidgetStore.CUSTOM_WIDGET_BLOCKS, blocks)
                .putString(NoorWidgetStore.CUSTOM_WIDGET_LAYOUT, layout)
                .putString(NoorWidgetStore.CUSTOM_WIDGET_DUA, dua)
                .putString(NoorWidgetStore.CUSTOM_WIDGET_ACTION, action).apply();
        }
        CustomWidgetProvider.refreshAll(getContext());
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
