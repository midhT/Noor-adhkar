package com.noor.adhkar;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NoorWidgetsPlugin.class);
        registerPlugin(NaseemUpdaterPlugin.class);
        registerPlugin(NaseemMediaPlugin.class);
        super.onCreate(savedInstanceState);

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
}
