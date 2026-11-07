package com.midhat.noor

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.SystemClock
import android.view.View
import android.widget.RemoteViews
import java.util.Calendar

// home_widget (Flutter side) writes into this SharedPreferences file.
private const val PREFS = "HomeWidgetPreferences"

private fun prefsOf(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

private fun android.content.SharedPreferences.text(key: String): String = (all[key] as? String) ?: ""
private fun android.content.SharedPreferences.number(key: String): Int = (all[key] as? Number)?.toInt() ?: 0
private fun android.content.SharedPreferences.flag(key: String): Boolean = (all[key] as? Boolean) ?: false

/** Tapping a widget opens Noor on [tab] (0 Home, 1 Dhikr, 2 Salah, 3 Focus, 4 Journey). */
private fun openApp(context: Context, tab: Int): PendingIntent {
    val intent = Intent(context, MainActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        putExtra("noor_tab", tab)
    }
    return PendingIntent.getActivity(
        context, 100 + tab, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
}

private fun clock(ms: Long, use24h: Boolean): String {
    val c = Calendar.getInstance().apply { timeInMillis = ms }
    val h = c.get(Calendar.HOUR_OF_DAY)
    val m = c.get(Calendar.MINUTE)
    val mm = if (m < 10) "0$m" else "$m"
    if (use24h) return (if (h < 10) "0$h" else "$h") + ":" + mm
    val h12 = if (h % 12 == 0) 12 else h % 12
    return "$h12:$mm " + (if (h >= 12) "PM" else "AM")
}

class SalahWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = prefsOf(context)
        val now = System.currentTimeMillis()
        // "Name|epochMs;Name|epochMs;..." — four days of obligatory prayers, written by the app.
        val schedule = prefs.text("prayer_schedule").split(";").mapNotNull { entry ->
            val parts = entry.split("|")
            val whenMs = if (parts.size == 2) parts[1].toLongOrNull() else null
            if (whenMs != null) Pair(parts[0], whenMs) else null
        }
        val next = schedule.firstOrNull { it.second > now }
        val use24h = prefs.flag("use24h")
        val place = prefs.text("prayer_place")

        for (id in appWidgetIds) {
            val v = RemoteViews(context.packageName, R.layout.widget_salah)
            v.setOnClickPendingIntent(R.id.widget_root, openApp(context, 2))
            if (next == null) {
                v.setTextViewText(R.id.widget_prayer, "Set location")
                v.setTextViewText(R.id.widget_time, "Open Noor to calculate prayer times")
                v.setViewVisibility(R.id.widget_countdown, View.GONE)
            } else {
                v.setTextViewText(R.id.widget_prayer, next.first)
                v.setTextViewText(
                    R.id.widget_time,
                    clock(next.second, use24h) + (if (place.isNotEmpty()) "  ·  $place" else "")
                )
                v.setViewVisibility(R.id.widget_countdown, View.VISIBLE)
                // The system ticks this itself, so the countdown is live without waking the app.
                val base = SystemClock.elapsedRealtime() + (next.second - now)
                v.setChronometer(R.id.widget_countdown, base, null, true)
                if (Build.VERSION.SDK_INT >= 24) v.setChronometerCountDown(R.id.widget_countdown, true)
            }
            appWidgetManager.updateAppWidget(id, v)
        }
        if (next != null) scheduleRefresh(context, appWidgetIds, next.second + 1500L)
    }

    /** Refresh right after the prayer time so the widget rolls on to the following prayer. */
    private fun scheduleRefresh(context: Context, ids: IntArray, atMs: Long) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, SalahWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        }
        val pi = PendingIntent.getBroadcast(
            context, 77, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        try {
            am.set(AlarmManager.RTC_WAKEUP, atMs, pi)
        } catch (e: SecurityException) {
            // Inexact alarms need no permission; if the OS still refuses, the periodic update covers it.
        }
    }
}

class TasbeehWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = prefsOf(context)
        val today = prefs.number("tasbeeh_today")
        val sessions = prefs.number("tasbeeh_sessions")
        val last = prefs.text("tasbeeh_last")
        for (id in appWidgetIds) {
            val v = RemoteViews(context.packageName, R.layout.widget_tasbeeh)
            v.setOnClickPendingIntent(R.id.widget_root, openApp(context, 1))
            // Completed (ended-session) quantity only — the live count is never exposed.
            v.setTextViewText(R.id.widget_count, today.toString())
            v.setTextViewText(
                R.id.widget_caption,
                if (sessions == 0) "No session yet today" else "$sessions session" + (if (sessions == 1) "" else "s") + " completed"
            )
            v.setTextViewText(R.id.widget_dhikr, if (last.isEmpty()) "Tap to begin" else last)
            appWidgetManager.updateAppWidget(id, v)
        }
    }
}

class VerseWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = prefsOf(context)
        // Entries separated by U+0002, fields by U+0001: arabic, translation, reference.
        val verses = prefs.text("verse_list").split('\u0002').filter { it.isNotBlank() }.map { it.split('\u0001') }
            .filter { it.size >= 3 }
        // Dart's dayOfYear() is zero-based, so subtract one to pick the same entry as the app.
        val index = if (verses.isEmpty()) 0 else (Calendar.getInstance().get(Calendar.DAY_OF_YEAR) - 1) % verses.size
        for (id in appWidgetIds) {
            val v = RemoteViews(context.packageName, R.layout.widget_verse)
            v.setOnClickPendingIntent(R.id.widget_root, openApp(context, 0))
            if (verses.isEmpty()) {
                v.setTextViewText(R.id.widget_verse_arabic, "فَاذْكُرُونِي أَذْكُرْكُمْ")
                v.setTextViewText(R.id.widget_verse_translation, "So remember Me; I will remember you.")
                v.setTextViewText(R.id.widget_verse_reference, "Quran 2:152")
            } else {
                val verse = verses[index]
                v.setTextViewText(R.id.widget_verse_arabic, verse[0])
                v.setTextViewText(R.id.widget_verse_translation, verse[1])
                v.setTextViewText(R.id.widget_verse_reference, verse[2])
            }
            appWidgetManager.updateAppWidget(id, v)
        }
    }
}
