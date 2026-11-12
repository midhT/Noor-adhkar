package com.noor.adhkar;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

/** Shared storage between the WebView app (through NoorWidgetsPlugin) and the home-screen widgets. */
final class NoorWidgetStore {
    static final Object LOCK = new Object();
    private static final String FILE = "noor_widgets";

    static final String PRAYER_JSON = "prayer_json";
    static final String TASBEEH_NAME = "tasbeeh_name";
    static final String TASBEEH_COUNT = "tasbeeh_count";
    static final String TASBEEH_TARGET = "tasbeeh_target";
    static final String TASBEEH_PENDING = "tasbeeh_pending";
    static final String HIJRI_DATE = "hijri_date";
    static final String WIDGET_THEME = "widget_theme";
    static final String WIDGET_ACCENT = "widget_accent";
    static final String WIDGET_DENSITY = "widget_density";
    static final String CUSTOM_WIDGET_BLOCKS = "custom_widget_blocks";
    static final String CUSTOM_WIDGET_LAYOUT = "custom_widget_layout";
    static final String CUSTOM_WIDGET_DUA = "custom_widget_dua";
    static final String CUSTOM_WIDGET_ACTION = "custom_widget_action";

    private NoorWidgetStore() {}

    static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }

    static void applyStyle(Context c, RemoteViews views, int rootId, int accentId, int[] textIds) {
        SharedPreferences p = prefs(c);
        String theme = p.getString(WIDGET_THEME, "dark");
        String accent = p.getString(WIDGET_ACCENT, "emerald");
        boolean compact = "compact".equals(p.getString(WIDGET_DENSITY, "comfortable"));
        int fg = "light".equals(theme) ? Color.rgb(29,40,34) : Color.rgb(243,246,241);
        int highlight = "blue".equals(accent) ? Color.rgb(111,164,238) : ("silver".equals(accent) ? Color.rgb(190,202,211) : Color.rgb(128,194,151));
        views.setInt(rootId, "setBackgroundResource", "light".equals(theme) ? R.drawable.noor_widget_bg_light : R.drawable.noor_widget_bg);
        views.setViewPadding(rootId, compact ? 9 : 15, compact ? 9 : 15, compact ? 9 : 15, compact ? 9 : 15);
        if (accentId != 0) views.setTextColor(accentId, highlight);
        if (textIds != null) for (int id : textIds) if (id != 0) views.setTextColor(id, fg);
    }
}
