package com.midhat.noor

import android.appwidget.AppWidgetManager
import android.content.Context
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetProvider
import android.content.SharedPreferences

class TasbeehWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        appWidgetIds.forEach { id ->
            val views = RemoteViews(context.packageName, R.layout.widget_tasbeeh)
            views.setTextViewText(R.id.widget_dhikr, widgetData.getString("tasbeeh_dhikr", "سُبْحَانَ اللَّهِ"))
            views.setTextViewText(R.id.widget_count, (widgetData.getInt("tasbeeh_count", 0)).toString())
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}

class SalahWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        appWidgetIds.forEach { id ->
            val views = RemoteViews(context.packageName, R.layout.widget_salah)
            views.setTextViewText(R.id.widget_prayer, widgetData.getString("next_prayer", "Next Salah"))
            views.setTextViewText(R.id.widget_time, widgetData.getString("next_prayer_time", "--:--"))
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}

class VerseWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        appWidgetIds.forEach { id ->
            val views = RemoteViews(context.packageName, R.layout.widget_verse)
            views.setTextViewText(R.id.widget_verse_arabic, widgetData.getString("verse_arabic", "وَقُلْ رَبِّ زِدْنِي عِلْمًا"))
            views.setTextViewText(R.id.widget_verse_translation, widgetData.getString("verse_translation", "My Lord, increase me in knowledge."))
            views.setTextViewText(R.id.widget_verse_reference, widgetData.getString("verse_reference", "Quran 20:114"))
            appWidgetManager.updateAppWidget(id, views)
        }
    }
}
