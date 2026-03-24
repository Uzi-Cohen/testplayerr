package com.streamking.app.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.streamking.app.data.model.MediaItem
import com.streamking.app.local.ProgressStorage
import com.streamking.app.local.WatchlistStorage
import com.streamking.app.ui.components.ContentRow
import com.streamking.app.ui.components.HeroSection
import com.streamking.app.ui.theme.AccentRed
import com.streamking.app.ui.theme.Teal
import com.streamking.app.ui.theme.TextMid
import com.streamking.app.viewmodel.HomeRow
import com.streamking.app.viewmodel.HomeViewModel

@Composable
fun HomeScreen(
    onNavigateToWatch: (mediaType: String, id: Int) -> Unit,
) {
    val vm: HomeViewModel = viewModel()
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val progressStorage = remember { ProgressStorage(context) }
    val watchlistStorage = remember { WatchlistStorage(context) }

    // Watchlist row
    val watchlistItems = remember { watchlistStorage.getAll() }
    val watchlistRow = remember(watchlistItems) {
        if (watchlistItems.isEmpty()) null
        else HomeRow(
            "mylist", "♥ My List",
            watchlistItems.map {
                MediaItem(
                    id = it.id, title = it.title, mediaType = it.mediaType,
                    posterPath = it.posterPath, backdropPath = it.backdropPath,
                    voteAverage = it.voteAverage, releaseDate = it.releaseDate,
                    firstAirDate = it.firstAirDate,
                )
            }
        )
    }

    // Continue watching row
    val historyItems = remember { progressStorage.getHistory() }
    val continueRow = remember(historyItems) {
        if (historyItems.isEmpty()) null
        else HomeRow(
            "continue", "Continue Watching",
            historyItems.map {
                MediaItem(
                    id = it.id, mediaType = it.mediaType, title = it.title,
                    posterPath = it.posterPath,
                )
            }
        )
    }

    // Surprise Me
    val surpriseFn: () -> Unit = {
        val pool = state.rows.flatMap { it.items }
        if (pool.isNotEmpty()) {
            val pick = pool.random()
            onNavigateToWatch(pick.resolvedMediaType, pick.id)
        }
    }

    when {
        state.loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = Teal)
        }
        state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Error: ${state.error}", color = AccentRed)
        }
        else -> {
            val allRows = buildList {
                watchlistRow?.let { add(it) }
                continueRow?.let { add(it) }
                addAll(state.rows)
            }

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                // Hero
                item {
                    state.hero?.let { hero ->
                        HeroSection(
                            item = hero,
                            onWatch = { onNavigateToWatch(hero.resolvedMediaType, hero.id) },
                            onMoreInfo = { onNavigateToWatch(hero.resolvedMediaType, hero.id) },
                            onSurpriseMe = surpriseFn,
                        )
                    }
                }

                // Content rows
                itemsIndexed(allRows) { _, row ->
                    ContentRow(
                        title = row.title,
                        items = row.items,
                        progressStorage = progressStorage,
                        onItemClick = { item -> onNavigateToWatch(item.resolvedMediaType, item.id) },
                    )
                }

                item { Spacer(Modifier.height(80.dp)) }
            }
        }
    }
}
