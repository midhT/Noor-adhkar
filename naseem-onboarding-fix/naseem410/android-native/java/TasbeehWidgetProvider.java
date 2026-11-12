package com.noor.adhkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Home-screen tasbeeh counter: tap the count to add one; taps are merged into the app the next time it opens. */
public class TasbeehWidgetProvider extends AppWidgetProvider {
    static final String ACTION_TAP = "com.noor.adhkar.TASBEEH_TAP";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        RemoteViews views = build(context);
        for (int id : appWidgetIds) manager.updateAppWidget(id, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_TAP.equals(intent.getAction())) {
            synchronized (NoorWidgetStore.LOCK) {
                SharedPreferences p = NoorWidgetStore.prefs(context);
                p.edit()
                    .putInt(NoorWidgetStore.TASBEEH_COUNT, p.getInt(NoorWidgetStore.TASBEEH_COUNT, 0) + 1)
                    .putInt(NoorWidgetStore.TASBEEH_PENDING, p.getInt(NoorWidgetStore.TASBEEH_PENDING, 0) + 1)
                    .apply();
            }
            refreshAll(context);
        }
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TasbeehWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static RemoteViews build(Context context) {
        SharedPreferences p = NoorWidgetStore.prefs(context);
        String name;
        int count, target;
        synchronized (NoorWidgetStore.LOCK) {
            name = p.getString(NoorWidgetStore.TASBEEH_NAME, "Tasbeeh");
            count = p.getInt(NoorWidgetStore.TASBEEH_COUNT, 0);
            target = Math.max(1, p.getInt(NoorWidgetStore.TASBEEH_TARGET, 100));
        }
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_tasbeeh);
        NoorWidgetStore.applyStyle(context, v, R.id.tw_root, R.id.tw_name, new int[]{R.id.tw_count,R.id.tw_target});
        v.setTextViewText(R.id.tw_name, name);
        v.setTextViewText(R.id.tw_count, String.valueOf(count));
        v.setTextViewText(R.id.tw_target, count >= target ? "Target reached" : "of " + target + " · tap to count");
        v.setProgressBar(R.id.tw_progress, 1000, Math.min(1000, (int) ((count * 1000L) / target)), false);

        Intent tap = new Intent(context, TasbeehWidgetProvider.class).setAction(ACTION_TAP);
        v.setOnClickPendingIntent(R.id.tw_count_area,
            PendingIntent.getBroadcast(context, 11, tap, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            v.setOnClickPendingIntent(R.id.tw_name,
                PendingIntent.getActivity(context, 12, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        return v;
    }
}
