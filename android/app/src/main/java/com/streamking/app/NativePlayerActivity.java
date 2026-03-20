package com.streamking.app;

import android.animation.ObjectAnimator;
import android.annotation.SuppressLint;
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
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class NativePlayerActivity extends AppCompatActivity {

    private WebView webView;
    private View    customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private View    topBar;

    private final Handler  hideHandler   = new Handler(Looper.getMainLooper());
    private final Runnable hideRunnable  = this::fadeOutBar;
    private static final int HIDE_DELAY_MS = 4000;

    // ── Injected CSS: hides the server/source selector in the embed ────────
    private static final String INJECT_CSS =
        "(function(){" +
        "  var s = document.createElement('style');" +
        "  s.textContent = '" +
        "    .server-list, .servers, .server-tab, .server-item," +
        "    .ep-server, .nav-server, .source-tab, .sources-tabs," +
        "    [class*=\"server\"], [class*=\"source-select\"]," +
        "    [class*=\"ServerList\"], [class*=\"SourceList\"]" +
        "    { display: none !important; }" +
        "  ';" +
        "  (document.head || document.documentElement).appendChild(s);" +
        "})();";

    // ── Lifecycle ──────────────────────────────────────────────────────────

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

        // ── WebView ────────────────────────────────────────────────────────
        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        configureWebView(root);
        root.addView(webView, matchParent());

        // ── Top bar ────────────────────────────────────────────────────────
        topBar = buildTopBar(title);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.TOP;
        root.addView(topBar, lp);

        if (url != null) webView.loadUrl(url);
        scheduleHide();
    }

    // ── WebView ────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(FrameLayout root) {
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

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.evaluateJavascript(INJECT_CSS, null);
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                customView = view;
                customViewCallback = cb;
                webView.setVisibility(View.GONE);
                root.addView(customView, matchParent());
                topBar.bringToFront();
            }
            @Override
            public void onHideCustomView() {
                if (customView == null) return;
                root.removeView(customView);
                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                webView.setVisibility(View.VISIBLE);
            }
        });
    }

    // ── Top bar UI ─────────────────────────────────────────────────────────

    private View buildTopBar(String title) {
        // Gradient: dark → transparent (cinematic look)
        GradientDrawable grad = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[]{Color.argb(210, 0, 0, 0), Color.TRANSPARENT}
        );

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackground(grad);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(20), dp(20), dp(28), dp(36));

        // Back button pill
        TextView back = new TextView(this);
        back.setText("‹  Back");
        back.setTextColor(Color.WHITE);
        back.setTextSize(16);
        back.setTypeface(Typeface.DEFAULT_BOLD);
        back.setLetterSpacing(0.04f);
        back.setFocusable(true);
        back.setPadding(dp(18), dp(10), dp(18), dp(10));
        back.setBackground(makePillBackground(Color.argb(120, 255, 255, 255)));
        back.setOnClickListener(v -> finish());
        back.setOnFocusChangeListener((v, hasFocus) ->
            v.setBackground(makePillBackground(
                hasFocus ? Color.argb(200, 0, 200, 150)
                         : Color.argb(120, 255, 255, 255))));
        bar.addView(back);

        // Spacer
        View spacer = new View(this);
        bar.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1f));

        // Title
        if (title != null && !title.isEmpty()) {
            TextView tv = new TextView(this);
            tv.setText(title);
            tv.setTextColor(Color.WHITE);
            tv.setTextSize(17);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            tv.setLetterSpacing(0.02f);
            tv.setMaxLines(1);
            tv.setShadowLayer(8f, 0, 2f, Color.argb(180, 0, 0, 0));
            bar.addView(tv);
        }

        return bar;
    }

    private GradientDrawable makePillBackground(int color) {
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.RECTANGLE);
        d.setCornerRadius(dp(24));
        d.setColor(color);
        return d;
    }

    // ── Show / hide top bar ────────────────────────────────────────────────

    private void showBar() {
        cancelHide();
        topBar.setVisibility(View.VISIBLE);
        topBar.animate().alpha(1f).setDuration(200).start();
        scheduleHide();
    }

    private void fadeOutBar() {
        topBar.animate().alpha(0f).setDuration(400).withEndAction(() ->
            topBar.setVisibility(View.GONE)).start();
    }

    private void scheduleHide() {
        cancelHide();
        hideHandler.postDelayed(hideRunnable, HIDE_DELAY_MS);
    }

    private void cancelHide() {
        hideHandler.removeCallbacks(hideRunnable);
        topBar.animate().cancel();
    }

    // ── Key handling ───────────────────────────────────────────────────────

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
                if (topBar.getVisibility() == View.VISIBLE && topBar.getAlpha() > 0.1f) {
                    fadeOutBar();
                    cancelHide();
                } else {
                    finish();
                }
                return true;
            }
            showBar();
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
        cancelHide();
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private FrameLayout.LayoutParams matchParent() {
        return new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT);
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }
}
