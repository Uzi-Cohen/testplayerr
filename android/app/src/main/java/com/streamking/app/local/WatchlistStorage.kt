package com.streamking.app.local

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.streamking.app.data.model.MediaItem

data class WatchlistEntry(
    val id: Int = 0,
    val mediaType: String = "",
    val title: String = "",
    val posterPath: String? = null,
    val backdropPath: String? = null,
    val voteAverage: Double = 0.0,
    val releaseDate: String? = null,
    val firstAirDate: String? = null,
    val overview: String? = null,
    val addedAt: Long = 0,
) {
    fun posterUrl(size: String = "w342") = posterPath?.let { "https://image.tmdb.org/t/p/$size$it" }
    val displayDate: String get() = (releaseDate ?: firstAirDate)?.take(4) ?: ""
}

fun MediaItem.toWatchlistEntry() = WatchlistEntry(
    id = id,
    mediaType = resolvedMediaType,
    title = displayTitle,
    posterPath = posterPath,
    backdropPath = backdropPath,
    voteAverage = voteAverage,
    releaseDate = releaseDate,
    firstAirDate = firstAirDate,
    overview = overview,
    addedAt = System.currentTimeMillis(),
)

class WatchlistStorage(context: Context) {
    private val prefs = context.getSharedPreferences("streamking_watchlist", Context.MODE_PRIVATE)
    private val gson = Gson()
    private val listType = object : TypeToken<List<WatchlistEntry>>() {}.type

    private fun load(): List<WatchlistEntry> {
        val json = prefs.getString("list", null) ?: return emptyList()
        return gson.fromJson(json, listType) ?: emptyList()
    }

    private fun save(list: List<WatchlistEntry>) {
        prefs.edit().putString("list", gson.toJson(list)).apply()
    }

    fun getAll(): List<WatchlistEntry> = load()

    fun contains(mediaType: String, id: Int): Boolean =
        load().any { it.id == id && it.mediaType == mediaType }

    fun add(entry: WatchlistEntry) {
        val list = load().toMutableList()
        if (list.none { it.id == entry.id && it.mediaType == entry.mediaType }) {
            list.add(0, entry)
            save(list)
        }
    }

    fun remove(mediaType: String, id: Int) {
        save(load().filter { !(it.id == id && it.mediaType == mediaType) })
    }

    fun toggle(entry: WatchlistEntry): Boolean {
        return if (contains(entry.mediaType, entry.id)) {
            remove(entry.mediaType, entry.id); false
        } else {
            add(entry); true
        }
    }
}
