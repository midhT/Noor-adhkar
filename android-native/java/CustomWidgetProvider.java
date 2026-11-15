package com.noor.adhkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

/**
 * User-composed widget. Every placed instance keeps its own blocks, density, tap action and personal reminder,
 * chosen when the widget is added (and again through the launcher's reconfigure action where supported).
 * Instances without saved settings (for example ones placed by an older build) use the app-wide defaults
 * saved from Widget Studio.
 */
public class CustomWidgetProvider extends AppWidgetProvider {
    static final String ACTION_COUNT = "com.noor.adhkar.CUSTOM_WIDGET_COUNT";

    /** One widget instance's settings. */
    static final class Config {
        String blocks = "prayer,tasbeeh,hijri";
        String layout = "comfortable";
        String dua = "Read a daily dua in Naseem";
        String action = "open";

        boolean has(String block) {
            for (String b : blocks.split(",")) if (b.trim().equals(block)) return true;
            return false;
        }
    }

    private static String key(int id, String field) {
        return "cw_" + id + "_" + field;
    }

    static Config config(Context c, int id) {
        SharedPreferences p = NoorWidgetStore.prefs(c);
        Config cfg = new Config();
        synchronized (NoorWidgetStore.LOCK) {
            if (p.contains(key(id, "blocks"))) {
                cfg.blocks = p.getString(key(id, "blocks"), cfg.blocks);
                cfg.layout = p.getString(key(id, "layout"), cfg.layout);
                cfg.dua = p.getString(key(id, "dua"), cfg.dua);
                cfg.action = p.getString(key(id, "action"), cfg.action);
            } else {
                cfg.blocks = p.getString(NoorWidgetStore.CUSTOM_WIDGET_BLOCKS, cfg.blocks);
                cfg.layout = p.getString(NoorWidgetStore.CUSTOM_WIDGET_LAYOUT, cfg.layout);
                cfg.dua = p.getString(NoorWidgetStore.CUSTOM_WIDGET_DUA, cfg.dua);
                cfg.action = p.getString(NoorWidgetStore.CUSTOM_WIDGET_ACTION, cfg.action);
            }
        }
        return cfg;
    }

    static void saveConfig(Context c, int id, Config cfg) {
        synchronized (NoorWidgetStore.LOCK) {
            NoorWidgetStore.prefs(c).edit()
                .putString(key(id, "blocks"), cfg.blocks)
                .putString(key(id, "layout"), cfg.layout)
                .putString(key(id, "dua"), cfg.dua)
                .putString(key(id, "action"), cfg.action).apply();
        }
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (i != null && ACTION_COUNT.equals(i.getAction())) {
            synchronized (NoorWidgetStore.LOCK) {
                SharedPreferences p = NoorWidgetStore.prefs(c);
                p.edit()
                    .putInt(NoorWidgetStore.TASBEEH_COUNT, p.getInt(NoorWidgetStore.TASBEEH_COUNT, 0) + 1)
                    .putInt(NoorWidgetStore.TASBEEH_PENDING, p.getInt(NoorWidgetStore.TASBEEH_PENDING, 0) + 1).apply();
            }
            updateAll(c);
            TasbeehWidgetProvider.updateAll(c);
        }
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) updateOne(c, m, id);
        PrayerMath.scheduleRefresh(c);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(c, m, id, newOptions);
        updateOne(c, m, id);
    }

    @Override
    public void onDeleted(Context c, int[] ids) {
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences.Editor e = NoorWidgetStore.prefs(c).edit();
            for (int id : ids) {
                e.remove(key(id, "blocks")).remove(key(id, "layout")).remove(key(id, "dua")).remove(key(id, "action"));
            }
            e.apply();
        }
    }

    @Override
    public void onDisabled(Context c) {
        PrayerMath.scheduleRefresh(c);
    }

    static void refreshAll(Context c) {
        updateAll(c);
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, CustomWidgetProvider.class));
        if (ids == null) return;
        for (int id : ids) updateOne(c, m, id);
    }

    static void updateOne(Context c, AppWidgetManager m, int id) {
        try {
            m.updateAppWidget(id, build(c, m, id));
        } catch (Exception ignored) { }
    }

    private static RemoteViews build(Context c, AppWidgetManager m, int id) {
        Config cfg = config(c, id);
        SharedPreferences p = NoorWidgetStore.prefs(c);
        boolean compact = "compact".equals(cfg.layout);
        int[] sz = NoorWidgetStore.sizeDp(m, id, 180, 120);
        WidgetArt.Style s = WidgetArt.style(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_custom);
        v.setImageViewBitmap(R.id.cw_bg, WidgetArt.card(c, sz[0], sz[1], s, true));
        int pad = NoorWidgetStore.dp(c, compact ? 11 : 16);
        v.setViewPadding(R.id.cw_content, pad, pad, pad, pad);

        int[] ids = {R.id.cw_prayer, R.id.cw_tasbeeh, R.id.cw_hijri, R.id.cw_dua};
        String[] keys = {"prayer", "tasbeeh", "hijri", "dua"};
        float sp = compact ? 12f : 14f;
        for (int i = 0; i < ids.length; i++) {
            v.setViewVisibility(ids[i], cfg.has(keys[i]) ? View.VISIBLE : View.GONE);
            v.setTextViewTextSize(ids[i], TypedValue.COMPLEX_UNIT_SP, sp);
            v.setTextColor(ids[i], s.fg);
        }
        v.setTextColor(R.id.cw_title, s.bright);
        v.setTextColor(R.id.cw_footer, s.muted);

        long[] next = PrayerMath.findNext(c);
        if (next != null) {
            int idx = (int) next[0];
            int minutes = PrayerMath.readMinutes(c, (int) next[2])[idx];
            v.setTextViewText(R.id.cw_prayer, "Next · " + PrayerMath.LABELS[idx] + "  " + (next[2] == 1 ? "Tomorrow " : "") + PrayerMath.fmt(minutes));
        } else {
            v.setTextViewText(R.id.cw_prayer, "Prayer times · open Naseem to sync");
        }
        int count, target;
        String name, hijri;
        synchronized (NoorWidgetStore.LOCK) {
            count = p.getInt(NoorWidgetStore.TASBEEH_COUNT, 0);
            target = Math.max(1, p.getInt(NoorWidgetStore.TASBEEH_TARGET, 100));
            name = p.getString(NoorWidgetStore.TASBEEH_NAME, "Tasbeeh");
            hijri = p.getString(NoorWidgetStore.HIJRI_DATE, "");
        }
        v.setTextViewText(R.id.cw_tasbeeh, name + " · " + count + " / " + target);
        v.setTextViewText(R.id.cw_hijri, hijri.isEmpty() ? "Open Naseem to sync the Hijri date" : hijri);
        v.setTextViewText(R.id.cw_dua, cfg.dua);

        boolean counts = "count".equals(cfg.action) && cfg.has("tasbeeh");
        v.setTextViewText(R.id.cw_footer, counts ? "Tap the tasbeeh line to count" : "Tap to open Naseem");
        NoorWidgetStore.bindOpenApp(c, v, R.id.cw_root, 61);
        if (counts) {
            Intent countIntent = new Intent(c, CustomWidgetProvider.class)
                .setAction(ACTION_COUNT)
                .setData(Uri.parse("naseem://custom-widget/" + id));
            v.setOnClickPendingIntent(R.id.cw_tasbeeh,
                PendingIntent.getBroadcast(c, id, countIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        return v;
    }
}
