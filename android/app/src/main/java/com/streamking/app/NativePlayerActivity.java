package com.streamking.app;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class NativePlayerActivity extends AppCompatActivity {

    // ── State ──────────────────────────────────────────────────────────────
    private WebView  webView;
    private View     customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private View     controls;          // full-screen tappable layer
    private View     topBar;
    private View     bottomBar;
    private TextView titleView;
    private ImageButton playPauseBtn;
    private SeekBar  seekBar;
    private TextView timeView;

    private boolean  isPlaying  = false;
    private boolean  videoReady = false;
    private double   duration   = 0;
    private double   currentTime = 0;
    private boolean  seekBarTracking = false;

    private final Handler handler       = new Handler(Looper.getMainLooper());
    private final Handler hideHandler   = new Handler(Looper.getMainLooper());
    private final Runnable hideRunnable = this::hideControls;
    private static final int HIDE_DELAY_MS = 3500;

    // ── JS injected into the embed page ───────────────────────────────────
    private static final String INJECT_JS =
        "(function(){" +
        "  var b = window.VideoAndroidBridge;" +
        "  if(!b) return;" +
        "  var video = null;" +
        "  function find(){" +
        "    var v = document.querySelector('video');" +
        "    if(v) return v;" +
        "    var fs = document.querySelectorAll('iframe');" +
        "    for(var i=0;i<fs.length;i++){" +
        "      try{ var fv=fs[i].contentDocument.querySelector('video'); if(fv) return fv; }catch(e){}" +
        "    }" +
        "    return null;" +
        "  }" +
        "  var t = setInterval(function(){" +
        "    video = find();" +
        "    if(!video) return;" +
        "    clearInterval(t);" +
        "    video.removeAttribute('controls');" +
        "    video.addEventListener('timeupdate', function(){" +
        "      b.onTimeUpdate(video.currentTime, isNaN(video.duration)?0:video.duration);" +
        "    });" +
        "    video.addEventListener('play',  function(){ b.onPlayState(true);  });" +
        "    video.addEventListener('pause', function(){ b.onPlayState(false); });" +
        "    video.addEventListener('ended', function(){ b.onPlayState(false); });" +
        "    video.addEventListener('durationchange', function(){" +
        "      b.onVideoReady(isNaN(video.duration)?0:video.duration);" +
        "    });" +
        "    b.onVideoReady(isNaN(video.duration)?0:video.duration);" +
        "    b.onPlayState(!video.paused);" +
        "  }, 500);" +
        "  window.VideoCmd = {" +
        "    play:   function(){ if(video) video.play(); }," +
        "    pause:  function(){ if(video) video.pause(); }," +
        "    toggle: function(){ if(!video) return; if(video.paused) video.play(); else video.pause(); }," +
        "    seek:   function(t){ if(video){ video.currentTime=t; } }" +
        "  };" +
        "})();";

    // ── Activity lifecycle ─────────────────────────────────────────────────

    @SuppressLint({"SetJavaScriptEnabled","ClickableViewAccessibility"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        String url   = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        // ── WebView ────────────────────────────────────────────────────────
        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        configureWebView(title);
        root.addView(webView, matchParent());

        // ── Controls overlay ───────────────────────────────────────────────
        controls = buildControls(title);
        root.addView(controls, matchParent());

        if (url != null) webView.loadUrl(url);
        scheduleHide();
    }

    // ── WebView setup ──────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(String pageTitle) {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUserAgentString(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/124.0.0.0 Safari/537.36"
        );

        webView.addJavascriptInterface(new VideoBridge(), "VideoAndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(INJECT_JS, null);
            }
        });

        FrameLayout root = (FrameLayout) webView.getParent();
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                customView = view;
                customViewCallback = cb;
                webView.setVisibility(View.GONE);
                if (root != null) {
                    root.addView(customView, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT));
                    controls.bringToFront();
                }
            }
            @Override
            public void onHideCustomView() {
                if (customView == null) return;
                if (root != null) root.removeView(customView);
                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                webView.setVisibility(View.VISIBLE);
            }
        });
    }

    // ── Controls UI builder ────────────────────────────────────────────────

    private View buildControls(String title) {
        // Root frame — tapping shows/hides controls
        FrameLayout frame = new FrameLayout(this);
        frame.setOnClickListener(v -> toggleControls());

        // ── Top bar ────────────────────────────────────────────────────────
        topBar = new LinearLayout(this);
        ((LinearLayout) topBar).setOrientation(LinearLayout.HORIZONTAL);
        topBar.setBackgroundColor(Color.argb(180, 0, 0, 0));
        ((LinearLayout) topBar).setGravity(Gravity.CENTER_VERTICAL);
        topBar.setPadding(dp(20), dp(14), dp(20), dp(14));

        TextView back = new TextView(this);
        back.setText("← Back");
        back.setTextColor(Color.parseColor("#00c896"));
        back.setTextSize(17);
        back.setTypeface(Typeface.DEFAULT_BOLD);
        back.setFocusable(true);
        back.setPadding(dp(16), dp(8), dp(16), dp(8));
        back.setOnClickListener(v -> finish());
        back.setOnFocusChangeListener((v, f) ->
            v.setBackgroundColor(f ? Color.parseColor("#333333") : Color.TRANSPARENT));
        ((LinearLayout) topBar).addView(back);

        View spacer = new View(this);
        ((LinearLayout) topBar).addView(spacer,
            new LinearLayout.LayoutParams(0, 1, 1f));

        if (title != null && !title.isEmpty()) {
            titleView = new TextView(this);
            titleView.setText(title);
            titleView.setTextColor(Color.WHITE);
            titleView.setTextSize(17);
            titleView.setTypeface(Typeface.DEFAULT_BOLD);
            titleView.setMaxLines(1);
            ((LinearLayout) topBar).addView(titleView);
        }

        FrameLayout.LayoutParams topParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT);
        topParams.gravity = Gravity.TOP;
        frame.addView(topBar, topParams);

        // ── Bottom bar ─────────────────────────────────────────────────────
        bottomBar = new LinearLayout(this);
        ((LinearLayout) bottomBar).setOrientation(LinearLayout.VERTICAL);
        bottomBar.setBackgroundColor(Color.argb(180, 0, 0, 0));
        bottomBar.setPadding(dp(20), dp(12), dp(20), dp(14));

        // Row 1: play/pause + time
        LinearLayout row1 = new LinearLayout(this);
        row1.setOrientation(LinearLayout.HORIZONTAL);
        row1.setGravity(Gravity.CENTER_VERTICAL);

        playPauseBtn = new ImageButton(this);
        playPauseBtn.setBackgroundColor(Color.TRANSPARENT);
        playPauseBtn.setImageResource(android.R.drawable.ic_media_play);
        playPauseBtn.setColorFilter(Color.WHITE);
        playPauseBtn.setFocusable(true);
        playPauseBtn.setOnClickListener(v -> sendVideoCommand("VideoCmd.toggle()"));
        playPauseBtn.setOnFocusChangeListener((v, f) ->
            v.setBackgroundColor(f ? Color.parseColor("#333333") : Color.TRANSPARENT));
        row1.addView(playPauseBtn, new LinearLayout.LayoutParams(dp(44), dp(44)));

        View row1Spacer = new View(this);
        row1.addView(row1Spacer, new LinearLayout.LayoutParams(0, 1, 1f));

        timeView = new TextView(this);
        timeView.setText("0:00 / 0:00");
        timeView.setTextColor(Color.WHITE);
        timeView.setTextSize(13);
        row1.addView(timeView);

        ((LinearLayout) bottomBar).addView(row1,
            new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        // Row 2: seek bar
        seekBar = new SeekBar(this);
        seekBar.setMax(1000);
        seekBar.setEnabled(false);
        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onStartTrackingTouch(SeekBar sb) {
                seekBarTracking = true;
                cancelHide();
            }
            @Override public void onStopTrackingTouch(SeekBar sb) {
                seekBarTracking = false;
                if (duration > 0) {
                    double t = (sb.getProgress() / 1000.0) * duration;
                    sendVideoCommand("VideoCmd.seek(" + t + ")");
                }
                scheduleHide();
            }
            @Override public void onProgressChanged(SeekBar sb, int p, boolean fromUser) {}
        });
        LinearLayout.LayoutParams sbParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT);
        sbParams.topMargin = dp(4);
        ((LinearLayout) bottomBar).addView(seekBar, sbParams);

        FrameLayout.LayoutParams botParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT);
        botParams.gravity = Gravity.BOTTOM;
        frame.addView(bottomBar, botParams);

        return frame;
    }

    // ── JS bridge (called from WebView thread) ─────────────────────────────

    private class VideoBridge {
        @JavascriptInterface
        public void onVideoReady(double dur) {
            handler.post(() -> {
                duration  = dur;
                videoReady = true;
                seekBar.setEnabled(true);
                updateTimeDisplay();
            });
        }
        @JavascriptInterface
        public void onPlayState(boolean playing) {
            handler.post(() -> {
                isPlaying = playing;
                playPauseBtn.setImageResource(
                    playing
                        ? android.R.drawable.ic_media_pause
                        : android.R.drawable.ic_media_play);
            });
        }
        @JavascriptInterface
        public void onTimeUpdate(double current, double dur) {
            handler.post(() -> {
                currentTime = current;
                if (dur > 0) duration = dur;
                if (!seekBarTracking && duration > 0) {
                    seekBar.setProgress((int) ((current / duration) * 1000));
                }
                updateTimeDisplay();
            });
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void sendVideoCommand(String js) {
        if (webView != null) webView.evaluateJavascript(js, null);
        scheduleHide();
    }

    private void updateTimeDisplay() {
        timeView.setText(formatTime(currentTime) + " / " + formatTime(duration));
    }

    private String formatTime(double secs) {
        int s = (int) secs;
        int m = s / 60; s %= 60;
        int h = m / 60; m %= 60;
        if (h > 0) return String.format("%d:%02d:%02d", h, m, s);
        return String.format("%d:%02d", m, s);
    }

    private void toggleControls() {
        if (topBar.getVisibility() == View.VISIBLE) {
            hideControls();
        } else {
            showControls();
        }
    }

    private void showControls() {
        topBar.setVisibility(View.VISIBLE);
        bottomBar.setVisibility(View.VISIBLE);
        scheduleHide();
    }

    private void hideControls() {
        topBar.setVisibility(View.GONE);
        bottomBar.setVisibility(View.GONE);
    }

    private void scheduleHide() {
        cancelHide();
        hideHandler.postDelayed(hideRunnable, HIDE_DELAY_MS);
    }

    private void cancelHide() {
        hideHandler.removeCallbacks(hideRunnable);
    }

    // ── Key handling ───────────────────────────────────────────────────────

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_BACK:
                    if (topBar.getVisibility() == View.VISIBLE) {
                        hideControls();
                    } else {
                        finish();
                    }
                    return true;
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                case KeyEvent.KEYCODE_SPACE:
                    sendVideoCommand("VideoCmd.toggle()");
                    showControls();
                    return true;
                default:
                    showControls();
            }
        }
        return super.dispatchKeyEvent(event);
    }

    // ── Immersive mode ─────────────────────────────────────────────────────

    @SuppressWarnings("deprecation")
    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
        if (getSupportActionBar() != null) getSupportActionBar().hide();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUI();
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) { webView.onResume(); webView.resumeTimers(); }
        hideSystemUI();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) { webView.onPause(); webView.pauseTimers(); }
    }

    @Override
    protected void onDestroy() {
        cancelHide();
        handler.removeCallbacksAndMessages(null);
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }

    // ── Layout helpers ─────────────────────────────────────────────────────

    private FrameLayout.LayoutParams matchParent() {
        return new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }
}
