package com.noor.adhkar;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Bridge between the web Quran player and NaseemMediaService (notification, lock screen, background keep-alive). */
@CapacitorPlugin(
    name = "NaseemMedia",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class NaseemMediaPlugin extends Plugin {
    private static NaseemMediaPlugin instance;
    private boolean asked = false;

    @Override
    public void load() { instance = this; }

    /** Called by the service when a notification, lock-screen or headset button is pressed. */
    static void dispatch(String action, long positionMs) {
        NaseemMediaPlugin plugin = instance;
        if (plugin == null) return;
        JSObject data = new JSObject();
        data.put("action", action);
        data.put("positionMs", positionMs);
        plugin.notifyListeners("action", data);
    }

    @PluginMethod
    public void update(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && !asked && getPermissionState("notifications") != PermissionState.GRANTED) {
            asked = true;
            requestPermissionForAlias("notifications", call, "afterPermission");
            return;
        }
        send(call);
    }

    @PermissionCallback
    private void afterPermission(PluginCall call) { send(call); }

    private void send(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, NaseemMediaService.class).setAction(NaseemMediaService.A_UPDATE);
        intent.putExtra("title", call.getString("title", ""));
        intent.putExtra("artist", call.getString("artist", ""));
        intent.putExtra("artText", call.getString("artText", ""));
        intent.putExtra("playing", call.getBoolean("playing", false));
        Double position = call.getDouble("positionMs", 0d);
        Double duration = call.getDouble("durationMs", 0d);
        intent.putExtra("positionMs", position == null ? 0L : position.longValue());
        intent.putExtra("durationMs", duration == null ? 0L : duration.longValue());
        try {
            if (NaseemMediaService.running) context.startService(intent);
            else ContextCompat.startForegroundService(context, intent);
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try { getContext().stopService(new Intent(getContext(), NaseemMediaService.class)); } catch (Exception ignored) { }
        call.resolve();
    }
}
