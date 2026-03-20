package com.streamking.app;

import android.annotation.SuppressLint;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
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
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class NativePlayerActivity extends AppCompatActivity {

    // ── Views ──────────────────────────────────────────────────────────────
    private WebView  webView;
    private View     customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private View     overlay;       // bottom gradient panel + clock
    private TextView clockView;
    private TextView titleView;
    private SeekBar  seekBar;
    private TextView timeView;
    private TextView playPauseBtn;

    // ── State ──────────────────────────────────────────────────────────────
    private double  duration    = 0;
    private double  currentTime = 0;
    private boolean isPlaying   = false;
    private boolean seekTracking = false;

    // ── Handlers ───────────────────────────────────────────────────────────
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Handler hideHandler = new Handler(Looper.getMainLooper());
    private final Runnable hideRunnable = this::hideOverlay;
    private static final int HIDE_DELAY_MS = 5000;

    private final Runnable clockTick = new Runnable() {
        @Override public void run() {
            if (clockView != null) {
                clockView.setText(new SimpleDateFormat("EEE, MMM d, HH:mm", Locale.getDefault())
                    .format(new Date()));
            }
            mainHandler.postDelayed(this, 10_000);
        }
    };

    // ── JS: hides embed controls + reports video state ─────────────────────
    private static final String INJECT_JS =
        "(function(){" +
        // Hide embed's own UI (server selector, its control bar)
        "  var st=document.createElement('style');" +
        "  st.textContent='" +
        "    .plyr__controls,.vjs-control-bar,.jw-controlbar," +
        "    [class*=\"control-bar\"],[class*=\"ControlBar\"]," +
        "    .server-list,.servers,.server-tab,.ep-server," +
        "    [class*=\"server\"],[class*=\"source-select\"]" +
        "    {display:none!important}'" +
        "  ;(document.head||document.documentElement).appendChild(st);" +
        // Bridge video events
        "  var b=window.VB; if(!b) return;" +
        "  var v=null;" +
        "  function find(){" +
        "    var el=document.querySelector('video'); if(el) return el;" +
        "    var fs=document.querySelectorAll('iframe');" +
        "    for(var i=0;i<fs.length;i++){" +
        "      try{var fv=fs[i].contentDocument.querySelector('video');if(fv)return fv;}catch(e){}" +
        "    } return null;" +
        "  }" +
        "  var t=setInterval(function(){" +
        "    v=find(); if(!v) return;" +
        "    clearInterval(t);" +
        "    v.addEventListener('timeupdate',function(){b.onTime(v.currentTime,isNaN(v.duration)?0:v.duration);});" +
        "    v.addEventListener('play',function(){b.onPlay(true);});" +
        "    v.addEventListener('pause',function(){b.onPlay(false);});" +
        "    v.addEventListener('ended',function(){b.onPlay(false);});" +
        "    v.addEventListener('durationchange',function(){b.onTime(v.currentTime,isNaN(v.duration)?0:v.duration);});" +
        "    b.onTime(v.currentTime,isNaN(v.duration)?0:v.duration);" +
        "    b.onPlay(!v.paused);" +
        "  },500);" +
        "  window.VC={" +
        "    toggle:function(){if(!v)return;if(v.paused)v.play();else v.pause();}," +
        "    seek:function(s){if(v)v.currentTime=Math.max(0,Math.min(s,v.duration||99999));}," +
        "    rel:function(d){if(v)v.currentTime=Math.max(0,(v.currentTime||0)+d);}" +
        "  };" +
        "})();";

    // ── onCreate ───────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
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

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        setupWebView(root);
        root.addView(webView, matchParent());

        buildOverlay(title, root);

        if (url != null) webView.loadUrl(url);

        mainHandler.post(clockTick);
        scheduleHide();
    }

    // ── WebView ────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView(FrameLayout root) {
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        ws.setBuiltInZoomControls(false);
        ws.setDisplayZoomControls(false);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        ws.setUserAgentString(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/124.0.0.0 Safari/537.36");

        webView.addJavascriptInterface(new VideoBridge(), "VB");

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView v, String url) {
                v.evaluateJavascript(INJECT_JS, null);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                customView = view; customViewCallback = cb;
                webView.setVisibility(View.GONE);
                root.addView(customView, matchParent());
                if (overlay != null) overlay.bringToFront();
            }
            @Override public void onHideCustomView() {
                if (customView == null) return;
                root.removeView(customView); customView = null;
                if (customViewCallback != null) { customViewCallback.onCustomViewHidden(); customViewCallback = null; }
                webView.setVisibility(View.VISIBLE);
            }
        });
    }

    // ── Overlay layout ─────────────────────────────────────────────────────

    private void buildOverlay(String title, FrameLayout root) {
        overlay = new FrameLayout(this);

        // ── Clock (top-right) ──────────────────────────────────────────────
        clockView = new TextView(this);
        clockView.setTextColor(Color.WHITE);
        clockView.setTextSize(14);
        clockView.setTypeface(Typeface.DEFAULT_BOLD);
        clockView.setShadowLayer(6, 0, 1, Color.argb(160, 0, 0, 0));
        clockView.setPadding(0, dp(18), dp(24), 0);
        FrameLayout.LayoutParams clockLp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        clockLp.gravity = Gravity.TOP | Gravity.END;
        ((FrameLayout) overlay).addView(clockView, clockLp);

        // ── Bottom gradient panel ──────────────────────────────────────────
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable grad = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[]{Color.TRANSPARENT, Color.argb(230, 0, 0, 0)});
        panel.setBackground(grad);
        panel.setPadding(dp(28), dp(32), dp(28), dp(12));

        // Title
        titleView = new TextView(this);
        if (title != null) titleView.setText(title);
        titleView.setTextColor(Color.WHITE);
        titleView.setTextSize(19);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setMaxLines(1);
        titleView.setShadowLayer(8, 0, 2, Color.argb(180, 0, 0, 0));
        panel.addView(titleView, wrapContent(0, 0, 0, dp(10)));

        // Seek bar
        seekBar = new SeekBar(this);
        seekBar.setMax(10000);
        seekBar.setEnabled(false);
        seekBar.setProgressTintList(ColorStateList.valueOf(Color.parseColor("#1E90FF")));
        seekBar.setProgressBackgroundTintList(ColorStateList.valueOf(Color.argb(100, 180, 180, 180)));
        seekBar.setThumbTintList(ColorStateList.valueOf(Color.WHITE));
        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onStartTrackingTouch(SeekBar sb) {
                seekTracking = true; cancelHide();
            }
            @Override public void onStopTrackingTouch(SeekBar sb) {
                seekTracking = false;
                if (duration > 0) js("VC.seek(" + (sb.getProgress() / 10000.0 * duration) + ")");
                scheduleHide();
            }
            @Override public void onProgressChanged(SeekBar sb, int p, boolean fromUser) {}
        });
        panel.addView(seekBar, fullWidth(0, 0, 0, dp(4)));

        // Controls row
        LinearLayout controls = new LinearLayout(this);
        controls.setOrientation(LinearLayout.HORIZONTAL);
        controls.setGravity(Gravity.CENTER_VERTICAL);

        // Time (left)
        timeView = new TextView(this);
        timeView.setText("0:00 / 0:00");
        timeView.setTextColor(Color.WHITE);
        timeView.setTextSize(14);
        timeView.setTypeface(Typeface.DEFAULT_BOLD);
        LinearLayout.LayoutParams timeLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        timeLp.weight = 1;
        controls.addView(timeView, timeLp);

        // Center buttons
        LinearLayout centerBtns = new LinearLayout(this);
        centerBtns.setOrientation(LinearLayout.HORIZONTAL);
        centerBtns.setGravity(Gravity.CENTER_VERTICAL);

        centerBtns.addView(ctrlBtn("⏮", dp(40), () -> js("VC.seek(0)")));
        centerBtns.addView(ctrlBtn("⏪", dp(40), () -> js("VC.rel(-15)")));
        playPauseBtn = ctrlBtnLarge("▶");
        playPauseBtn.setOnClickListener(v -> js("VC.toggle()"));
        centerBtns.addView(playPauseBtn);
        centerBtns.addView(ctrlBtn("⏩", dp(40), () -> js("VC.rel(15)")));
        centerBtns.addView(ctrlBtn("⏭", dp(40), () -> js("VC.seek(duration||99999)")));

        LinearLayout.LayoutParams centerLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        centerLp.weight = 1;
        centerLp.gravity = Gravity.CENTER_HORIZONTAL;
        controls.addView(centerBtns, centerLp);

        // Right: replay + back
        LinearLayout rightBtns = new LinearLayout(this);
        rightBtns.setOrientation(LinearLayout.HORIZONTAL);
        rightBtns.setGravity(Gravity.CENTER_VERTICAL | Gravity.END);
        rightBtns.addView(ctrlBtn("↺", dp(40), () -> js("VC.seek(0)")));
        rightBtns.addView(ctrlBtn("✕", dp(40), this::finish));
        LinearLayout.LayoutParams rightLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rightLp.weight = 1;
        rightLp.gravity = Gravity.END;
        controls.addView(rightBtns, rightLp);

        panel.addView(controls, fullWidth(0, dp(4), 0, 0));

        // Chevron (hide controls)
        TextView chevron = new TextView(this);
        chevron.setText("∨");
        chevron.setTextColor(Color.argb(180, 255, 255, 255));
        chevron.setTextSize(18);
        chevron.setGravity(Gravity.CENTER);
        chevron.setOnClickListener(v -> hideOverlay());
        LinearLayout.LayoutParams chevLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        chevLp.topMargin = dp(4);
        panel.addView(chevron, chevLp);

        FrameLayout.LayoutParams panelLp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        panelLp.gravity = Gravity.BOTTOM;
        ((FrameLayout) overlay).addView(panel, panelLp);

        root.addView(overlay, matchParent());
    }

    // ── Button builders ────────────────────────────────────────────────────

    private TextView ctrlBtn(String symbol, int size, Runnable action) {
        TextView tv = new TextView(this);
        tv.setText(symbol);
        tv.setTextColor(Color.WHITE);
        tv.setTextSize(20);
        tv.setGravity(Gravity.CENTER);
        tv.setFocusable(true);
        int pad = dp(8);
        tv.setPadding(pad, pad, pad, pad);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(size, size);
        lp.setMargins(dp(4), 0, dp(4), 0);
        tv.setLayoutParams(lp);
        tv.setOnClickListener(v -> action.run());
        tv.setOnFocusChangeListener((v, f) ->
            v.setBackgroundColor(f ? Color.argb(80, 255, 255, 255) : Color.TRANSPARENT));
        return tv;
    }

    private TextView ctrlBtnLarge(String symbol) {
        TextView tv = new TextView(this);
        tv.setText(symbol);
        tv.setTextColor(Color.argb(220, 30, 30, 30));
        tv.setTextSize(24);
        tv.setGravity(Gravity.CENTER);
        tv.setFocusable(true);
        int sz = dp(56);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(sz, sz);
        lp.setMargins(dp(8), 0, dp(8), 0);
        tv.setLayoutParams(lp);
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(Color.WHITE);
        tv.setBackground(circle);
        tv.setOnFocusChangeListener((v, f) -> {
            circle.setColor(f ? Color.parseColor("#1E90FF") : Color.WHITE);
            tv.setTextColor(f ? Color.WHITE : Color.argb(220, 30, 30, 30));
        });
        return tv;
    }

    // ── JS bridge ──────────────────────────────────────────────────────────

    private class VideoBridge {
        @JavascriptInterface
        public void onTime(double current, double dur) {
            mainHandler.post(() -> {
                currentTime = current;
                if (dur > 0) { duration = dur; seekBar.setEnabled(true); }
                if (!seekTracking && duration > 0)
                    seekBar.setProgress((int)(current / duration * 10000));
                timeView.setText(fmt(current) + " / " + fmt(duration));
            });
        }
        @JavascriptInterface
        public void onPlay(boolean playing) {
            mainHandler.post(() -> {
                isPlaying = playing;
                playPauseBtn.setText(playing ? "⏸" : "▶");
                playPauseBtn.setTextColor(playing
                    ? Color.argb(220, 30, 30, 30)
                    : Color.argb(220, 30, 30, 30));
            });
        }
    }

    private void js(String cmd) {
        if (webView != null) webView.evaluateJavascript(cmd, null);
        scheduleHide();
    }

    private String fmt(double secs) {
        int s = (int) secs, m = s / 60; s %= 60;
        int h = m / 60; m %= 60;
        if (h > 0) return String.format(Locale.US, "%d:%02d:%02d", h, m, s);
        return String.format(Locale.US, "%d:%02d", m, s);
    }

    // ── Show / hide overlay ────────────────────────────────────────────────

    private void showOverlay() {
        cancelHide();
        overlay.setVisibility(View.VISIBLE);
        overlay.animate().alpha(1f).setDuration(150).start();
        scheduleHide();
    }

    private void hideOverlay() {
        overlay.animate().alpha(0f).setDuration(300)
            .withEndAction(() -> overlay.setVisibility(View.GONE)).start();
    }

    private void scheduleHide() {
        cancelHide();
        hideHandler.postDelayed(hideRunnable, HIDE_DELAY_MS);
    }

    private void cancelHide() {
        hideHandler.removeCallbacks(hideRunnable);
        if (overlay != null) overlay.animate().cancel();
    }

    // ── Key handling ───────────────────────────────────────────────────────

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_BACK:
                    if (overlay.getVisibility() == View.VISIBLE && overlay.getAlpha() > 0.1f) {
                        hideOverlay(); cancelHide();
                    } else { finish(); }
                    return true;
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                    js("VC.toggle()"); showOverlay(); return true;
                default:
                    showOverlay();
            }
        }
        return super.dispatchKeyEvent(event);
    }

    // ── Immersive / lifecycle ──────────────────────────────────────────────

    @SuppressWarnings("deprecation")
    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        if (getSupportActionBar() != null) getSupportActionBar().hide();
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus); if (hasFocus) hideSystemUI();
    }
    @Override protected void onResume() {
        super.onResume();
        if (webView != null) { webView.onResume(); webView.resumeTimers(); }
        hideSystemUI();
    }
    @Override protected void onPause() {
        super.onPause();
        if (webView != null) { webView.onPause(); webView.pauseTimers(); }
    }
    @Override protected void onDestroy() {
        cancelHide(); mainHandler.removeCallbacks(clockTick);
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }

    // ── Layout helpers ─────────────────────────────────────────────────────

    private FrameLayout.LayoutParams matchParent() {
        return new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
    }
    private LinearLayout.LayoutParams wrapContent(int l, int t, int r, int b) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(l, t, r, b); return lp;
    }
    private LinearLayout.LayoutParams fullWidth(int l, int t, int r, int b) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(l, t, r, b); return lp;
    }
    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
