package com.streamking.app.data.repository

import com.streamking.app.data.api.TmdbClient
import com.streamking.app.data.model.*

class TmdbRepository {
    private val api = TmdbClient.api

    // ── Home rows ─────────────────────────────────────────────────────────────
    suspend fun trending()          = api.trending().results.map { it.copy() }
    suspend fun popularMovies(p: Int = 1)   = api.popularMovies(p)
    suspend fun topRatedMovies(p: Int = 1)  = api.topRatedMovies(p)
    suspend fun nowPlayingMovies(p: Int = 1) = api.nowPlayingMovies(p)
    suspend fun popularTV(p: Int = 1)       = api.popularTV(p)
    suspend fun topRatedTV(p: Int = 1)      = api.topRatedTV(p)
    suspend fun airingTV(p: Int = 1)        = api.airingTV(p)

    // ── Discover ──────────────────────────────────────────────────────────────
    suspend fun discoverMovies(
        page: Int, genreId: Int?, sortBy: String, minRating: Double,
    ) = api.discoverMovies(
        page = page,
        genreId = genreId,
        sortBy = sortBy,
        minRating = minRating,
        minVotes = if (minRating > 0) 100 else 0,
    )

    suspend fun discoverTV(
        page: Int, genreId: Int?, sortBy: String, minRating: Double,
    ) = api.discoverTV(
        page = page,
        genreId = genreId,
        sortBy = sortBy,
        minRating = minRating,
        minVotes = if (minRating > 0) 50 else 0,
    )

    // ── Genre rows (for Home mood rows) ──────────────────────────────────────
    suspend fun moviesByGenre(genreId: Int) =
        api.discoverMovies(genreId = genreId).results

    suspend fun tvByGenre(genreId: Int) =
        api.discoverTV(genreId = genreId).results

    // ── Genres ───────────────────────────────────────────────────────────────
    suspend fun genreMovies() = api.genreMovies().genres
    suspend fun genreTV()     = api.genreTV().genres

    // ── Detail ───────────────────────────────────────────────────────────────
    suspend fun movieDetails(id: Int)         = api.movieDetails(id)
    suspend fun tvDetails(id: Int)            = api.tvDetails(id)
    suspend fun tvSeason(id: Int, season: Int) = api.tvSeason(id, season)
    suspend fun similarMovies(id: Int)        = api.similarMovies(id).results
    suspend fun similarTV(id: Int)            = api.similarTV(id).results

    // ── Search ───────────────────────────────────────────────────────────────
    suspend fun search(query: String, page: Int = 1) = api.search(query, page)
}
