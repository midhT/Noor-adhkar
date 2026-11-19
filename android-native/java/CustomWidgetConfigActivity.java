package com.noor.adhkar;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/** Per-instance settings for the Custom widget, shown when the widget is added or reconfigured. */
public class CustomWidgetConfigActivity extends Activity {
    private static final String[] BLOCK_KEYS = {"prayer", "tasbeeh", "hijri", "dua"};
    private static final String[] BLOCK_LABELS = {"Next prayer", "Tasbeeh counter", "Hijri date", "Personal reminder"};
    private static final int BG = 0xFF121514;
    private static final int FG = 0xFFF4F7F2;
    private static final int MUTED = 0xFF9BA59F;
    private static final int ACCENT = 0xFF63D6A0;

    private int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private final CheckBox[] boxes = new CheckBox[BLOCK_KEYS.length];
    private RadioButton comfortable;
    private RadioButton compact;
    private RadioButton openApp;
    private RadioButton countTap;
    private EditText dua;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);
        Intent intent = getIntent();
        if (intent != null && intent.getExtras() != null) {
            widgetId = intent.getExtras().getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }
        CustomWidgetProvider.Config cfg = CustomWidgetProvider.config(this, widgetId);
        int pad = NoorWidgetStore.dp(this, 20);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(pad, pad, pad, pad);
        col.setBackgroundColor(BG);

        col.addView(text("Custom widget", 20, FG, true));
        col.addView(text("This widget keeps its own settings.", 13, MUTED, false));

        col.addView(section("Content"));
        for (int i = 0; i < BLOCK_KEYS.length; i++) {
            boxes[i] = new CheckBox(this);
            boxes[i].setText(BLOCK_LABELS[i]);
            boxes[i].setTextColor(FG);
            boxes[i].setChecked(cfg.has(BLOCK_KEYS[i]));
            col.addView(boxes[i]);
        }

        col.addView(section("Spacing"));
        RadioGroup spacing = new RadioGroup(this);
        comfortable = radio("Comfortable", "comfortable".equals(cfg.layout));
        compact = radio("Compact", "compact".equals(cfg.layout));
        spacing.addView(comfortable);
        spacing.addView(compact);
        col.addView(spacing);

        col.addView(section("When tapped"));
        RadioGroup action = new RadioGroup(this);
        openApp = radio("Open Naseem", !"count".equals(cfg.action));
        countTap = radio("Count tasbeeh (tasbeeh line)", "count".equals(cfg.action));
        action.addView(openApp);
        action.addView(countTap);
        col.addView(action);

        col.addView(section("Personal reminder text"));
        dua = new EditText(this);
        dua.setTextColor(FG);
        dua.setHintTextColor(MUTED);
        dua.setHint("A reminder or dua you chose yourself");
        dua.setText(cfg.dua);
        dua.setFilters(new InputFilter[]{new InputFilter.LengthFilter(180)});
        col.addView(dua);

        Button save = new Button(this);
        save.setText("Save widget");
        save.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { save(); }
        });
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = NoorWidgetStore.dp(this, 18);
        lp.gravity = Gravity.CENTER_HORIZONTAL;
        col.addView(save, lp);

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        scroll.addView(col);
        setContentView(scroll);
    }

    private TextView text(String value, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        return t;
    }

    private TextView section(String title) {
        TextView t = text(title.toUpperCase(java.util.Locale.US), 11, ACCENT, true);
        t.setLetterSpacing(0.12f);
        t.setPadding(0, NoorWidgetStore.dp(this, 18), 0, NoorWidgetStore.dp(this, 4));
        return t;
    }

    private RadioButton radio(String label, boolean checked) {
        RadioButton r = new RadioButton(this);
        r.setText(label);
        r.setTextColor(FG);
        r.setId(View.generateViewId());
        r.setChecked(checked);
        return r;
    }

    private void save() {
        StringBuilder blocks = new StringBuilder();
        for (int i = 0; i < BLOCK_KEYS.length; i++) {
            if (boxes[i].isChecked()) {
                if (blocks.length() > 0) blocks.append(',');
                blocks.append(BLOCK_KEYS[i]);
            }
        }
        if (blocks.length() == 0) {
            Toast.makeText(this, "Choose at least one content block.", Toast.LENGTH_SHORT).show();
            return;
        }
        String reminder = dua.getText().toString().trim();
        if (blocks.indexOf("dua") >= 0 && reminder.isEmpty()) {
            Toast.makeText(this, "Enter the text for your personal reminder.", Toast.LENGTH_SHORT).show();
            return;
        }
        CustomWidgetProvider.Config cfg = new CustomWidgetProvider.Config();
        cfg.blocks = blocks.toString();
        cfg.layout = compact.isChecked() ? "compact" : "comfortable";
        cfg.action = countTap.isChecked() ? "count" : "open";
        cfg.dua = reminder.isEmpty() ? cfg.dua : reminder;
        CustomWidgetProvider.saveConfig(this, widgetId, cfg);
        CustomWidgetProvider.updateOne(this, AppWidgetManager.getInstance(this), widgetId);
        PrayerMath.scheduleRefresh(this);
        Intent result = new Intent();
        result.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        setResult(RESULT_OK, result);
        finish();
    }
}
