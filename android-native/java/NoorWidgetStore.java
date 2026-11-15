package com.noor.adhkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.RemoteViews;

import java.util.Calendar;
import java.util.Locale;

/** Shared storage between the WebView app (through NoorWidgetsPlugin) and the home-screen widgets. */
final class NoorWidgetStore {
    static final Object LOCK = new Object();
    private static final String FILE = "noor_widgets";

    static final String PRAYER_JSON = "prayer_json";
    static final String TASBEEH_NAME = "tasbeeh_name";
    static final String TASBEEH_ARABIC = "tasbeeh_arabic";
    static final String TASBEEH_COUNT = "tasbeeh_count";
    static final String TASBEEH_TARGET = "tasbeeh_target";
    static final String TASBEEH_PENDING = "tasbeeh_pending";
    static final String HIJRI_DATE = "hijri_date";
    static final String HIJRI_SYNC_DAY = "hijri_sync_day";
    static final String REFLECTION_TEXT = "reflection_text";
    static final String REFLECTION_SOURCE = "reflection_source";
    static final String WIDGET_THEME = "widget_theme";
    static final String WIDGET_ACCENT = "widget_accent";
    static final String WIDGET_DENSITY = "widget_density";
    /** App-wide defaults for the Custom widget; each placed instance keeps its own copy (see CustomWidgetProvider). */
    static final String CUSTOM_WIDGET_BLOCKS = "custom_widget_blocks";
    static final String CUSTOM_WIDGET_LAYOUT = "custom_widget_layout";
    static final String CUSTOM_WIDGET_DUA = "custom_widget_dua";
    static final String CUSTOM_WIDGET_ACTION = "custom_widget_action";

    private NoorWidgetStore() {}

    static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    static int dp(Context c, float v) {
        return Math.round(v * c.getResources().getDisplayMetrics().density);
    }

    /** Widget size in dp as reported by the launcher; falls back to the given defaults. */
    static int[] sizeDp(AppWidgetManager m, int id, int defW, int defH) {
        int w = defW, h = defH;
        try {
            Bundle o = m.getAppWidgetOptions(id);
            if (o != null) {
                int ow = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
                int oh = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
                if (ow > 0) w = ow;
                if (oh > 0) h = oh;
            }
        } catch (Exception ignored) { }
        return new int[]{w, h};
    }

    static boolean isCompact(Context c) {
        return "compact".equals(prefs(c).getString(WIDGET_DENSITY, "comfortable"));
    }

    /** Applies comfortable/compact padding (dp) to a widget's content container. */
    static void applyDensity(Context c, RemoteViews v, int contentId, int comfortableDp, int compactDp) {
        int p = dp(c, isCompact(c) ? compactDp : comfortableDp);
        v.setViewPadding(contentId, p, p, p, p);
    }

    /** Makes a view open the Naseem app when tapped. */
    static void bindOpenApp(Context c, RemoteViews v, int viewId, int requestCode) {
        Intent launch = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (launch == null) return;
        v.setOnClickPendingIntent(viewId,
            PendingIntent.getActivity(c, requestCode, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
    }

    static String dayKey(Calendar c) {
        return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    static String todayKey() {
        return dayKey(Calendar.getInstance());
    }

    /** Repaints every Naseem widget (used after a style change). */
    static void refreshEverything(Context c) {
        PrayerWidgetProvider.refreshAll(c);
        TasbeehWidgetProvider.refreshAll(c);
        HijriWidgetProvider.refreshAll(c);
        ReflectionWidgetProvider.refreshAll(c);
    }
}
