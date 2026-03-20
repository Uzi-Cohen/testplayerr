package com.streamking.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;

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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        hideSystemUI();

        String url   = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");

        playerView = new PlayerView(this);
        playerView.setBackgroundColor(Color.BLACK);
        playerView.setUseController(true);
        playerView.setControllerAutoShow(true);
        playerView.setControllerHideOnTouch(true);
        setContentView(playerView);

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

    // ── Key handling ──────────────────────────────────────────────────────

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN &&
                event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (playerView.isControllerFullyVisible()) {
                playerView.hideController();
            } else {
                finish();
            }
            return true;
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
    }

    @Override
    protected void onDestroy() {
        if (player != null) { player.release(); player = null; }
        super.onDestroy();
    }
}
