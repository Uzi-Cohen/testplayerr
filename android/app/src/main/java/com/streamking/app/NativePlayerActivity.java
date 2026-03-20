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
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class NativePlayerActivity extends AppCompatActivity {

    private WebView     webView;
    private View        overlay;
    private View        customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private final Handler  hideHandler  = new Handler(Looper.getMainLooper());
    private final Runnable hideOverlay  = () -> overlay.setVisibility(View.GONE);
    private static final int HIDE_DELAY = 3000; // ms

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        String url   = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");

        // ── Root container ────────────────────────────────────────────────
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        // ── WebView ───────────────────────────────────────────────────────
        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);

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

        // WebView must NOT be focusable — remote keys must never reach it
        webView.setFocusable(false);
        webView.setFocusableInTouchMode(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback cb) {
                if (customView != null) { cb.onCustomViewHidden(); return; }
                customView = view;
                customViewCallback = cb;
                webView.setVisibility(View.GONE);
                root.addView(customView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));
                overlay.bringToFront(); // keep overlay above the video surface
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

        root.addView(webView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // ── Overlay (top bar) ─────────────────────────────────────────────
        overlay = buildOverlay(title);
        FrameLayout.LayoutParams olp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        olp.gravity = Gravity.TOP;
        root.addView(overlay, olp);

        // Show briefly on launch, then hide
        scheduleHide();

        if (url != null) webView.loadUrl(url);
    }

    // ── Overlay builder ───────────────────────────────────────────────────

    private View buildOverlay(String title) {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(Color.argb(210, 0, 0, 0));
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(20), dp(14), dp(20), dp(14));

        // Back button
        TextView back = new TextView(this);
        back.setText("← Back");
        back.setTextColor(Color.parseColor("#00c896"));
        back.setTextSize(15);
        back.setTypeface(Typeface.DEFAULT_BOLD);
        back.setLetterSpacing(0.08f);
        back.setAllCaps(true);
        back.setPadding(dp(14), dp(8), dp(14), dp(8));
        back.setBackground(makeRoundedBg(Color.argb(80, 0, 200, 150), dp(4)));
        back.setOnClickListener(v -> finish());
        bar.addView(back);

        // Spacer
        View spacer = new View(this);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(0, 1, 1f);
        bar.addView(spacer, sp);

        // Title
        if (title != null && !title.isEmpty()) {
            TextView tv = new TextView(this);
            tv.setText(title.toUpperCase());
            tv.setTextColor(Color.WHITE);
            tv.setTextSize(16);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            tv.setLetterSpacing(0.05f);
            tv.setMaxLines(1);
            tv.setEllipsize(android.text.TextUtils.TruncateAt.END);
            bar.addView(tv);
        }

        return bar;
    }

    private android.graphics.drawable.GradientDrawable makeRoundedBg(int color, int radius) {
        android.graphics.drawable.GradientDrawable d = new android.graphics.drawable.GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(radius);
        return d;
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }

    // ── Overlay show/hide ─────────────────────────────────────────────────

    private void showOverlay() {
        overlay.setVisibility(View.VISIBLE);
        scheduleHide();
    }

    private void scheduleHide() {
        hideHandler.removeCallbacks(hideOverlay);
        hideHandler.postDelayed(hideOverlay, HIDE_DELAY);
    }

    // ── Key handling — remote ONLY controls overlay ───────────────────────

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        // Show overlay on any key press
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            showOverlay();
            if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
                finish();
            }
        }
        // *** Do NOT pass ANY keys to the WebView ***
        return true;
    }

    // ── Immersive mode ────────────────────────────────────────────────────

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

    // ── Lifecycle ─────────────────────────────────────────────────────────

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
        hideHandler.removeCallbacks(hideOverlay);
    }

    @Override
    protected void onDestroy() {
        hideHandler.removeCallbacks(hideOverlay);
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
