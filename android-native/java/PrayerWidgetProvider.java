package com.noor.adhkar;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONObject;

import java.util.Calendar;

/** Home-screen widget: next prayer, live countdown and today's five times. */
public class PrayerWidgetProvider extends AppWidgetProvider {
    static final String ACTION_REFRESH = "com.noor.adhkar.PRAYER_REFRESH";

    private static final String[] IDS = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
    private static final String[] LABELS = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"};
    private static final int[] NAME_VIEWS = {R.id.pw_n0, R.id.pw_n1, R.id.pw_n2, R.id.pw_n3, R.id.pw_n4};
    private static final int[] TIME_VIEWS = {R.id.pw_t0, R.id.pw_t1, R.id.pw_t2, R.id.pw_t3, R.id.pw_t4};
    private static final int COLOR_ON = 0xFFF3F1EC;
    private static final int COLOR_MUTED = 0xFF8E8E95;
    private static final int COLOR_NEXT = 0xFFE4D3A6;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) manager.updateAppWidget(id, build(context));
        scheduleRefresh(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_REFRESH.equals(intent.getAction())) refreshAll(context);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(refreshIntent(context));
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
        scheduleRefresh(context);
    }

    private static PendingIntent refreshIntent(Context context) {
        Intent i = new Intent(context, PrayerWidgetProvider.class).setAction(ACTION_REFRESH);
        return PendingIntent.getBroadcast(context, 7, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static String dateKey(Calendar c) {
        return String.format(java.util.Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /**
     * Minutes-after-midnight for each prayer on the given day offset (0 = today), or -1 when unset.
     * The app pushes a map of the next 21 dates ({"2026-11-09": {"fajr": "05:31", ...}, ...}) because calculated
     * times change daily. A flat {"fajr": "05:31", ...} object (older builds) is still understood.
     */
    private static int[] readMinutes(Context context, int dayOffset) {
        int[] out = {-1, -1, -1, -1, -1};
        String json = NoorWidgetStore.prefs(context).getString(NoorWidgetStore.PRAYER_JSON, "{}");
        try {
            JSONObject root = new JSONObject(json);
            Calendar c = Calendar.getInstance();
            c.add(Calendar.DAY_OF_YEAR, dayOffset);
            JSONObject day = root.optJSONObject(dateKey(c));
            if (day == null && root.has("fajr")) day = root;
            if (day != null) for (int i = 0; i < IDS.length; i++) out[i] = parse(day.optString(IDS[i], ""));
        } catch (Exception ignored) { }
        return out;
    }

    private static int parse(String hhmm) {
        if (hhmm == null || !hhmm.matches("\\d{2}:\\d{2}")) return -1;
        int h = Integer.parseInt(hhmm.substring(0, 2));
        int m = Integer.parseInt(hhmm.substring(3, 5));
        return (h < 24 && m < 60) ? h * 60 + m : -1;
    }

    /** 12-hour time with AM/PM, e.g. "5:02 AM". Noor never shows 24-hour time. */
    private static String fmt(int minutes) {
        if (minutes < 0) return "--:--";
        int h = (minutes / 60) % 12;
        if (h == 0) h = 12;
        return String.format(java.util.Locale.US, "%d:%02d %s", h, minutes % 60, minutes / 60 >= 12 ? "PM" : "AM");
    }

    /** Two-line version for the small five-prayer row: "5:02" over "AM". */
    private static String fmtStacked(int minutes) {
        if (minutes < 0) return "--:--";
        return fmt(minutes).replace(" ", "\n");
    }

    private static long millisFor(int minutes, int dayOffset) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, minutes / 60);
        c.set(Calendar.MINUTE, minutes % 60);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.DAY_OF_YEAR, dayOffset);
        return c.getTimeInMillis();
    }

    /** {index, triggerMillis} of the next prayer (today, otherwise the earliest tomorrow); null when no times are set. */
    private static long[] findNext(Context context) {
        long now = System.currentTimeMillis();
        for (int day = 0; day < 2; day++) {
            int[] mins = readMinutes(context, day);
            int best = -1;
            long bestAt = Long.MAX_VALUE;
            for (int i = 0; i < mins.length; i++) {
                if (mins[i] < 0) continue;
                long at = millisFor(mins[i], day);
                if (at > now && at < bestAt) { best = i; bestAt = at; }
            }
            if (best >= 0) return new long[]{best, bestAt, day};
        }
        return null;
    }

    private static RemoteViews build(Context context) {
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_prayer);
        NoorWidgetStore.applyStyle(context, v, R.id.pw_root, R.id.pw_title, new int[]{R.id.pw_time,R.id.pw_hint});
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            v.setOnClickPendingIntent(R.id.pw_root,
                PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        int[] mins = readMinutes(context, 0);
        long[] next = findNext(context);
        for (int i = 0; i < 5; i++) {
            boolean isNext = next != null && next[0] == i;
            v.setTextViewText(NAME_VIEWS[i], LABELS[i]);
            v.setTextViewText(TIME_VIEWS[i], fmtStacked(mins[i]));
            v.setTextColor(NAME_VIEWS[i], isNext ? COLOR_NEXT : COLOR_MUTED);
            v.setTextColor(TIME_VIEWS[i], isNext ? COLOR_NEXT : COLOR_ON);
        }
        if (next == null) {
            v.setTextViewText(R.id.pw_title, "Next prayer");
            v.setTextViewText(R.id.pw_time, "--:--");
            v.setTextViewText(R.id.pw_hint, "Open Naseem to set prayer times");
            v.setViewVisibility(R.id.pw_timer, android.view.View.GONE);
            v.setViewVisibility(R.id.pw_hint, android.view.View.VISIBLE);
            return v;
        }
        int idx = (int) next[0];
        long at = next[1];
        v.setTextViewText(R.id.pw_title, LABELS[idx]);
        v.setTextViewText(R.id.pw_time, fmt(readMinutes(context, (int) next[2])[idx]));
        if (Build.VERSION.SDK_INT >= 24) {
            v.setViewVisibility(R.id.pw_timer, android.view.View.VISIBLE);
            v.setViewVisibility(R.id.pw_hint, android.view.View.GONE);
            v.setChronometerCountDown(R.id.pw_timer, true);
            v.setChronometer(R.id.pw_timer, SystemClock.elapsedRealtime() + (at - System.currentTimeMillis()), null, true);
        } else {
            v.setViewVisibility(R.id.pw_timer, android.view.View.GONE);
            v.setViewVisibility(R.id.pw_hint, android.view.View.VISIBLE);
            v.setTextViewText(R.id.pw_hint, "Next prayer");
        }
        return v;
    }

    /** Repaint right after the next prayer so the widget moves on without the app being opened. */
    private static void scheduleRefresh(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        long[] next = findNext(context);
        PendingIntent pi = refreshIntent(context);
        am.cancel(pi);
        if (next != null) am.set(AlarmManager.RTC, next[1] + 1500, pi);
    }
}
