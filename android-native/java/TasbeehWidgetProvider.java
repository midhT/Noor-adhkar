package com.noor.adhkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

/** Home-screen tasbeeh counter: tap the count to add one; taps are merged into the app the next time it opens. */
public class TasbeehWidgetProvider extends AppWidgetProvider {
    static final String ACTION_TAP = "com.noor.adhkar.TASBEEH_TAP";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        updateAll(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, manager, appWidgetId, newOptions);
        updateOne(context, manager, appWidgetId);
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
            CustomWidgetProvider.updateAll(context);
        }
    }

    static void refreshAll(Context context) {
        updateAll(context);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, TasbeehWidgetProvider.class));
        if (ids == null) return;
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        try {
            manager.updateAppWidget(id, build(context, manager, id));
        } catch (Exception ignored) { }
    }

    private static RemoteViews build(Context c, AppWidgetManager m, int id) {
        SharedPreferences p = NoorWidgetStore.prefs(c);
        String name, arabic;
        int count, target;
        synchronized (NoorWidgetStore.LOCK) {
            name = p.getString(NoorWidgetStore.TASBEEH_NAME, "Tasbeeh");
            arabic = p.getString(NoorWidgetStore.TASBEEH_ARABIC, "");
            count = p.getInt(NoorWidgetStore.TASBEEH_COUNT, 0);
            target = Math.max(1, p.getInt(NoorWidgetStore.TASBEEH_TARGET, 100));
        }
        int[] sz = NoorWidgetStore.sizeDp(m, id, 140, 140);
        WidgetArt.Style s = WidgetArt.style(c);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_tasbeeh);
        v.setImageViewBitmap(R.id.tw_bg, WidgetArt.card(c, sz[0], sz[1], s, false));
        NoorWidgetStore.applyDensity(c, v, R.id.tw_content, 16, 11);
        v.setTextColor(R.id.tw_name, s.fg);
        v.setTextColor(R.id.tw_arabic, s.muted);
        v.setTextColor(R.id.tw_count, s.fg);
        v.setTextColor(R.id.tw_target, count >= target ? s.bright : s.muted);
        v.setTextViewText(R.id.tw_name, name);
        v.setTextViewText(R.id.tw_arabic, arabic);
        v.setViewVisibility(R.id.tw_arabic, arabic.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.tw_count, String.valueOf(count));
        v.setTextViewText(R.id.tw_target, count >= target ? "Target reached" : "of " + target + " · tap to count");
        v.setImageViewBitmap(R.id.tw_bar, WidgetArt.bar(c, Math.max(60, sz[0] - 32), Math.min(1f, count / (float) target), s));

        Intent tap = new Intent(c, TasbeehWidgetProvider.class).setAction(ACTION_TAP);
        v.setOnClickPendingIntent(R.id.tw_count_area,
            PendingIntent.getBroadcast(c, 11, tap, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        NoorWidgetStore.bindOpenApp(c, v, R.id.tw_name, 12);
        return v;
    }
}
