package com.streamking.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.streamking.app.data.model.MediaItem
import com.streamking.app.ui.theme.*

@Composable
fun HeroSection(
    item: MediaItem,
    onWatch: () -> Unit,
    onMoreInfo: () -> Unit,
    onSurpriseMe: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(480.dp)
    ) {
        // Backdrop image
        AsyncImage(
            model = item.backdropUrl("w1280"),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize(),
        )

        // Gradient overlays
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0x33000000),
                            Color(0x00000000),
                            Color(0xCC000000),
                            BgDark,
                        )
                    )
                )
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        listOf(Color(0xCC000000), Color(0x00000000))
                    )
                )
        )

        // Content
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 40.dp, bottom = 40.dp, end = 200.dp)
        ) {
            // Badges
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Badge("★ Featured", BgDark.copy(alpha = 0.8f), Teal)
                Badge(
                    if (item.resolvedMediaType == "tv") "TV Series" else "Film",
                    BgDark.copy(alpha = 0.7f),
                    Color.White,
                )
            }

            Spacer(Modifier.height(12.dp))

            // Title
            Text(
                text = item.displayTitle,
                color = Color.White,
                fontSize = 38.sp,
                fontWeight = FontWeight.ExtraBold,
                lineHeight = 44.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )

            Spacer(Modifier.height(8.dp))

            // Rating + year
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (item.voteAverage > 0) {
                    Text("★ ${"%.1f".format(item.voteAverage)}", color = Teal, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
                if (item.displayDate.isNotEmpty()) {
                    Text(item.displayDate, color = TextMid, fontSize = 14.sp)
                }
            }

            Spacer(Modifier.height(8.dp))

            // Overview
            if (!item.overview.isNullOrBlank()) {
                Text(
                    text = item.overview,
                    color = TextMid,
                    fontSize = 13.sp,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                    lineHeight = 20.sp,
                )
            }

            Spacer(Modifier.height(20.dp))

            // Action buttons
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = onWatch,
                    colors = ButtonDefaults.buttonColors(containerColor = Teal, contentColor = BgDark),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 28.dp, vertical = 12.dp),
                ) {
                    Text("▶  Watch Now", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
                OutlinedButton(
                    onClick = onMoreInfo,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                ) {
                    Text("ℹ  More Info", fontSize = 14.sp)
                }
                OutlinedButton(
                    onClick = onSurpriseMe,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Teal),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                ) {
                    Text("🎲 Surprise Me", fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
private fun Badge(text: String, bg: Color, textColor: Color) {
    Box(
        modifier = Modifier
            .background(bg, RoundedCornerShape(4.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(text, color = textColor, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}
