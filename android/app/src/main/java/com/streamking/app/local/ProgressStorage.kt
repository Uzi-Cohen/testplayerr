package com.streamking.app.local

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

data class ProgressEntry(
    val id: Int = 0,
    val mediaType: String = "",
    val title: String = "",
    val posterPath: String? = null,
    val season: Int? = null,
    val episode: Int? = null,
    val progress: Float = 0f,   // 0.0 – 1.0
    val timestamp: Long = 0,    // seconds into video
    val savedAt: Long = 0,
)

class ProgressStorage(context: Context) {
    private val prefs = context.getSharedPreferences("streamking_progress", Context.MODE_PRIVATE)
    private val histPrefs = context.getSharedPreferences("streamking_history", Context.MODE_PRIVATE)
    private val gson = Gson()

    private fun progressKey(mediaType: String, id: Int, season: Int?, episode: Int?): String =
        if (mediaType == "tv") "tv_${id}_s${season}e${episode}" else "movie_$id"

    fun save(entry: ProgressEntry) {
        val key = progressKey(entry.mediaType, entry.id, entry.season, entry.episode)
        prefs.edit().putString(key, gson.toJson(entry)).apply()
        // update history
        val history = getHistory().toMutableList()
        history.removeAll { it.id == entry.id && it.mediaType == entry.mediaType }
        history.add(0, entry)
        histPrefs.edit().putString("list", gson.toJson(history.take(20))).apply()
    }

    fun get(mediaType: String, id: Int, season: Int? = null, episode: Int? = null): ProgressEntry? {
        val key = progressKey(mediaType, id, season, episode)
        val json = prefs.getString(key, null) ?: return null
        return gson.fromJson(json, ProgressEntry::class.java)
    }

    fun getHistory(): List<ProgressEntry> {
        val json = histPrefs.getString("list", null) ?: return emptyList()
        val type = object : TypeToken<List<ProgressEntry>>() {}.type
        return gson.fromJson(json, type) ?: emptyList()
    }

    fun removeFromHistory(mediaType: String, id: Int) {
        val history = getHistory().filter { !(it.id == id && it.mediaType == mediaType) }
        histPrefs.edit().putString("list", gson.toJson(history)).apply()
    }
}
