package com.noor.adhkar;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import android.database.Cursor;


import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NaseemUpdater")
public class NaseemUpdaterPlugin extends Plugin {
    private DownloadManager manager;
    private BroadcastReceiver receiver;
    private final ExecutorService verifier = Executors.newSingleThreadExecutor();

    @Override
    public void load() {
        manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        receiver = new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (id < 0) return;
                DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
                try (Cursor cursor = manager.query(query)) {
                    if (cursor == null || !cursor.moveToFirst()) return;
                    int statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                    int status = statusCol >= 0 ? cursor.getInt(statusCol) : -1;
                    JSObject data = new JSObject();
                    data.put("downloadId", String.valueOf(id));
                    data.put("success", status == DownloadManager.STATUS_SUCCESSFUL);
                    if (status != DownloadManager.STATUS_SUCCESSFUL) {
                        int reasonCol = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                        data.put("reason", reasonCol >= 0 ? cursor.getInt(reasonCol) : -1);
                    }
                    notifyListeners("downloadComplete", data);
                }
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) getContext().registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        else getContext().registerReceiver(receiver, filter);
    }

    @PluginMethod
    public void downloadApk(PluginCall call) {
        String value = call.getString("url", "");
        Uri uri = Uri.parse(value);
        if (!"https".equals(uri.getScheme()) || !"github.com".equals(uri.getHost()) ||
            !uri.getPath().contains("/releases/download/") || !uri.getPath().endsWith(".apk")) {
            call.reject("Only an official GitHub release APK can be downloaded."); return;
        }
        try {
            DownloadManager.Request request = new DownloadManager.Request(uri)
                .setTitle("Naseem update")
                .setDescription("Downloading the official Naseem Android update")
                .setMimeType("application/vnd.android.package-archive")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setAllowedOverMetered(true).setAllowedOverRoaming(false)
                .setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "naseem-update.apk");
            long id = manager.enqueue(request);
            JSObject result = new JSObject(); result.put("downloadId", String.valueOf(id));
            call.resolve(result);
        } catch (Exception error) { call.reject("Could not start the APK download.", error); }
    }

    private long parseDownloadId(String value) {
        try { return Long.parseLong(value); } catch (Exception ignored) { return -1L; }
    }

    @PluginMethod
    public void downloadStatus(PluginCall call) {
        long id = parseDownloadId(call.getString("downloadId", ""));
        if (id < 0 || manager == null) { call.reject("No update download was selected."); return; }
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
        try (Cursor cursor = manager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) { call.reject("The update download was not found."); return; }
            int col = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            int status = col >= 0 ? cursor.getInt(col) : -1;
            JSObject result = new JSObject();
            result.put("complete", status == DownloadManager.STATUS_SUCCESSFUL);
            result.put("failed", status == DownloadManager.STATUS_FAILED);
            if (status == DownloadManager.STATUS_FAILED) {
                int reasonCol = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                result.put("reason", reasonCol >= 0 ? cursor.getInt(reasonCol) : -1);
            }
            call.resolve(result);
        } catch (Exception error) { call.reject("Could not check the APK download status.", error); }
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        long id = parseDownloadId(call.getString("downloadId", ""));
        String expectedSha = call.getString("sha256", "");
        if (id < 0 || manager == null) { call.reject("No downloaded update was selected."); return; }
        if (expectedSha == null || !expectedSha.matches("(?i)[0-9a-f]{64}")) { call.reject("The official release SHA-256 checksum is missing or invalid."); return; }
        verifier.execute(() -> {
            try {
                DownloadManager.Query query = new DownloadManager.Query().setFilterById(id);
                Uri apk = null;
                try (Cursor cursor = manager.query(query)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int col = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        if (col < 0 || cursor.getInt(col) != DownloadManager.STATUS_SUCCESSFUL) {
                            call.reject("The APK download has not completed successfully."); return;
                        }
                        apk = manager.getUriForDownloadedFile(id);
                    }
                }
                if (apk == null) { call.reject("The downloaded APK could not be found."); return; }
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                try (InputStream input = getContext().getContentResolver().openInputStream(apk)) {
                    if (input == null) { call.reject("The downloaded APK could not be read."); return; }
                    byte[] buffer = new byte[8192]; int count;
                    while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
                }
                StringBuilder actualSha = new StringBuilder();
                for (byte value : digest.digest()) actualSha.append(String.format(java.util.Locale.ROOT, "%02x", value & 0xff));
                if (!actualSha.toString().equalsIgnoreCase(expectedSha)) { call.reject("APK checksum verification failed. The update was not opened."); return; }
                Uri verifiedApk = apk;
                getActivity().runOnUiThread(() -> {
                    try {
                        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
                            Intent settings = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + getContext().getPackageName()));
                            settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            getContext().startActivity(settings);
                            JSObject result = new JSObject(); result.put("needsPermission", true); call.resolve(result); return;
                        }
                        Intent install = new Intent(Intent.ACTION_VIEW);
                        install.setDataAndType(verifiedApk, "application/vnd.android.package-archive");
                        install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        getContext().startActivity(install);
                        JSObject result = new JSObject(); result.put("openedInstaller", true); call.resolve(result);
                    } catch (Exception error) { call.reject("Android could not open the package installer.", error); }
                });
            } catch (Exception error) { call.reject("Could not verify the downloaded APK.", error); }
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (receiver != null) {
            try { getContext().unregisterReceiver(receiver); } catch (Exception ignored) { }
            receiver = null;
        }
        verifier.shutdownNow();
        super.handleOnDestroy();
    }
}
