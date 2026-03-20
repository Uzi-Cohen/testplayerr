package com.streamking.app;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePlayer")
public class NativePlayerPlugin extends Plugin {

    /**
     * Open the native fullscreen player with the given embed URL.
     * Call from JS: NativePlayer.open({ url: 'https://...' })
     */
    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        Intent intent = new Intent(getActivity(), NativePlayerActivity.class);
        intent.putExtra("url", url);
        getActivity().startActivity(intent);
        call.resolve();
    }
}
