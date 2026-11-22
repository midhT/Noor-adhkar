package com.noor.adhkar;

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NoorWidgetsPlugin.class);
        registerPlugin(NaseemUpdaterPlugin.class);
        registerPlugin(NaseemMediaPlugin.class);
        super.onCreate(savedInstanceState);
        requestHighRefreshRate();

        // An older PWA service worker may cache index.html and the very script that would
        // unregister it. Clean the app-scoped cache from the native launcher after WebView
        // startup, then reload the freshly packaged APK assets. Never touch localStorage.
        WebView webView = getBridge().getWebView();
        webView.postDelayed(() -> webView.evaluateJavascript(
            "(function(){"
                + "try{"
                + "if(window.__naseemNativeSwCleanup||!('serviceWorker' in navigator))return;"
                + "window.__naseemNativeSwCleanup=true;"
                + "navigator.serviceWorker.getRegistrations().then(function(registrations){"
                + "if(!registrations.length)return;"
                + "return Promise.all(registrations.map(function(registration){return registration.unregister();}))"
                + ".then(function(){return navigator.serviceWorker.getRegistrations();})"
                + ".then(function(remaining){if(remaining.length)return; if(!window.caches)return []; return caches.keys();})"
                + ".then(function(keys){return Promise.all((keys||[]).filter(function(key){return key.indexOf('noor-adhkar-cache-')===0;}).map(function(key){return caches.delete(key);}));})"
                + ".then(function(){window.location.reload();});"
                + "}).catch(function(){});"
                + "}catch(error){}"
                + "})()",
            null
        ), 1500);
    }

    @Override
    public void onResume() {
        super.onResume();
        requestHighRefreshRate();
    }

    /** Ask Android for the display's fastest mode (e.g. 120 Hz) so animations are not held at 60. */
    private void requestHighRefreshRate() {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
            Window window = getWindow();
            Display display = getWindowManager().getDefaultDisplay();
            Display.Mode best = null;
            Display.Mode cur = display.getMode();
            for (Display.Mode m : display.getSupportedModes()) {
                if (m.getPhysicalWidth() != cur.getPhysicalWidth() || m.getPhysicalHeight() != cur.getPhysicalHeight()) continue;
                if (best == null || m.getRefreshRate() > best.getRefreshRate()) best = m;
            }
            WindowManager.LayoutParams lp = window.getAttributes();
            if (best != null) {
                lp.preferredDisplayModeId = best.getModeId();
                lp.preferredRefreshRate = best.getRefreshRate();
            }
            window.setAttributes(lp);
        } catch (Throwable ignored) { }
    }
}
