package com.noor.adhkar;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

/** Salah Countdown widget: a tick-ring dial showing progress to the next prayer with a large live countdown. */
public class CountdownWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        PrayerWidgetProvider.refreshAll(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, manager, appWidgetId, newOptions);
        updateOne(context, manager, appWidgetId);
    }

    @Override
    public void onDisabled(Context context) {
        PrayerMath.scheduleRefresh(context);
    }

    static void refreshAll(Context context) {
        PrayerWidgetProvider.refreshAll(context);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, CountdownWidgetProvider.class));
        if (ids == null) return;
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        try {
            manager.updateAppWidget(id, build(context, manager, id));
        } catch (Exception ignored) { }
    }

    private static RemoteViews build(Context c, AppWidgetManager m, int id) {
        int[] sz = NoorWidgetStore.sizeDp(m, id, 150, 150);
        int side = Math.max(90, Math.min(sz[0], sz[1]));
        boolean small = side < 140;
        WidgetArt.Style s = WidgetArt.style(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_countdown);
        v.setImageViewBitmap(R.id.sc_bg, WidgetArt.card(c, sz[0], sz[1], s, false));
        NoorWidgetStore.bindOpenApp(c, v, R.id.sc_root, 31);
        v.setTextColor(R.id.sc_kicker, s.muted);
        v.setTextColor(R.id.sc_name, s.fg);
        v.setTextColor(R.id.sc_timer, s.fg);
        v.setTextColor(R.id.sc_time, s.bright);
        v.setTextColor(R.id.sc_hint, s.muted);
        v.setTextViewTextSize(R.id.sc_name, TypedValue.COMPLEX_UNIT_SP, small ? 13 : 17);
        v.setTextViewTextSize(R.id.sc_timer, TypedValue.COMPLEX_UNIT_SP, small ? 22 : 32);
        v.setTextViewTextSize(R.id.sc_time, TypedValue.COMPLEX_UNIT_SP, small ? 10 : 12);

        long[] next = PrayerMath.findNext(c);
        if (next == null) {
            v.setImageViewBitmap(R.id.sc_dial, WidgetArt.dial(c, side - 20, 0f, s));
            v.setTextViewText(R.id.sc_name, "Next prayer");
            v.setViewVisibility(R.id.sc_timer, View.GONE);
            v.setViewVisibility(R.id.sc_time, View.GONE);
            v.setViewVisibility(R.id.sc_hint, View.VISIBLE);
            v.setTextViewText(R.id.sc_hint, "Open Naseem to set prayer times");
            return v;
        }
        int idx = (int) next[0];
        long now = System.currentTimeMillis();
        int minutes = PrayerMath.readMinutes(c, (int) next[2])[idx];
        v.setImageViewBitmap(R.id.sc_dial, WidgetArt.dial(c, side - 20, PrayerMath.progress(c, next), s));
        v.setTextViewText(R.id.sc_name, PrayerMath.LABELS[idx]);
        v.setTextViewText(R.id.sc_time, (next[2] == 1 ? "Tomorrow " : "") + PrayerMath.fmt(minutes));
        v.setViewVisibility(R.id.sc_timer, View.VISIBLE);
        v.setViewVisibility(R.id.sc_time, View.VISIBLE);
        v.setViewVisibility(R.id.sc_hint, View.GONE);
        v.setChronometerCountDown(R.id.sc_timer, true);
        v.setChronometer(R.id.sc_timer, SystemClock.elapsedRealtime() + (next[1] - now), null, true);
        return v;
    }
}
