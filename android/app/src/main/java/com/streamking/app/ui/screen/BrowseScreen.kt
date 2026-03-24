package com.streamking.app.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel
import com.streamking.app.ui.components.MediaCard
import com.streamking.app.ui.theme.*
import com.streamking.app.viewmodel.BrowseViewModel

private val SORT_OPTIONS = listOf(
    "popularity"   to "Popular",
    "vote_average" to "Top Rated",
    "release_date" to "Newest",
)
private val RATING_OPTIONS = listOf(0.0 to "Any", 6.0 to "6+", 7.0 to "7+", 8.0 to "8+")

@Composable
fun BrowseScreen(
    isTv: Boolean,
    onItemClick: (mediaType: String, id: Int) -> Unit,
) {
    val vm: BrowseViewModel = viewModel(
        key = if (isTv) "tv" else "movie",
        factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>) = BrowseViewModel(isTv) as T
        }
    )
    val state by vm.state.collectAsState()
    val gridState = rememberLazyGridState()

    // Load more when near the end
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisible = gridState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisible >= state.items.size - 6 && state.hasMore && !state.loading
        }
    }
    LaunchedEffect(shouldLoadMore) { if (shouldLoadMore) vm.loadMore() }

    Column(modifier = Modifier.fillMaxSize()) {
        // Sort tabs
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(SORT_OPTIONS) { (key, label) ->
                FilterChip(key, label, selected = state.sortBy == key) { vm.setSort(key) }
            }
        }

        // Genre chips
        if (state.genres.isNotEmpty()) {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                item { FilterChip(null, "All", selected = state.activeGenre == null) { vm.setGenre(null) } }
                items(state.genres) { genre ->
                    FilterChip(genre.id, genre.name, selected = state.activeGenre == genre.id) { vm.setGenre(genre.id) }
                }
            }
            Spacer(Modifier.height(8.dp))
        }

        // Rating filter
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Rating:", color = TextDim, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            RATING_OPTIONS.forEach { (rating, label) ->
                FilterChip(rating, label, selected = state.minRating == rating) { vm.setMinRating(rating) }
            }
        }

        Spacer(Modifier.height(8.dp))
        HorizontalDivider(color = Border, thickness = 1.dp)
        Spacer(Modifier.height(8.dp))

        // Grid
        LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 140.dp),
            state = gridState,
            contentPadding = PaddingValues(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.weight(1f),
        ) {
            items(state.items) { item ->
                MediaCard(
                    posterUrl = item.posterUrl(),
                    title     = item.displayTitle,
                    year      = item.displayDate,
                    rating    = item.voteAverage,
                    mediaType = item.resolvedMediaType,
                    onClick   = { onItemClick(item.resolvedMediaType, item.id) },
                )
            }
            if (state.loading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Teal, modifier = Modifier.size(24.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun <T> FilterChip(value: T, label: String, selected: Boolean, onClick: () -> Unit) {
    val bg = if (selected) Teal else CardBg
    val textColor = if (selected) BgDark else TextMid
    Box(
        modifier = Modifier
            .background(bg, RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 6.dp),
    ) {
        Text(label, color = textColor, fontSize = 13.sp, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal)
    }
}
