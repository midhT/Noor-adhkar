package com.midhat.noor

import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Home-screen widgets launch this activity with a "noor_tab" extra. Dart asks for it once at
 * start-up ("initialTab") and receives later taps while running ("openTab").
 */
class MainActivity : FlutterActivity() {
    private var channel: MethodChannel? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        val ch = MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "noor/launch")
        ch.setMethodCallHandler { call, result ->
            if (call.method == "initialTab") {
                val tab = takeTab(intent)
                result.success(if (tab >= 0) tab else null)
            } else {
                result.notImplemented()
            }
        }
        channel = ch
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val tab = takeTab(intent)
        if (tab >= 0) channel?.invokeMethod("openTab", tab)
    }

    private fun takeTab(i: Intent?): Int {
        if (i == null) return -1
        val t = i.getIntExtra("noor_tab", -1)
        i.removeExtra("noor_tab")
        return t
    }
}
