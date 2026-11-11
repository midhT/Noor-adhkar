package com.noor.adhkar;

import android.content.Context;
import android.content.SharedPreferences;

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

    private NoorWidgetStore() {}

    static SharedPreferences prefs(Context c) {
        return c.getApplicationContext().getSharedPreferences(FILE, Context.MODE_PRIVATE);
    }
}
