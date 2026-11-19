package com.noor.adhkar;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Shader;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;

/**
 * Foreground media service for Quran recitation. The audio itself plays in the WebView; this service owns the
 * media notification, the lock-screen controls and the MediaSession, keeps the process alive while the screen is
 * off, and forwards button presses back to the web player through NaseemMediaPlugin.
 */
public class NaseemMediaService extends Service {
    static final String CHANNEL = "naseem-playback-v1";
    static final int NOTIFICATION_ID = 7421;
    static final String A_UPDATE = "com.noor.adhkar.media.UPDATE";
    static final String A_PLAY = "com.noor.adhkar.media.PLAY";
    static final String A_PAUSE = "com.noor.adhkar.media.PAUSE";
    static final String A_NEXT = "com.noor.adhkar.media.NEXT";
    static final String A_PREV = "com.noor.adhkar.media.PREV";
    static final String A_STOP = "com.noor.adhkar.media.STOP";
    private static final long PAUSED_TIMEOUT_MS = 30L * 60L * 1000L;

    static volatile boolean running = false;

    private MediaSession session;
    private NotificationManager notifications;
    private PowerManager.WakeLock wakeLock;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable pausedTimeout = new Runnable() {
        @Override public void run() {
            NaseemMediaPlugin.dispatch("stop", 0);
            shutdown();
        }
    };
    private boolean foreground = false;
    private String title = "Quran recitation";
    private String artist = "";
    private String artText = "";
    private boolean playing = false;
    private long positionMs = 0;
    private long durationMs = 0;
    private long stateAt = 0;
    private Bitmap art;
    private String artFor = "";

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        notifications = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL, "Quran recitation", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Playback controls for Quran recitation");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            notifications.createNotificationChannel(channel);
        }
        session = new MediaSession(this, "Naseem");
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { NaseemMediaPlugin.dispatch("play", 0); }
            @Override public void onPause() { NaseemMediaPlugin.dispatch("pause", 0); }
            @Override public void onSkipToNext() { NaseemMediaPlugin.dispatch("next", 0); }
            @Override public void onSkipToPrevious() { NaseemMediaPlugin.dispatch("prev", 0); }
            @Override public void onStop() { NaseemMediaPlugin.dispatch("stop", 0); }
            @Override public void onSeekTo(long pos) { NaseemMediaPlugin.dispatch("seek", pos); }
        });
        session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setActive(true);
        // A foreground service must call startForeground promptly after being started.
        startForegroundCompat(buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (A_UPDATE.equals(action)) {
            title = orDefault(intent.getStringExtra("title"), title);
            artist = orDefault(intent.getStringExtra("artist"), artist);
            artText = orDefault(intent.getStringExtra("artText"), artText);
            playing = intent.getBooleanExtra("playing", false);
            positionMs = Math.max(0, intent.getLongExtra("positionMs", 0));
            durationMs = Math.max(0, intent.getLongExtra("durationMs", 0));
            stateAt = SystemClock.elapsedRealtime();
            refresh();
        } else if (A_PLAY.equals(action)) NaseemMediaPlugin.dispatch("play", 0);
        else if (A_PAUSE.equals(action)) NaseemMediaPlugin.dispatch("pause", 0);
        else if (A_NEXT.equals(action)) NaseemMediaPlugin.dispatch("next", 0);
        else if (A_PREV.equals(action)) NaseemMediaPlugin.dispatch("prev", 0);
        else if (A_STOP.equals(action)) { NaseemMediaPlugin.dispatch("stop", 0); shutdown(); }
        return START_NOT_STICKY;
    }

    private static String orDefault(String value, String fallback) { return value == null || value.isEmpty() ? fallback : value; }

    private void refresh() {
        if (art == null || !artText.equals(artFor)) { art = makeArt(artText); artFor = artText; }
        session.setMetadata(new MediaMetadata.Builder()
            .putString(MediaMetadata.METADATA_KEY_TITLE, title)
            .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
            .putString(MediaMetadata.METADATA_KEY_ALBUM, "Naseem")
            .putLong(MediaMetadata.METADATA_KEY_DURATION, durationMs)
            .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, art)
            .build());
        long actions = PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
            | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_STOP | PlaybackState.ACTION_SEEK_TO;
        session.setPlaybackState(new PlaybackState.Builder()
            .setActions(actions)
            .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, positionMs, playing ? 1f : 0f, stateAt)
            .build());
        Notification n = buildNotification();
        if (!foreground) startForegroundCompat(n);
        else notifications.notify(NOTIFICATION_ID, n);
        handler.removeCallbacks(pausedTimeout);
        if (playing) acquireWakeLock(); else { releaseWakeLock(); handler.postDelayed(pausedTimeout, PAUSED_TIMEOUT_MS); }
    }

    private void startForegroundCompat(Notification n) {
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        else startForeground(NOTIFICATION_ID, n);
        foreground = true;
    }

    private PendingIntent actionIntent(String action, int code) {
        Intent intent = new Intent(this, NaseemMediaService.class).setAction(action);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getService(this, code, intent, flags);
    }

    private Notification buildNotification() {
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        int small = getResources().getIdentifier("ic_stat_naseem", "drawable", getPackageName());
        b.setSmallIcon(small != 0 ? small : android.R.drawable.ic_media_play);
        b.setContentTitle(title).setContentText(artist);
        if (art != null) b.setLargeIcon(art);
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            b.setContentIntent(PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        b.addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_previous), "Previous", actionIntent(A_PREV, 1)).build());
        if (playing) b.addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_pause), "Pause", actionIntent(A_PAUSE, 2)).build());
        else b.addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_play), "Play", actionIntent(A_PLAY, 3)).build());
        b.addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_media_next), "Next", actionIntent(A_NEXT, 4)).build());
        b.addAction(new Notification.Action.Builder(Icon.createWithResource(this, android.R.drawable.ic_menu_close_clear_cancel), "Stop", actionIntent(A_STOP, 5)).build());
        b.setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        b.setOngoing(true).setOnlyAlertOnce(true).setShowWhen(false);
        b.setCategory(Notification.CATEGORY_TRANSPORT).setVisibility(Notification.VISIBILITY_PUBLIC);
        return b.build();
    }

    /** Artwork for the notification and lock screen: the surah name in Arabic on a green gradient. */
    private static Bitmap makeArt(String text) {
        int size = 320;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setShader(new LinearGradient(0, 0, size, size, 0xFF22A877, 0xFF0A3B2A, Shader.TileMode.CLAMP));
        canvas.drawRect(0, 0, size, size, paint);
        paint.setShader(null);
        paint.setColor(Color.WHITE);
        paint.setTextAlign(Paint.Align.CENTER);
        String label = text == null || text.isEmpty() ? "القرآن" : text;
        float textSize = 120f;
        paint.setTextSize(textSize);
        float width = paint.measureText(label);
        float max = size * 0.84f;
        if (width > max) paint.setTextSize(textSize * max / width);
        Paint.FontMetrics fm = paint.getFontMetrics();
        canvas.drawText(label, size / 2f, size / 2f - (fm.ascent + fm.descent) / 2f, paint);
        return bitmap;
    }

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm == null) return;
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "naseem:recitation");
                wakeLock.setReferenceCounted(false);
            }
            if (!wakeLock.isHeld()) wakeLock.acquire(6L * 60L * 60L * 1000L);
        } catch (Exception ignored) { }
    }

    private void releaseWakeLock() {
        try { if (wakeLock != null && wakeLock.isHeld()) wakeLock.release(); } catch (Exception ignored) { }
    }

    private void shutdown() {
        handler.removeCallbacks(pausedTimeout);
        releaseWakeLock();
        stopForeground(true);
        foreground = false;
        stopSelf();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        shutdown();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacks(pausedTimeout);
        releaseWakeLock();
        if (session != null) { session.setActive(false); session.release(); session = null; }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
