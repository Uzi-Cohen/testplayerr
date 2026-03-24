package com.streamking.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
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
    private lateinit var root: FrameLayout
    private lateinit var loadingOverlay: View
    private lateinit var webViewContainer: FrameLayout

    private var extractorWebView: WebView? = null
    private var streamFound = false
    private val mainHandler = Handler(Looper.getMainLooper())

    // After 15 s without intercepting a stream URL, reveal the WebView so the
    // user can interact with the embed player (e.g. dismiss an ad then press play).
    private val fallbackRunnable = Runnable { if (!streamFound) revealFallbackWebView() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemUI()

        val embedUrl = intent.getStringExtra("url") ?: ""
        val title    = intent.getStringExtra("title") ?: "Stream"

        root = FrameLayout(this)
        root.setBackgroundColor(Color.BLACK)
        setContentView(root)

        // Layer 1 – WebView container (extraction / fallback)
        webViewContainer = FrameLayout(this)
        root.addView(webViewContainer, matchParent())

        // Layer 2 – Bitmovin PlayerView (hidden until stream URL found)
        playerView = PlayerView(this)
        playerView.visibility = View.GONE
        root.addView(playerView, matchParent())

        // Layer 3 – Loading spinner on top of everything
        loadingOverlay = buildLoadingOverlay()
        root.addView(loadingOverlay, matchParent())

        startExtraction(embedUrl, title)
        mainHandler.postDelayed(fallbackRunnable, 15_000)
    }

    // ── Stream extraction ──────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun startExtraction(embedUrl: String, title: String) {
        val wv = WebView(this)
        extractorWebView = wv

        wv.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }

        wv.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest,
            ): WebResourceResponse? {
                val url = request.url.toString()
                if (!streamFound && isStreamUrl(url)) {
                    streamFound = true
                    mainHandler.removeCallbacks(fallbackRunnable)
                    mainHandler.post { launchBitmovin(url, title) }
                }
                return null // let WebView proceed so cookies/tokens stay valid
            }
        }

        webViewContainer.addView(wv, matchParent())
        wv.loadUrl(embedUrl)
    }

    private fun isStreamUrl(url: String): Boolean {
        val u = url.lowercase()
        // Exclude thumbnail/poster requests that may accidentally match
        if (u.contains("thumbnail") || u.contains("poster") || u.contains("preview")) return false
        return u.contains(".m3u8") || u.contains(".mpd")
    }

    // ── Launch Bitmovin with the intercepted URL ───────────────────────────────

    private fun launchBitmovin(streamUrl: String, title: String) {
        loadingOverlay.visibility = View.GONE
        webViewContainer.visibility = View.GONE
        destroyExtractor()

        playerView.visibility = View.VISIBLE

        val player = Player(
            context = this,
            analyticsConfig = AnalyticsPlayerConfig.Enabled(
                AnalyticsConfig(licenseKey = analyticsLicenseKey)
            ),
        )
        playerView.player = player

        val sourceType = if (streamUrl.lowercase().contains(".mpd")) SourceType.Dash else SourceType.Hls

        player.load(
            Source(
                SourceConfig(url = streamUrl, type = sourceType, title = title),
                AnalyticsSourceConfig.Enabled(
                    SourceMetadata(
                        videoId = "stream-${System.currentTimeMillis()}",
                        title = title,
                    )
                ),
            )
        )
    }

    // ── Fallback: reveal the WebView so the user can interact ─────────────────

    private fun revealFallbackWebView() {
        loadingOverlay.visibility = View.GONE
        webViewContainer.visibility = View.VISIBLE
        // Keep shouldInterceptRequest running — if user presses play inside the
        // embed and a stream URL fires, we still switch to Bitmovin.
    }

    // ── Loading overlay ────────────────────────────────────────────────────────

    private fun buildLoadingOverlay(): View {
        val fl = FrameLayout(this)
        fl.setBackgroundColor(Color.BLACK)

        val spinner = ProgressBar(this, null, android.R.attr.progressBarStyleLarge)
        spinner.indeterminateTintList = ColorStateList.valueOf(Color.WHITE)
        val slp = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ).also { it.gravity = Gravity.CENTER; it.bottomMargin = dp(48) }
        fl.addView(spinner, slp)

        val label = TextView(this)
        label.text = "Loading stream…"
        label.setTextColor(Color.argb(160, 255, 255, 255))
        label.textSize = 14f
        label.gravity = Gravity.CENTER
        val llp = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
        ).also { it.gravity = Gravity.CENTER; it.topMargin = dp(64) }
        fl.addView(label, llp)

        return fl
    }

    // ── Key handling ───────────────────────────────────────────────────────────

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            if (handleUserInput(event.keyCode)) return true
        }
        return super.dispatchKeyEvent(event)
    }

    private fun handleUserInput(keycode: Int): Boolean {
        val seekOffset = 15
        val player = playerView.player
        if (player == null) {
            if (keycode == KeyEvent.KEYCODE_BACK) { finish(); return true }
            return false
        }
        return when (keycode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_NUMPAD_ENTER,
            KeyEvent.KEYCODE_SPACE,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> { if (player.isPlaying) player.pause() else player.play(); true }
            KeyEvent.KEYCODE_MEDIA_PLAY       -> { player.play();                                               true }
            KeyEvent.KEYCODE_MEDIA_PAUSE      -> { player.pause();                                              true }
            KeyEvent.KEYCODE_MEDIA_STOP       -> { player.pause(); player.seek(0.0);                            true }
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> { player.seek(player.currentTime + seekOffset);              true }
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_MEDIA_REWIND      -> { player.seek(player.currentTime - seekOffset);               true }
            KeyEvent.KEYCODE_BACK              -> { finish();                                                    true }
            else -> false
        }
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    override fun onStart()   { super.onStart();   playerView.onStart() }
    override fun onResume()  { super.onResume();  playerView.onResume();  extractorWebView?.onResume()  }
    override fun onPause()   { super.onPause();   playerView.onPause();   extractorWebView?.onPause()   }
    override fun onStop()    { super.onStop();    playerView.onStop()  }
    override fun onDestroy() {
        mainHandler.removeCallbacksAndMessages(null)
        destroyExtractor()
        playerView.onDestroy()
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private fun destroyExtractor() {
        extractorWebView?.destroy()
        extractorWebView = null
    }

    @Suppress("DEPRECATION")
    private fun hideSystemUI() {
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN or
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION  or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )
    }

    private fun matchParent() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
    )

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()
}
