package com.streamking.app;

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
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.OptIn;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

@OptIn(markerClass = UnstableApi.class)
public class NativePlayerActivity extends AppCompatActivity {

    private ExoPlayer  player;
    private PlayerView playerView;
    private View       overlay;

    private final Handler  hideHandler = new Handler(Looper.getMainLooper());
    private final Runnable hideOverlay = () -> overlay.setVisibility(View.GONE);
    private static final int HIDE_DELAY = 3000;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        String url   = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");

        // ── Root ──────────────────────────────────────────────────────────
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        // ── PlayerView ────────────────────────────────────────────────────
        playerView = new PlayerView(this);
        playerView.setUseController(false); // custom overlay instead
        playerView.setBackgroundColor(Color.BLACK);
        root.addView(playerView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // ── Overlay ───────────────────────────────────────────────────────
        overlay = buildOverlay(title);
        FrameLayout.LayoutParams olp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        olp.gravity = Gravity.TOP;
        root.addView(overlay, olp);
        scheduleHide();

        // ── Player ────────────────────────────────────────────────────────
        if (url != null) initPlayer(url);
    }

    private void initPlayer(String url) {
        player = new ExoPlayer.Builder(this)
                .setSeekBackIncrementMs(10_000)
                .setSeekForwardIncrementMs(10_000)
                .build();
        playerView.setPlayer(player);
        player.setMediaItem(MediaItem.fromUri(url));
        player.prepare();
        player.setPlayWhenReady(true);
    }

    // ── Overlay builder ───────────────────────────────────────────────────

    private View buildOverlay(String title) {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(Color.argb(210, 0, 0, 0));
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(20), dp(14), dp(20), dp(14));

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

        View spacer = new View(this);
        bar.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1f));

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

    // ── Key handling ──────────────────────────────────────────────────────

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
                if (overlay.getVisibility() == View.VISIBLE) {
                    hideHandler.removeCallbacks(hideOverlay);
                    overlay.setVisibility(View.GONE);
                } else {
                    finish();
                }
                return true;
            }
            showOverlay();
        }
        return super.dispatchKeyEvent(event);
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
        if (player != null) player.play();
        hideSystemUI();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (player != null) player.pause();
        hideHandler.removeCallbacks(hideOverlay);
    }

    @Override
    protected void onDestroy() {
        hideHandler.removeCallbacks(hideOverlay);
        if (player != null) { player.release(); player = null; }
        super.onDestroy();
    }
}
