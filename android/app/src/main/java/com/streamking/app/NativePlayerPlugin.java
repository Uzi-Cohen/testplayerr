package com.streamking.app;

import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativePlayer")
public class NativePlayerPlugin extends Plugin {

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
