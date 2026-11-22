package com.noor.adhkar;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Shader;
import android.graphics.drawable.Icon;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Foreground media service for Quran recitation. While the app is open the audio plays in the WebView and this service
 * owns the media notification, the lock-screen controls and the MediaSession. When the app goes to the background the
 * web player hands the rest of the recitation over (A_HANDOFF) and this service keeps playing it with a native
 * MediaPlayer, because WebView audio is not reliable in the background. When the app comes back, reclaim() returns
 * the exact position and the web player continues from there.
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
    static final String A_HANDOFF = "com.noor.adhkar.media.HANDOFF";
    private static final long PAUSED_TIMEOUT_MS = 30L * 60L * 1000L;

    static volatile boolean running = false;
    static volatile NaseemMediaService instance;

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

    // ---- native playback (background) ----
    private MediaPlayer player;
    private String[] urls = new String[0];
    private String[] artists = new String[0];
    private long[] marks = new long[0];          // ayah start offsets inside one long file (word-synced reciter)
    private int entryIdx = 0;
    private boolean nativeMode = false, nativePrepared = false, wantPlay = false, nativeEnded = false, sleepAtEnd = false;
    private String endReason = "";
    private long stopAtMs = -1, sleepAtEpoch = -1;
    private AudioManager audioManager;
    private AudioManager.OnAudioFocusChangeListener focusListener;
    private boolean noisyRegistered = false;
    private final BroadcastReceiver noisyReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { if (nativeMode) nativePause(); }
    };
    private final Runnable tick = new Runnable() {
        @Override public void run() { onTick(); }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        running = true;
        instance = this;
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
            @Override public void onPlay() { control("play", 0); }
            @Override public void onPause() { control("pause", 0); }
            @Override public void onSkipToNext() { control("next", 0); }
            @Override public void onSkipToPrevious() { control("prev", 0); }
            @Override public void onStop() { control("stop", 0); }
            @Override public void onSeekTo(long pos) { control("seek", pos); }
        });
        session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setActive(true);
        // A foreground service must call startForeground promptly after being started.
        startForegroundCompat(buildNotification());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (A_HANDOFF.equals(action)) {
            beginNative(intent);
        } else if (A_UPDATE.equals(action)) {
            if (nativeMode) return START_NOT_STICKY;   // the native player is the source of truth while it is active
            title = orDefault(intent.getStringExtra("title"), title);
            artist = orDefault(intent.getStringExtra("artist"), artist);
            artText = orDefault(intent.getStringExtra("artText"), artText);
            playing = intent.getBooleanExtra("playing", false);
            positionMs = Math.max(0, intent.getLongExtra("positionMs", 0));
            durationMs = Math.max(0, intent.getLongExtra("durationMs", 0));
            stateAt = SystemClock.elapsedRealtime();
            refresh();
        } else if (A_PLAY.equals(action)) control("play", 0);
        else if (A_PAUSE.equals(action)) control("pause", 0);
        else if (A_NEXT.equals(action)) control("next", 0);
        else if (A_PREV.equals(action)) control("prev", 0);
        else if (A_STOP.equals(action)) control("stop", 0);
        return START_NOT_STICKY;
    }

    private static String orDefault(String value, String fallback) { return value == null || value.isEmpty() ? fallback : value; }


    /** Notification / lock-screen / headset buttons: handled here while native playback is active, otherwise by the web player. */
    private void control(String action, long pos) {
        if (!nativeMode) {
            NaseemMediaPlugin.dispatch(action, pos);
            if ("stop".equals(action)) shutdown();
            return;
        }
        switch (action) {
            case "play": nativePlay(); break;
            case "pause": nativePause(); break;
            case "next": nativeStep(1); break;
            case "prev": nativeStep(-1); break;
            case "seek": nativeSeek(pos); break;
            case "stop":
                endNative();
                NaseemMediaPlugin.dispatch("stop", 0);
                shutdown();
                break;
            default: break;
        }
    }

    // ------------------------------------------------------------------ native playback

    private void beginNative(Intent intent) {
        String[] u = intent.getStringArrayExtra("urls");
        if (u == null || u.length == 0) return;
        String[] a = intent.getStringArrayExtra("artists");
        urls = u;
        artists = a == null ? new String[0] : a;
        long[] m = intent.getLongArrayExtra("marks");
        marks = m == null ? new long[0] : m;
        entryIdx = Math.max(0, Math.min(urls.length - 1, intent.getIntExtra("index", 0)));
        stopAtMs = intent.getLongExtra("stopAtMs", -1);
        sleepAtEpoch = intent.getLongExtra("sleepAtMs", -1);
        sleepAtEnd = intent.getBooleanExtra("sleepAtEnd", false);
        title = orDefault(intent.getStringExtra("title"), title);
        artText = orDefault(intent.getStringExtra("artText"), artText);
        nativeMode = true;
        nativeEnded = false;
        endReason = "";
        wantPlay = intent.getBooleanExtra("playing", true);
        if (wantPlay) requestFocus();
        registerNoisy();
        openEntry(entryIdx, Math.max(0, intent.getLongExtra("positionMs", 0)));
    }

    private void openEntry(int index, long startMs) {
        releasePlayer();
        entryIdx = index;
        nativePrepared = false;
        artist = entryIdx < artists.length ? orDefault(artists[entryIdx], artist) : artist;
        positionMs = startMs;
        durationMs = 0;
        stateAt = SystemClock.elapsedRealtime();
        playing = wantPlay;
        refresh();
        try {
            MediaPlayer mp = new MediaPlayer();
            player = mp;
            mp.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
            mp.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            mp.setOnPreparedListener(prepared -> {
                if (prepared != player) return;
                nativePrepared = true;
                durationMs = Math.max(0, prepared.getDuration());
                if (startMs > 0) prepared.seekTo((int) startMs);
                if (wantPlay) prepared.start();
                stateAt = SystemClock.elapsedRealtime();
                refresh();
                handler.removeCallbacks(tick);
                handler.postDelayed(tick, 400);
            });
            mp.setOnCompletionListener(done -> { if (done == player) onEntryDone(); });
            mp.setOnErrorListener((failed, what, extra) -> {
                if (failed == player) finishNative("error");
                return true;
            });
            mp.setDataSource(urls[entryIdx]);
            mp.prepareAsync();
        } catch (Exception e) {
            finishNative("error");
        }
    }

    private void onEntryDone() {
        if (entryIdx + 1 < urls.length) {
            openEntry(entryIdx + 1, 0);
        } else {
            finishNative(sleepAtEnd ? "sleep" : "queue");
        }
    }

    private void finishNative(String reason) {
        wantPlay = false;
        playing = false;
        nativeEnded = true;
        endReason = reason;
        if (durationMs > 0 && "queue".equals(reason)) positionMs = durationMs;
        releasePlayer();
        abandonFocus();
        handler.removeCallbacks(tick);
        stateAt = SystemClock.elapsedRealtime();
        refresh();
    }

    private void nativePlay() {
        if (nativeEnded) return;
        wantPlay = true;
        requestFocus();
        try { if (player != null && nativePrepared && !player.isPlaying()) player.start(); } catch (Exception ignored) { }
        playing = true;
        stateAt = SystemClock.elapsedRealtime();
        refresh();
        handler.removeCallbacks(tick);
        handler.postDelayed(tick, 400);
    }

    private void nativePause() {
        wantPlay = false;
        try { if (player != null && nativePrepared && player.isPlaying()) player.pause(); } catch (Exception ignored) { }
        playing = false;
        readPosition();
        stateAt = SystemClock.elapsedRealtime();
        refresh();
    }

    private void readPosition() {
        try { if (player != null && nativePrepared) positionMs = player.getCurrentPosition(); } catch (Exception ignored) { }
    }

    private void nativeSeek(long pos) {
        try { if (player != null && nativePrepared) player.seekTo((int) Math.max(0, pos)); } catch (Exception ignored) { }
        positionMs = Math.max(0, pos);
        stateAt = SystemClock.elapsedRealtime();
        refresh();
    }

    /** Next / previous: the next ayah inside one long file (marks), or the next file of a per-ayah queue. */
    private void nativeStep(int dir) {
        readPosition();
        if (marks.length > 0) {
            long pos = positionMs;
            int at = 0;
            for (int i = 0; i < marks.length; i++) if (marks[i] <= pos + 60) at = i;
            int target = dir > 0 ? Math.min(marks.length - 1, at + 1) : (pos - marks[at] > 1500 ? at : Math.max(0, at - 1));
            nativeSeek(marks[target]);
            return;
        }
        int target = entryIdx + dir;
        if (target < 0) target = 0;
        if (target >= urls.length) return;
        nativeEnded = false;
        openEntry(target, 0);
    }

    private void onTick() {
        if (!nativeMode || nativeEnded || player == null) return;
        readPosition();
        if (stopAtMs > 0 && nativePrepared && positionMs >= stopAtMs - 40) {
            nativePause();
            finishNative("sleep");
            return;
        }
        if (sleepAtEpoch > 0) {
            long left = sleepAtEpoch - System.currentTimeMillis();
            if (left <= 0) {
                nativePause();
                finishNative("sleep");
                return;
            }
            if (left < 3000) {
                float volume = Math.max(0f, left / 3000f);
                try { player.setVolume(volume, volume); } catch (Exception ignored) { }
            }
        }
        handler.postDelayed(tick, 400);
    }

    private void releasePlayer() {
        handler.removeCallbacks(tick);
        MediaPlayer mp = player;
        player = null;
        nativePrepared = false;
        if (mp != null) {
            try { mp.setOnPreparedListener(null); mp.setOnCompletionListener(null); mp.setOnErrorListener(null); mp.reset(); } catch (Exception ignored) { }
            try { mp.release(); } catch (Exception ignored) { }
        }
    }

    private void endNative() {
        nativeMode = false;
        wantPlay = false;
        releasePlayer();
        abandonFocus();
        if (noisyRegistered) { try { unregisterReceiver(noisyReceiver); } catch (Exception ignored) { } noisyRegistered = false; }
    }

    private void registerNoisy() {
        if (noisyRegistered) return;
        try { registerReceiver(noisyReceiver, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)); noisyRegistered = true; } catch (Exception ignored) { }
    }

    @SuppressWarnings("deprecation")
    private void requestFocus() {
        try {
            if (audioManager == null) audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (focusListener == null) {
                focusListener = change -> {
                    if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                        if (nativeMode) nativePause();
                    }
                };
            }
            if (audioManager != null) audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        } catch (Exception ignored) { }
    }

    @SuppressWarnings("deprecation")
    private void abandonFocus() {
        try { if (audioManager != null && focusListener != null) audioManager.abandonAudioFocus(focusListener); } catch (Exception ignored) { }
    }

    /**
     * Called when the app is in front again: stops native playback and reports where it got to.
     * Result: [active, entryIndex, positionMs, wasPlaying, ended, reason(0 none,1 queue,2 sleep,3 error)].
     */
    static long[] reclaim() {
        final NaseemMediaService service = instance;
        final long[] out = new long[6];
        if (service == null) return out;
        final CountDownLatch latch = new CountDownLatch(1);
        service.handler.post(() -> {
            try {
                if (service.nativeMode) {
                    service.readPosition();
                    out[0] = 1;
                    out[1] = service.entryIdx;
                    out[2] = service.positionMs;
                    out[3] = (service.playing && !service.nativeEnded) ? 1 : 0;
                    out[4] = service.nativeEnded ? 1 : 0;
                    out[5] = "queue".equals(service.endReason) ? 1 : "sleep".equals(service.endReason) ? 2 : "error".equals(service.endReason) ? 3 : 0;
                    service.endNative();
                }
            } finally {
                latch.countDown();
            }
        });
        try { latch.await(1500, TimeUnit.MILLISECONDS); } catch (InterruptedException ignored) { }
        return out;
    }

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
        endNative();
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
        instance = null;
        endNative();
        handler.removeCallbacks(pausedTimeout);
        releaseWakeLock();
        if (session != null) { session.setActive(false); session.release(); session = null; }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
