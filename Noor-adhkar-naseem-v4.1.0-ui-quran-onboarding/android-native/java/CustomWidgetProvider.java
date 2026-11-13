package com.noor.adhkar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;
import java.util.Calendar;

/** User-composed home-screen widget. Content blocks and density are selected in Widget Studio. */
public class CustomWidgetProvider extends AppWidgetProvider {
    static final String ACTION_COUNT = "com.noor.adhkar.CUSTOM_WIDGET_COUNT";
    @Override public void onReceive(Context c, Intent i) {
        super.onReceive(c,i);
        if(i!=null && ACTION_COUNT.equals(i.getAction())) {
            synchronized(NoorWidgetStore.LOCK) { SharedPreferences p=NoorWidgetStore.prefs(c); p.edit()
                .putInt(NoorWidgetStore.TASBEEH_COUNT,p.getInt(NoorWidgetStore.TASBEEH_COUNT,0)+1)
                .putInt(NoorWidgetStore.TASBEEH_PENDING,p.getInt(NoorWidgetStore.TASBEEH_PENDING,0)+1).apply(); }
            refreshAll(c);
        }
    }
    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        RemoteViews v = build(c); for (int id : ids) m.updateAppWidget(id, v);
    }
    static void refreshAll(Context c) {
        AppWidgetManager m=AppWidgetManager.getInstance(c);
        int[] ids=m.getAppWidgetIds(new ComponentName(c, CustomWidgetProvider.class));
        if(ids==null||ids.length==0)return; RemoteViews v=build(c);
        for(int id:ids)m.updateAppWidget(id,v);
    }
    private static RemoteViews build(Context c) {
        SharedPreferences p=NoorWidgetStore.prefs(c);
        String blocks=p.getString(NoorWidgetStore.CUSTOM_WIDGET_BLOCKS,"prayer,tasbeeh,hijri");
        String density=p.getString(NoorWidgetStore.CUSTOM_WIDGET_LAYOUT,"comfortable");
        String dua=p.getString(NoorWidgetStore.CUSTOM_WIDGET_DUA,"Read a daily dua in Naseem");
        RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.widget_custom);
        int[] ids={R.id.cw_prayer,R.id.cw_tasbeeh,R.id.cw_hijri,R.id.cw_dua};
        String[] keys={"prayer","tasbeeh","hijri","dua"};
        for(int i=0;i<ids.length;i++)v.setViewVisibility(ids[i],blocks.contains(keys[i])?View.VISIBLE:View.GONE);
        v.setTextViewText(R.id.cw_dua,dua);
        try {
            JSONObject root=new JSONObject(p.getString(NoorWidgetStore.PRAYER_JSON,"{}"));
            Calendar now=Calendar.getInstance(); String key=String.format(java.util.Locale.US,"%04d-%02d-%02d",now.get(Calendar.YEAR),now.get(Calendar.MONTH)+1,now.get(Calendar.DAY_OF_MONTH));
            JSONObject today=root.optJSONObject(key); if(today==null)today=root;
            v.setTextViewText(R.id.cw_prayer,"Fajr "+today.optString("fajr","--")+"  ·  Dhuhr "+today.optString("dhuhr","--")+"  ·  Asr "+today.optString("asr","--"));
        } catch(Exception ignored) { v.setTextViewText(R.id.cw_prayer,"Prayer times · open Naseem to sync"); }
        int count=p.getInt(NoorWidgetStore.TASBEEH_COUNT,0),target=Math.max(1,p.getInt(NoorWidgetStore.TASBEEH_TARGET,100));
        v.setTextViewText(R.id.cw_tasbeeh,p.getString(NoorWidgetStore.TASBEEH_NAME,"Tasbeeh")+" · "+count+" / "+target);
        v.setTextViewText(R.id.cw_hijri,p.getString(NoorWidgetStore.HIJRI_DATE,"Open Naseem to sync Hijri date"));
        boolean compact="compact".equals(density);
        NoorWidgetStore.applyStyle(c,v,R.id.cw_root,R.id.cw_title,new int[]{R.id.cw_prayer,R.id.cw_tasbeeh,R.id.cw_hijri,R.id.cw_dua,R.id.cw_footer});
        v.setViewPadding(R.id.cw_root,compact?8:14,compact?8:14,compact?8:14,compact?8:14);
        if("count".equals(p.getString(NoorWidgetStore.CUSTOM_WIDGET_ACTION,"open")) && blocks.contains("tasbeeh")) {
            Intent countIntent=new Intent(c,CustomWidgetProvider.class).setAction(ACTION_COUNT);
            v.setOnClickPendingIntent(R.id.cw_tasbeeh,PendingIntent.getBroadcast(c,62,countIntent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        }
        Intent launch=c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if(launch!=null)v.setOnClickPendingIntent(R.id.cw_root,PendingIntent.getActivity(c,61,launch,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        return v;
    }
}
