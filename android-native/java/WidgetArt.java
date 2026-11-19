package com.noor.adhkar;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

/**
 * Draws the Naseem widget artwork natively: a charcoal glass card with an emerald glow, a tick-ring dial
 * and a rounded progress bar. RemoteViews cannot blur or draw gradients, so these are rendered as small
 * bitmaps (capped in size to stay far below the RemoteViews memory limit).
 */
final class WidgetArt {
    private static final float MAX_CARD_PIXELS = 300000f;

    private WidgetArt() {}

    /** Colours resolved from the saved widget theme and accent. */
    static final class Style {
        boolean light;
        int glow;
        int bright;
        int fg;
        int muted;
    }

    static Style style(Context c) {
        SharedPreferences p = NoorWidgetStore.prefs(c);
        String theme = p.getString(NoorWidgetStore.WIDGET_THEME, "dark");
        String accent = p.getString(NoorWidgetStore.WIDGET_ACCENT, "emerald");
        Style s = new Style();
        s.light = "light".equals(theme);
        if ("blue".equals(accent)) {
            s.glow = 0xFF2F6FD0;
            s.bright = s.light ? 0xFF2458A8 : 0xFF86B6F6;
        } else if ("silver".equals(accent)) {
            s.glow = 0xFF8B98A3;
            s.bright = s.light ? 0xFF55626C : 0xFFD6DEE4;
        } else {
            s.glow = 0xFF1F9D6B;
            s.bright = s.light ? 0xFF1B7A51 : 0xFF63D6A0;
        }
        s.fg = s.light ? 0xFF1D2822 : 0xFFF4F7F2;
        s.muted = s.light ? 0xFF5B6760 : 0xFF9BA59F;
        return s;
    }

    static int withAlpha(int color, int alpha) {
        return (color & 0x00FFFFFF) | ((Math.max(0, Math.min(255, alpha))) << 24);
    }

    private static void glow(Canvas cv, float x, float y, float radius, int color, Paint p) {
        p.setShader(new RadialGradient(x, y, radius, color, withAlpha(color, 0), Shader.TileMode.CLAMP));
        cv.drawRect(0, 0, cv.getWidth(), cv.getHeight(), p);
        p.setShader(null);
    }

    /** Rounded glass card. {@code cornerGlow} puts the light in the upper-right and lower-left instead of rising from the bottom. */
    static Bitmap card(Context c, int wDp, int hDp, Style s, boolean cornerGlow) {
        float d = c.getResources().getDisplayMetrics().density;
        float w = Math.max(80, wDp) * d;
        float h = Math.max(60, hDp) * d;
        float scale = (float) Math.min(1.0, Math.sqrt(MAX_CARD_PIXELS / (w * h)));
        int bw = Math.max(1, Math.round(w * scale));
        int bh = Math.max(1, Math.round(h * scale));
        float r = 26f * d * scale;
        Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        Path clip = new Path();
        clip.addRoundRect(new RectF(0, 0, bw, bh), r, r, Path.Direction.CW);
        cv.save();
        cv.clipPath(clip);
        p.setShader(new LinearGradient(0, 0, 0, bh,
            s.light ? 0xFFF7F9F5 : 0xFF191C1D, s.light ? 0xFFE7EDE6 : 0xFF0B0D0D, Shader.TileMode.CLAMP));
        cv.drawRect(0, 0, bw, bh, p);
        p.setShader(null);

        int strong = s.light ? 0x78 : 0xC0;
        if (cornerGlow) {
            glow(cv, bw * 0.90f, bh * 0.10f, Math.max(bw, bh) * 0.70f, withAlpha(s.glow, strong * 7 / 10), p);
            glow(cv, bw * 0.05f, bh * 1.00f, Math.max(bw, bh) * 0.55f, withAlpha(s.glow, strong * 4 / 10), p);
        } else {
            glow(cv, bw * 0.5f, bh * 1.10f, Math.max(bw * 0.80f, bh * 0.95f), withAlpha(s.glow, strong), p);
            glow(cv, bw * 0.5f, bh * 1.00f, Math.max(bw * 0.35f, bh * 0.45f), withAlpha(s.bright, strong / 3), p);
        }
        cv.restore();

        Paint st = new Paint(Paint.ANTI_ALIAS_FLAG);
        st.setStyle(Paint.Style.STROKE);
        float sw = Math.max(1f, 1.2f * d * scale);
        st.setStrokeWidth(sw);
        st.setShader(new LinearGradient(0, 0, 0, bh,
            s.light ? 0xA0FFFFFF : 0x44FFFFFF, withAlpha(s.glow, s.light ? 0x60 : 0x80), Shader.TileMode.CLAMP));
        cv.drawRoundRect(new RectF(sw / 2, sw / 2, bw - sw / 2, bh - sw / 2), r - sw / 2, r - sw / 2, st);
        return bmp;
    }

    /** Tick-ring dial: ticks up to {@code progress} (0..1) are lit and a needle marks the position. */
    static Bitmap dial(Context c, int sizeDp, float progress, Style s) {
        float d = c.getResources().getDisplayMetrics().density;
        int px = Math.min(420, Math.max(120, Math.round(sizeDp * d)));
        Bitmap bmp = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        float cx = px / 2f;
        float cy = px / 2f;
        float r = px / 2f;
        float pr = Math.max(0f, Math.min(1f, progress));
        Paint t = new Paint(Paint.ANTI_ALIAS_FLAG);
        t.setStrokeCap(Paint.Cap.ROUND);
        final int n = 72;
        for (int i = 0; i <= n; i++) {
            float frac = i / (float) n;
            double a = Math.toRadians(135.0 + 270.0 * frac);
            boolean major = i % 6 == 0;
            float inner = r * (major ? 0.82f : 0.88f);
            float outer = r * 0.96f;
            t.setStrokeWidth(px * (major ? 0.014f : 0.009f));
            t.setColor(frac <= pr ? s.bright : withAlpha(s.fg, s.light ? 0x40 : 0x3A));
            cv.drawLine(cx + (float) Math.cos(a) * inner, cy + (float) Math.sin(a) * inner,
                cx + (float) Math.cos(a) * outer, cy + (float) Math.sin(a) * outer, t);
        }
        double na = Math.toRadians(135.0 + 270.0 * pr);
        t.setStrokeWidth(px * 0.008f);
        t.setColor(withAlpha(s.fg, 0xE6));
        cv.drawLine(cx + (float) Math.cos(na) * r * 0.70f, cy + (float) Math.sin(na) * r * 0.70f,
            cx + (float) Math.cos(na) * r * 0.99f, cy + (float) Math.sin(na) * r * 0.99f, t);
        return bmp;
    }

    /** Rounded progress bar with an accent gradient fill. */
    static Bitmap bar(Context c, int wDp, float progress, Style s) {
        float d = c.getResources().getDisplayMetrics().density;
        int bw = Math.min(600, Math.max(40, Math.round(wDp * d)));
        int bh = Math.max(6, Math.round(6 * d));
        Bitmap bmp = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(bmp);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        float rad = bh / 2f;
        p.setColor(withAlpha(s.fg, s.light ? 0x26 : 0x24));
        cv.drawRoundRect(new RectF(0, 0, bw, bh), rad, rad, p);
        float pr = Math.max(0f, Math.min(1f, progress));
        if (pr > 0f) {
            float fw = Math.max(bh, bw * pr);
            p.setShader(new LinearGradient(0, 0, fw, 0, s.glow, s.bright, Shader.TileMode.CLAMP));
            cv.drawRoundRect(new RectF(0, 0, fw, bh), rad, rad, p);
            p.setShader(null);
        }
        return bmp;
    }
}
