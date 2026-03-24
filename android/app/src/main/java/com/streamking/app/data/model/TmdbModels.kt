package com.streamking.app.data.model

import com.google.gson.annotations.SerializedName

// ── Generic page wrapper ──────────────────────────────────────────────────────

data class TmdbPage<T>(
    val page: Int = 1,
    val results: List<T> = emptyList(),
    @SerializedName("total_pages") val totalPages: Int = 1,
)

// ── Media item (card in a row) ────────────────────────────────────────────────

data class MediaItem(
    val id: Int = 0,
    val title: String? = null,
    val name: String? = null,
    @SerializedName("poster_path")   val posterPath: String? = null,
    @SerializedName("backdrop_path") val backdropPath: String? = null,
    @SerializedName("vote_average")  val voteAverage: Double = 0.0,
    @SerializedName("release_date")  val releaseDate: String? = null,
    @SerializedName("first_air_date") val firstAirDate: String? = null,
    @SerializedName("media_type")    val mediaType: String? = null,
    val overview: String? = null,
) {
    val displayTitle: String get() = title ?: name ?: ""
    val displayDate: String get() = (releaseDate ?: firstAirDate)?.take(4) ?: ""
    val resolvedMediaType: String get() = when {
        mediaType != null  -> mediaType
        name != null       -> "tv"
        else               -> "movie"
    }
    fun posterUrl(size: String = "w342") = posterPath?.let { "https://image.tmdb.org/t/p/$size$it" }
    fun backdropUrl(size: String = "w1280") = backdropPath?.let { "https://image.tmdb.org/t/p/$size$it" }
}

// ── Full detail response ──────────────────────────────────────────────────────

data class Genre(val id: Int, val name: String)

data class MediaDetails(
    val id: Int = 0,
    val title: String? = null,
    val name: String? = null,
    @SerializedName("poster_path")    val posterPath: String? = null,
    @SerializedName("backdrop_path")  val backdropPath: String? = null,
    @SerializedName("vote_average")   val voteAverage: Double = 0.0,
    @SerializedName("release_date")   val releaseDate: String? = null,
    @SerializedName("first_air_date") val firstAirDate: String? = null,
    val overview: String? = null,
    val genres: List<Genre> = emptyList(),
    val runtime: Int? = null,
    @SerializedName("number_of_seasons") val numberOfSeasons: Int = 1,
) {
    val displayTitle: String get() = title ?: name ?: ""
    val displayYear: String get() = (releaseDate ?: firstAirDate)?.take(4) ?: ""
    val isTv: Boolean get() = name != null && title == null
    fun posterUrl(size: String = "w342") = posterPath?.let { "https://image.tmdb.org/t/p/$size$it" }
    fun backdropUrl(size: String = "w1280") = backdropPath?.let { "https://image.tmdb.org/t/p/$size$it" }
    fun formatRuntime(): String? {
        val r = runtime ?: return null
        val h = r / 60; val m = r % 60
        return if (h > 0) "${h}h ${m}m" else "${m}m"
    }
}

// ── Season / Episode ──────────────────────────────────────────────────────────

data class Episode(
    @SerializedName("episode_number") val episodeNumber: Int = 0,
    val name: String = "",
    val overview: String = "",
    @SerializedName("still_path") val stillPath: String? = null,
) {
    fun stillUrl() = stillPath?.let { "https://image.tmdb.org/t/p/w300$it" }
}

data class SeasonDetails(
    @SerializedName("season_number") val seasonNumber: Int = 0,
    val episodes: List<Episode> = emptyList(),
)

// ── Genre list ────────────────────────────────────────────────────────────────

data class GenreList(val genres: List<Genre> = emptyList())
