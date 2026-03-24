package com.streamking.app.ui.screen

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.streamking.app.NativePlayerActivity
import com.streamking.app.data.model.Episode
import com.streamking.app.data.model.MediaItem
import com.streamking.app.local.WatchlistStorage
import com.streamking.app.local.toWatchlistEntry
import com.streamking.app.ui.components.MediaCard
import com.streamking.app.ui.theme.*
import com.streamking.app.viewmodel.WatchViewModel

@Composable
fun WatchScreen(
    mediaType: String,
    id: Int,
    onBack: () -> Unit,
    onNavigateTo: (mediaType: String, id: Int) -> Unit,
) {
    val vm: WatchViewModel = viewModel()
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val watchlistStorage = remember { WatchlistStorage(context) }
    var inWatchlist by remember { mutableStateOf(watchlistStorage.contains(mediaType, id)) }
    val isTv = mediaType == "tv"

    LaunchedEffect(id, mediaType) { vm.load(id, isTv) }

    when {
        state.loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Teal)
        }
        state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(state.error ?: "Error", color = AccentRed)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onBack) { Text("← Back") }
            }
        }
        else -> {
            val details = state.details ?: return
            val scrollState = rememberScrollState()

            Box(modifier = Modifier.fillMaxSize()) {
                // Backdrop
                AsyncImage(
                    model = details.backdropUrl(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxWidth().height(380.dp),
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(380.dp)
                        .background(
                            Brush.verticalGradient(listOf(Color(0x22000000), BgDark))
                        )
                )

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                ) {
                    Spacer(Modifier.height(280.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BgDark)
                            .padding(horizontal = 24.dp)
                    ) {
                        Spacer(Modifier.height(16.dp))

                        // Title
                        Text(
                            text = details.displayTitle,
                            color = TextPrimary,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.ExtraBold,
                            lineHeight = 34.sp,
                        )

                        Spacer(Modifier.height(8.dp))

                        // Meta row
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (details.displayYear.isNotEmpty()) Text(details.displayYear, color = TextMid, fontSize = 14.sp)
                            details.formatRuntime()?.let { Text(it, color = TextMid, fontSize = 14.sp) }
                            if (details.voteAverage > 0) Text("★ ${"%.1f".format(details.voteAverage)}", color = Teal, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }

                        // Genres
                        if (details.genres.isNotEmpty()) {
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                details.genres.take(4).forEach { genre ->
                                    Box(
                                        modifier = Modifier
                                            .background(CardBg, RoundedCornerShape(4.dp))
                                            .padding(horizontal = 10.dp, vertical = 4.dp)
                                    ) {
                                        Text(genre.name, color = TextMid, fontSize = 12.sp)
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(16.dp))

                        // Overview
                        if (!details.overview.isNullOrBlank()) {
                            Text(details.overview, color = TextMid, fontSize = 14.sp, lineHeight = 22.sp)
                            Spacer(Modifier.height(20.dp))
                        }

                        // Action buttons
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (!isTv) {
                                Button(
                                    onClick = { openPlayer(context, buildVidkingUrl(mediaType, id)) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Teal, contentColor = BgDark),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 28.dp, vertical = 12.dp),
                                ) {
                                    Text("▶ Play", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                }
                            }

                            IconButton(
                                onClick = {
                                    val entry = MediaItem(
                                        id = id, mediaType = mediaType,
                                        title = details.title, name = details.name,
                                        posterPath = details.posterPath,
                                        backdropPath = details.backdropPath,
                                        voteAverage = details.voteAverage,
                                        releaseDate = details.releaseDate,
                                        firstAirDate = details.firstAirDate,
                                        overview = details.overview,
                                    ).toWatchlistEntry()
                                    inWatchlist = watchlistStorage.toggle(entry)
                                }
                            ) {
                                Icon(
                                    imageVector = if (inWatchlist) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                    contentDescription = if (inWatchlist) "Remove from My List" else "Add to My List",
                                    tint = if (inWatchlist) AccentRed else TextMid,
                                    modifier = Modifier.size(28.dp),
                                )
                            }
                        }

                        Spacer(Modifier.height(24.dp))

                        // TV: Season / Episode picker
                        if (isTv) {
                            TvPicker(
                                totalSeasons = details.numberOfSeasons,
                                selectedSeason = state.selectedSeason,
                                episodes = state.episodes,
                                onSelectSeason = { vm.selectSeason(id, it) },
                                onPlayEpisode = { ep ->
                                    val url = buildVidkingUrl(mediaType, id, state.selectedSeason, ep.episodeNumber)
                                    openPlayer(context, url)
                                },
                            )
                        }

                        // Similar
                        if (state.similar.isNotEmpty()) {
                            Spacer(Modifier.height(24.dp))
                            Text("More Like This", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(12.dp))
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(state.similar) { item ->
                                    MediaCard(
                                        posterUrl = item.posterUrl(),
                                        title     = item.displayTitle,
                                        year      = item.displayDate,
                                        rating    = item.voteAverage,
                                        mediaType = item.resolvedMediaType,
                                        onClick   = { onNavigateTo(item.resolvedMediaType, item.id) },
                                    )
                                }
                            }
                        }

                        Spacer(Modifier.height(80.dp))
                    }
                }

                // Back button
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.padding(top = 40.dp, start = 8.dp),
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.White,
                        modifier = Modifier.size(28.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun TvPicker(
    totalSeasons: Int,
    selectedSeason: Int,
    episodes: List<Episode>,
    onSelectSeason: (Int) -> Unit,
    onPlayEpisode: (Episode) -> Unit,
) {
    Column {
        Text("Season", color = TextDim, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            (1..totalSeasons).forEach { s ->
                val selected = s == selectedSeason
                Box(
                    modifier = Modifier
                        .background(if (selected) Teal else CardBg, RoundedCornerShape(6.dp))
                        .clickable { onSelectSeason(s) }
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                ) {
                    Text(
                        "S$s",
                        color = if (selected) BgDark else TextMid,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        fontSize = 13.sp,
                    )
                }
            }
        }

        if (episodes.isNotEmpty()) {
            Spacer(Modifier.height(16.dp))
            Text("Episodes", color = TextDim, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp)
            Spacer(Modifier.height(8.dp))
            episodes.forEach { ep ->
                EpisodeRow(ep = ep, onClick = { onPlayEpisode(ep) })
                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun EpisodeRow(ep: Episode, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(CardBg, RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Thumbnail
        Box(
            modifier = Modifier
                .width(100.dp)
                .aspectRatio(16f / 9f)
                .background(Surface, RoundedCornerShape(4.dp)),
            contentAlignment = Alignment.Center,
        ) {
            if (ep.stillPath != null) {
                AsyncImage(
                    model = ep.stillUrl(),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize().background(Surface, RoundedCornerShape(4.dp)),
                )
            } else {
                Text("▶", color = TextDim, fontSize = 20.sp)
            }
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                "E${ep.episodeNumber}  ${ep.name}",
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (ep.overview.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(ep.overview, color = TextDim, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }

        Text("▶", color = Teal, fontSize = 18.sp)
    }
}

private fun buildVidkingUrl(mediaType: String, id: Int, season: Int? = null, episode: Int? = null): String {
    return if (mediaType == "tv" && season != null && episode != null) {
        "https://www.vidking.net/embed/tv/$id/$season/$episode?autoPlay=true&nextEpisode=true"
    } else {
        "https://www.vidking.net/embed/movie/$id?autoPlay=true"
    }
}

private fun openPlayer(context: Context, url: String) {
    val intent = Intent(context, NativePlayerActivity::class.java).apply {
        putExtra("url", url)
    }
    context.startActivity(intent)
}
