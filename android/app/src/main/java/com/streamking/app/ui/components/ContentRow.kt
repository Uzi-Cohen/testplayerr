package com.streamking.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.streamking.app.data.model.MediaItem
import com.streamking.app.local.ProgressStorage
import com.streamking.app.ui.theme.*

@Composable
fun ContentRow(
    title: String,
    items: List<MediaItem>,
    isActiveRow: Boolean = false,
    focusedIndex: Int = 0,
    progressStorage: ProgressStorage? = null,
    onItemClick: (MediaItem) -> Unit,
) {
    if (items.isEmpty()) return

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            color = if (isActiveRow) Teal else TextPrimary,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.sp,
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp),
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 24.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            itemsIndexed(items) { index, item ->
                val isFocused = isActiveRow && index == focusedIndex
                val progress = progressStorage?.get(
                    item.resolvedMediaType, item.id,
                )?.progress ?: 0f
                MediaCard(
                    posterUrl = item.posterUrl(),
                    title     = item.displayTitle,
                    year      = item.displayDate,
                    rating    = item.voteAverage,
                    mediaType = item.resolvedMediaType,
                    progress  = progress,
                    isFocused = isFocused,
                    onClick   = { onItemClick(item) },
                )
            }
        }

        Spacer(Modifier.height(8.dp))
    }
}
