package com.streamking.app;

import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
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

    private ExoPlayer player;
    private PlayerView playerView;
    private View overlay;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String url   = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        // PlayerView (use native controls for TV)
        playerView = new PlayerView(this);
        playerView.setUseController(true);
        playerView.setFocusable(true);
        playerView.setFocusableInTouchMode(true);

        root.addView(playerView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // Top overlay (title + back)
        overlay = buildOverlay(title);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.gravity = Gravity.TOP;
        root.addView(overlay, params);

        if (url != null) initPlayer(url);
    }

    private void initPlayer(String url) {
        player = new ExoPlayer.Builder(this).build();
        playerView.setPlayer(player);

        player.setMediaItem(MediaItem.fromUri(url));
        player.prepare();
        player.play();
    }

    // Overlay UI (TV friendly)
    private View buildOverlay(String title) {
        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setBackgroundColor(Color.argb(200, 0, 0, 0));
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(dp(24), dp(16), dp(24), dp(16));

        TextView back = new TextView(this);
        back.setText("← Back");
        back.setTextColor(Color.parseColor("#00c896"));
        back.setTextSize(18);
        back.setTypeface(Typeface.DEFAULT_BOLD);
        back.setFocusable(true);
        back.setPadding(dp(20), dp(10), dp(20), dp(10));

        back.setOnClickListener(v -> finish());

        back.setOnFocusChangeListener((v, hasFocus) -> {
            v.setBackgroundColor(hasFocus
                    ? Color.parseColor("#333333")
                    : Color.TRANSPARENT);
        });

        bar.addView(back);

        View spacer = new View(this);
        bar.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1f));

        if (title != null && !title.isEmpty()) {
            TextView tv = new TextView(this);
            tv.setText(title);
            tv.setTextColor(Color.WHITE);
            tv.setTextSize(18);
            tv.setTypeface(Typeface.DEFAULT_BOLD);
            tv.setMaxLines(1);
            bar.addView(tv);
        }

        return bar;
    }

    private int dp(int val) {
        return Math.round(val * getResources().getDisplayMetrics().density);
    }

    // Remote handling
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {

            switch (event.getKeyCode()) {

                case KeyEvent.KEYCODE_BACK:
                    finish();
                    return true;

                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                    if (player != null) {
                        if (player.isPlaying()) player.pause();
                        else player.play();
                    }
                    return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    // Lifecycle
    @Override
    protected void onResume() {
        super.onResume();
        if (player != null) player.play();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (player != null) player.pause();
    }

    @Override
    protected void onDestroy() {
        if (player != null) {
            player.release();
            player = null;
        }
        super.onDestroy();
    }
}
