package com.noor.adhkar;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

/**
 * Prayer Times widget: next prayer, live countdown, progress to it and today's five times.
 * Also receives the shared refresh/boot/time-change broadcasts for the Salah Countdown and Custom widgets.
 */
public class PrayerWidgetProvider extends AppWidgetProvider {
    static final String ACTION_REFRESH = "com.noor.adhkar.PRAYER_REFRESH";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        updateAll(context);
        PrayerMath.scheduleRefresh(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, manager, appWidgetId, newOptions);
        updateOne(context, manager, appWidgetId);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || intent.getAction() == null) return;
        String a = intent.getAction();
        if (ACTION_REFRESH.equals(a) || Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(a) || Intent.ACTION_DATE_CHANGED.equals(a)) {
            refreshAll(context);
        }
    }

    @Override
    public void onDisabled(Context context) {
        PrayerMath.scheduleRefresh(context); // cancels the alarm when no time-based widget is left
    }

    /** Repaints every time-based widget and re-arms the alarm. */
    static void refreshAll(Context context) {
        updateAll(context);
        CountdownWidgetProvider.updateAll(context);
        CustomWidgetProvider.updateAll(context);
        PrayerMath.scheduleRefresh(context);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetProvider.class));
        if (ids == null) return;
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        try {
            manager.updateAppWidget(id, build(context, manager, id));
        } catch (Exception ignored) { }
    }

    private static RemoteViews build(Context c, AppWidgetManager m, int id) {
        int[] sz = NoorWidgetStore.sizeDp(m, id, 250, 110);
        boolean wide = sz[0] >= 200 && sz[1] >= 95;
        WidgetArt.Style s = WidgetArt.style(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), wide ? R.layout.widget_prayer : R.layout.widget_prayer_small);
        v.setImageViewBitmap(R.id.pw_bg, WidgetArt.card(c, sz[0], sz[1], s, false));
        NoorWidgetStore.applyDensity(c, v, R.id.pw_content, 16, 11);
        NoorWidgetStore.bindOpenApp(c, v, R.id.pw_root, 0);
        v.setTextColor(R.id.pw_kicker, s.muted);
        v.setTextColor(R.id.pw_title, s.fg);
        v.setTextColor(R.id.pw_timer, s.bright);
        v.setTextColor(R.id.pw_time, s.muted);
        v.setTextColor(R.id.pw_hint, s.muted);

        long[] next = PrayerMath.findNext(c);
        long now = System.currentTimeMillis();

        if (wide) {
            int[] mins = PrayerMath.readMinutes(c, 0);
            int[] nameIds = {R.id.pw_n0, R.id.pw_n1, R.id.pw_n2, R.id.pw_n3, R.id.pw_n4};
            int[] timeIds = {R.id.pw_t0, R.id.pw_t1, R.id.pw_t2, R.id.pw_t3, R.id.pw_t4};
            for (int i = 0; i < 5; i++) {
                boolean isNext = next != null && next[0] == i;
                boolean passed = mins[i] >= 0 && PrayerMath.millisFor(mins[i], 0) <= now;
                v.setTextViewText(nameIds[i], PrayerMath.LABELS[i]);
                v.setTextViewText(timeIds[i], PrayerMath.fmtStacked(mins[i]));
                v.setTextColor(nameIds[i], isNext ? s.bright : s.muted);
                v.setTextColor(timeIds[i], isNext ? s.bright : (passed ? s.muted : s.fg));
            }
        }

        if (next == null) {
            v.setTextViewText(R.id.pw_title, "Next prayer");
            v.setTextViewText(R.id.pw_time, "");
            v.setViewVisibility(R.id.pw_timer, View.GONE);
            v.setViewVisibility(R.id.pw_hint, View.VISIBLE);
            v.setTextViewText(R.id.pw_hint, "Open Naseem to set prayer times");
            v.setImageViewBitmap(R.id.pw_bar, WidgetArt.bar(c, Math.max(60, sz[0] - 32), 0f, s));
            return v;
        }
        int idx = (int) next[0];
        long at = next[1];
        int minutes = PrayerMath.readMinutes(c, (int) next[2])[idx];
        v.setTextViewText(R.id.pw_title, PrayerMath.LABELS[idx]);
        v.setTextViewText(R.id.pw_time, (next[2] == 1 ? "Tomorrow " : "") + PrayerMath.fmt(minutes));
        v.setViewVisibility(R.id.pw_timer, View.VISIBLE);
        v.setViewVisibility(R.id.pw_hint, View.GONE);
        v.setChronometerCountDown(R.id.pw_timer, true);
        v.setChronometer(R.id.pw_timer, SystemClock.elapsedRealtime() + (at - now), null, true);
        v.setImageViewBitmap(R.id.pw_bar, WidgetArt.bar(c, Math.max(60, sz[0] - 32), PrayerMath.progress(c, next), s));
        return v;
    }
}
