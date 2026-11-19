package com.noor.adhkar;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

/**
 * Daily Reflection widget. It only shows text the app has synced from its reviewed Glance content (live feed,
 * cached copy or bundled fallback); nothing is bundled natively, so no unreviewed religious text can appear here.
 */
public class ReflectionWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        updateAll(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, manager, appWidgetId, newOptions);
        updateOne(context, manager, appWidgetId);
    }

    static void refreshAll(Context context) {
        updateAll(context);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, ReflectionWidgetProvider.class));
        if (ids == null) return;
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        try {
            manager.updateAppWidget(id, build(context, manager, id));
        } catch (Exception ignored) { }
    }

    /** Shortens text at a word boundary so it fits the widget without relying on remote max-lines. */
    static String fit(String text, int wDp, int hDp, float sp) {
        float charsPerLine = Math.max(8f, (wDp - 36) / (sp * 0.52f));
        float lines = Math.max(1f, (hDp - 36 - 18 - 20) / (sp * 1.45f));
        int budget = Math.max(24, (int) (charsPerLine * lines * 0.92f));
        if (text.length() <= budget) return text;
        int cut = text.lastIndexOf(' ', budget);
        if (cut < budget / 2) cut = budget;
        return text.substring(0, cut).trim() + "…";
    }

    private static RemoteViews build(Context c, AppWidgetManager m, int id) {
        String text, source;
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences p = NoorWidgetStore.prefs(c);
            text = p.getString(NoorWidgetStore.REFLECTION_TEXT, "");
            source = p.getString(NoorWidgetStore.REFLECTION_SOURCE, "");
        }
        boolean has = text != null && !text.trim().isEmpty();
        int[] sz = NoorWidgetStore.sizeDp(m, id, 250, 110);
        float sp = sz[1] >= 150 ? 16f : 14f;
        WidgetArt.Style s = WidgetArt.style(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_reflection);
        v.setImageViewBitmap(R.id.rw_bg, WidgetArt.card(c, sz[0], sz[1], s, true));
        NoorWidgetStore.applyDensity(c, v, R.id.rw_content, 18, 12);
        NoorWidgetStore.bindOpenApp(c, v, R.id.rw_root, 41);
        v.setTextColor(R.id.rw_kicker, s.bright);
        v.setTextColor(R.id.rw_text, s.fg);
        v.setTextColor(R.id.rw_source, s.muted);
        v.setTextViewTextSize(R.id.rw_text, TypedValue.COMPLEX_UNIT_SP, sp);
        v.setTextViewText(R.id.rw_text, has ? fit(text.trim(), sz[0], sz[1], sp) : "Open Naseem to load today’s reflection.");
        boolean hasSource = has && source != null && !source.trim().isEmpty();
        v.setViewVisibility(R.id.rw_source, hasSource ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.rw_source, hasSource ? source.trim() : "");
        return v;
    }
}
