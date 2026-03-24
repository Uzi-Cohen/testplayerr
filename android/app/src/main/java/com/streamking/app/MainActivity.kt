package com.streamking.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(NativePlayerPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
