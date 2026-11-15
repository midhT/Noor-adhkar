package com.noor.adhkar;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Hijri date widget. The date is calculated by the app's ICU/API calendar logic and synced locally; when the
 * synced value is from an earlier day the widget says so instead of presenting it as today's date.
 */
public class HijriWidgetProvider extends AppWidgetProvider {
    private static final Pattern DAY_FIRST = Pattern.compile("^(\\d{1,2})\\s+(.+)$");

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
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
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, HijriWidgetProvider.class));
        if (ids == null) return;
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        try {
            manager.updateAppWidget(id, build(context, manager, id));
        } catch (Exception ignored) { }
    }

    private static RemoteViews build(Context c, AppWidgetManager m, int id) {
        String date, syncDay;
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences p = NoorWidgetStore.prefs(c);
            date = p.getString(NoorWidgetStore.HIJRI_DATE, "");
            syncDay = p.getString(NoorWidgetStore.HIJRI_SYNC_DAY, "");
        }
        boolean has = date != null && !date.isEmpty();
        boolean stale = has && !NoorWidgetStore.todayKey().equals(syncDay);
        int[] sz = NoorWidgetStore.sizeDp(m, id, 160, 110);
        WidgetArt.Style s = WidgetArt.style(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_hijri);
        v.setImageViewBitmap(R.id.hw_bg, WidgetArt.card(c, sz[0], sz[1], s, true));
        NoorWidgetStore.applyDensity(c, v, R.id.hw_content, 18, 12);
        NoorWidgetStore.bindOpenApp(c, v, R.id.hw_root, 21);
        v.setTextColor(R.id.hw_kicker, s.muted);
        v.setTextColor(R.id.hw_day, stale ? s.muted : s.fg);
        v.setTextColor(R.id.hw_month, stale ? s.muted : s.bright);
        v.setTextColor(R.id.hw_greg, s.muted);
        v.setTextColor(R.id.hw_hint, s.muted);

        String day = "";
        String rest = "";
        if (has) {
            Matcher mt = DAY_FIRST.matcher(date.trim());
            if (mt.matches()) { day = mt.group(1); rest = mt.group(2); }
            else rest = date.trim();
        } else {
            rest = "Open Naseem to sync the Hijri date";
        }
        v.setTextViewText(R.id.hw_day, day);
        v.setViewVisibility(R.id.hw_day, day.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.hw_month, rest);
        v.setTextViewText(R.id.hw_greg, new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault()).format(new Date()));
        v.setViewVisibility(R.id.hw_hint, stale ? View.VISIBLE : View.GONE);
        v.setTextViewText(R.id.hw_hint, "Open Naseem to update");
        return v;
    }
}
