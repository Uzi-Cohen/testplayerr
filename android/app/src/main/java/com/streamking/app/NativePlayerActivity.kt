package com.streamking.app

import android.app.Activity
import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import com.bitmovin.analytics.api.AnalyticsConfig
import com.bitmovin.analytics.api.SourceMetadata
import com.bitmovin.player.PlayerView
import com.bitmovin.player.api.Player
import com.bitmovin.player.api.analytics.AnalyticsPlayerConfig
import com.bitmovin.player.api.analytics.AnalyticsSourceConfig
import com.bitmovin.player.api.source.Source
import com.bitmovin.player.api.source.SourceConfig
import com.bitmovin.player.api.source.SourceType

class NativePlayerActivity : Activity() {

    private val analyticsLicenseKey = "e8501282-73fc-4df8-9922-1a7ef817cb78"
    private lateinit var playerView: PlayerView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        setContentView(R.layout.activity_player)

        val url = intent.getStringExtra("url") ?: ""
        val streamTitle = intent.getStringExtra("title") ?: "Stream"

        val analyticsConfig = AnalyticsConfig(
            licenseKey = analyticsLicenseKey,
        )
        val player = Player(
            context = this,
            analyticsConfig = AnalyticsPlayerConfig.Enabled(analyticsConfig),
        )

        playerView = findViewById(R.id.playerView)
        playerView.player = player

        val urlLower = url.lowercase()
        val sourceType = when {
            urlLower.contains(".mpd") || urlLower.contains("dash") || urlLower.contains("manifest") -> SourceType.Dash
            urlLower.contains(".m3u8") || urlLower.contains("m3u8") || urlLower.contains("hls") -> SourceType.Hls
            urlLower.contains(".mp4") || urlLower.contains(".mkv") || urlLower.contains(".avi") -> SourceType.Progressive
            else -> SourceType.Hls // most streaming URLs are HLS even without a file extension
        }

        val source = Source(
            SourceConfig(
                url = url,
                type = sourceType,
                title = streamTitle,
            ),
            AnalyticsSourceConfig.Enabled(
                SourceMetadata(
                    videoId = "stream-${System.currentTimeMillis()}",
                    title = streamTitle,
                )
            ),
        )

        player.load(source)
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            if (handleUserInput(event.keyCode)) {
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    private fun handleUserInput(keycode: Int): Boolean {
        val seekingOffsetSeconds = 15
        val player = playerView.player ?: return false
        return when (keycode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_NUMPAD_ENTER,
            KeyEvent.KEYCODE_SPACE,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                if (player.isPlaying) player.pause() else player.play()
                true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY -> {
                player.play()
                true
            }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                player.pause()
                true
            }
            KeyEvent.KEYCODE_MEDIA_STOP -> {
                player.pause()
                player.seek(0.0)
                true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                player.seek(player.currentTime + seekingOffsetSeconds)
                true
            }
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                player.seek(player.currentTime - seekingOffsetSeconds)
                true
            }
            KeyEvent.KEYCODE_BACK -> {
                finish()
                true
            }
            else -> false
        }
    }

    override fun onStart() {
        super.onStart()
        playerView.onStart()
    }

    override fun onResume() {
        super.onResume()
        playerView.onResume()
    }

    override fun onPause() {
        super.onPause()
        playerView.onPause()
    }

    override fun onStop() {
        super.onStop()
        playerView.onStop()
    }

    override fun onDestroy() {
        super.onDestroy()
        playerView.onDestroy()
    }
}
