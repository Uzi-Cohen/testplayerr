package com.streamking.app

import android.content.Intent
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "NativePlayer")
class NativePlayerPlugin : Plugin() {

    @PluginMethod
    fun open(call: PluginCall) {
        val url = call.getString("url")
        if (url.isNullOrEmpty()) {
            call.reject("url is required")
            return
        }
        val intent = Intent(activity, NativePlayerActivity::class.java).apply {
            putExtra("url", url)
            call.getString("title")?.let { putExtra("title", it) }
        }
        activity.startActivity(intent)
        call.resolve()
    }
}
