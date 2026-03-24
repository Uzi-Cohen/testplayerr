package com.streamking.app.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.streamking.app.local.ProgressStorage
import com.streamking.app.local.WatchlistStorage

@Composable
fun WatchlistScreen(onItemClick: (mediaType: String, id: Int) -> Unit) {
    val context = LocalContext.current
    val watchlistStorage = remember { WatchlistStorage(context) }
    val progressStorage  = remember { ProgressStorage(context) }
    var refresh by remember { mutableStateOf(0) }
    val watchlist = remember(refresh) { watchlistStorage.getAll() }
    val history   = remember(refresh) { progressStorage.getHistory() }

    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 140.dp),
        contentPadding = PaddingValues(16.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // My List header
        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
            SectionHeader("♥ My List")
        }

        if (watchlist.isEmpty()) {
            item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
                Text("Nothing saved — tap ♥ on any title.", color = com.streamking.app.ui.theme.TextDim, modifier = Modifier.padding(8.dp))
            }
        } else {
            items(watchlist, key = { "${it.mediaType}-${it.id}" }) { entry ->
                Box {
                    // Card
                    Column(
                        modifier = Modifier
                            .width(150.dp)
                            .clickable { onItemClick(entry.mediaType, entry.id) }
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(2f / 3f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(com.streamking.app.ui.theme.CardBg)
                        ) {
                            if (entry.posterPath != null) {
                                AsyncImage(
                                    model = entry.posterUrl(),
                                    contentDescription = entry.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                )
                            } else {
                                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Text("🎬", fontSize = 32.sp)
                                }
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(entry.title, color = com.streamking.app.ui.theme.TextPrimary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(entry.displayDate, color = com.streamking.app.ui.theme.TextDim, fontSize = 11.sp)
                    }

                    // Remove button
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(22.dp)
                            .background(com.streamking.app.ui.theme.AccentRed, CircleShape)
                            .clickable { watchlistStorage.remove(entry.mediaType, entry.id); refresh++ },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("✕", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Continue Watching header
        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
            Spacer(Modifier.height(16.dp))
            SectionHeader("Continue Watching")
        }

        if (history.isEmpty()) {
            item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
                Text("No watch history yet.", color = com.streamking.app.ui.theme.TextDim, modifier = Modifier.padding(8.dp))
            }
        } else {
            items(history, key = { "${it.mediaType}-${it.id}" }) { entry ->
                Box {
                    Column(
                        modifier = Modifier
                            .width(150.dp)
                            .clickable { onItemClick(entry.mediaType, entry.id) }
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(2f / 3f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(com.streamking.app.ui.theme.CardBg)
                        ) {
                            if (entry.posterPath != null) {
                                AsyncImage(
                                    model = "https://image.tmdb.org/t/p/w342${entry.posterPath}",
                                    contentDescription = entry.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                )
                            } else {
                                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    Text("🎬", fontSize = 32.sp)
                                }
                            }
                            // Progress bar
                            val pct = entry.progress
                            if (pct > 0f) {
                                Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(3.dp).background(Color(0x44FFFFFF))) {
                                    Box(Modifier.fillMaxHeight().fillMaxWidth(pct.coerceIn(0f, 1f)).background(com.streamking.app.ui.theme.Teal))
                                }
                            }
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(entry.title, color = com.streamking.app.ui.theme.TextPrimary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        val pct = (entry.progress * 100).toInt()
                        Text(if (pct > 0) "$pct% watched" else "Started", color = com.streamking.app.ui.theme.TextDim, fontSize = 11.sp)
                    }

                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(22.dp)
                            .background(com.streamking.app.ui.theme.AccentRed, CircleShape)
                            .clickable { progressStorage.removeFromHistory(entry.mediaType, entry.id); refresh++ },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("✕", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        item(span = { androidx.compose.foundation.lazy.grid.GridItemSpan(maxLineSpan) }) {
            Spacer(Modifier.height(80.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        color = com.streamking.app.ui.theme.TextPrimary,
        fontSize = 18.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(bottom = 8.dp),
    )
}
