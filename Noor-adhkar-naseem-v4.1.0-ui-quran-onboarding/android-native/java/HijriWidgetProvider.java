package com.noor.adhkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Simple Hijri date widget; date is calculated by the app's ICU/API calendar logic and synced locally. */
public class HijriWidgetProvider extends AppWidgetProvider {
    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, HijriWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }
    private static RemoteViews build(Context context) {
        String date;
        synchronized (NoorWidgetStore.LOCK) {
            SharedPreferences p = NoorWidgetStore.prefs(context);
            date = p.getString(NoorWidgetStore.HIJRI_DATE, "Open Naseem to sync the Hijri date");
        }
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_hijri);
        NoorWidgetStore.applyStyle(context, v, R.id.hw_root, R.id.hw_kicker, new int[]{R.id.hw_date});
        v.setTextViewText(R.id.hw_date, date);
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) v.setOnClickPendingIntent(R.id.hw_root, PendingIntent.getActivity(context, 21, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        return v;
    }
}
