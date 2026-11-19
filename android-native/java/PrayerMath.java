package com.noor.adhkar;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

/** Prayer-time lookups shared by the Prayer Times, Salah Countdown and Custom widgets. */
final class PrayerMath {
    static final String[] IDS = {"fajr", "dhuhr", "asr", "maghrib", "isha"};
    static final String[] LABELS = {"Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"};
    private static final long MAX_REPAINT_GAP_MS = 15L * 60L * 1000L;

    private PrayerMath() {}

    /**
     * Minutes-after-midnight for each prayer on the given day offset (0 = today), or -1 when unset.
     * The app pushes a map of the next 21 dates ({"2026-11-09": {"fajr": "05:31", ...}, ...}) because calculated
     * times change daily. A flat {"fajr": "05:31", ...} object (older builds) is still understood.
     */
    static int[] readMinutes(Context context, int dayOffset) {
        int[] out = {-1, -1, -1, -1, -1};
        String json = NoorWidgetStore.prefs(context).getString(NoorWidgetStore.PRAYER_JSON, "{}");
        try {
            JSONObject root = new JSONObject(json);
            Calendar c = Calendar.getInstance();
            c.add(Calendar.DAY_OF_YEAR, dayOffset);
            JSONObject day = root.optJSONObject(NoorWidgetStore.dayKey(c));
            if (day == null && root.has("fajr")) day = root;
            if (day != null) for (int i = 0; i < IDS.length; i++) out[i] = parse(day.optString(IDS[i], ""));
        } catch (Exception ignored) { }
        return out;
    }

    static int parse(String hhmm) {
        if (hhmm == null || !hhmm.matches("\\d{2}:\\d{2}")) return -1;
        int h = Integer.parseInt(hhmm.substring(0, 2));
        int m = Integer.parseInt(hhmm.substring(3, 5));
        return (h < 24 && m < 60) ? h * 60 + m : -1;
    }

    /** 12-hour time with AM/PM, e.g. "5:02 AM". Naseem never shows 24-hour time. */
    static String fmt(int minutes) {
        if (minutes < 0) return "--:--";
        int h = (minutes / 60) % 12;
        if (h == 0) h = 12;
        return String.format(Locale.US, "%d:%02d %s", h, minutes % 60, minutes / 60 >= 12 ? "PM" : "AM");
    }

    /** Two-line version for the five-prayer row: "5:02" over "AM". */
    static String fmtStacked(int minutes) {
        if (minutes < 0) return "--:--";
        return fmt(minutes).replace(" ", "\n");
    }

    static long millisFor(int minutes, int dayOffset) {
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, minutes / 60);
        c.set(Calendar.MINUTE, minutes % 60);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.DAY_OF_YEAR, dayOffset);
        return c.getTimeInMillis();
    }

    /** {index, triggerMillis, dayOffset} of the next prayer (today, otherwise the earliest tomorrow); null when no times are set. */
    static long[] findNext(Context context) {
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

    /** Latest prayer time at or before {@code now}; -1 when it cannot be determined. */
    static long findPrevious(Context context, long now) {
        long best = -1;
        for (int day = -1; day <= 0; day++) {
            int[] mins = readMinutes(context, day);
            for (int m : mins) {
                if (m < 0) continue;
                long at = millisFor(m, day);
                if (at <= now && at > best) best = at;
            }
        }
        if (best < 0) {
            // Yesterday's times were not synced: assume they match today's.
            for (int m : readMinutes(context, 0)) {
                if (m < 0) continue;
                long at = millisFor(m, -1);
                if (at <= now && at > best) best = at;
            }
        }
        return best;
    }

    /** 0..1 progress through the gap between the previous prayer and the next one. */
    static float progress(Context context, long[] next) {
        if (next == null) return 0f;
        long now = System.currentTimeMillis();
        long prev = findPrevious(context, now);
        if (prev < 0) return 0f;
        long total = next[1] - prev;
        if (total <= 0) return 0f;
        return Math.max(0f, Math.min(1f, (now - prev) / (float) total));
    }

    static PendingIntent refreshIntent(Context context) {
        Intent i = new Intent(context, PrayerWidgetProvider.class).setAction(PrayerWidgetProvider.ACTION_REFRESH);
        return PendingIntent.getBroadcast(context, 7, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static boolean hasTimeWidgets(Context context) {
        AppWidgetManager m = AppWidgetManager.getInstance(context);
        Class<?>[] types = {PrayerWidgetProvider.class, CountdownWidgetProvider.class, CustomWidgetProvider.class};
        for (Class<?> type : types) {
            int[] ids = m.getAppWidgetIds(new ComponentName(context, type));
            if (ids != null && ids.length > 0) return true;
        }
        return false;
    }

    /**
     * Repaints right after the next prayer (so the widgets move on without opening the app) and at least every
     * 15 minutes (so the dial advances). Uses a non-waking inexact alarm to stay battery-friendly: if the phone
     * is asleep at prayer time, the repaint happens when it wakes. The countdown text itself is drawn by the
     * system Chronometer and keeps running without alarms.
     */
    static void scheduleRefresh(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = refreshIntent(context);
        am.cancel(pi);
        if (!hasTimeWidgets(context)) return;
        long now = System.currentTimeMillis();
        long at = now + MAX_REPAINT_GAP_MS;
        long[] next = findNext(context);
        if (next != null) at = Math.min(at, next[1] + 1500);
        am.set(AlarmManager.RTC, Math.max(at, now + 5000), pi);
    }
}
