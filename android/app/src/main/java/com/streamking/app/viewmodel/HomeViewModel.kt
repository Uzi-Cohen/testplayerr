package com.streamking.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamking.app.data.model.MediaItem
import com.streamking.app.data.repository.TmdbRepository
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class HomeRow(val id: String, val title: String, val items: List<MediaItem>)

data class HomeState(
    val rows: List<HomeRow> = emptyList(),
    val hero: MediaItem? = null,
    val loading: Boolean = true,
    val error: String? = null,
)

class HomeViewModel : ViewModel() {
    private val repo = TmdbRepository()
    private val _state = MutableStateFlow(HomeState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() {
        viewModelScope.launch {
            _state.value = HomeState(loading = true)
            try {
                val trending       = async { repo.trending() }
                val popularMovies  = async { repo.popularMovies().results }
                val topRated       = async { repo.topRatedMovies().results }
                val nowPlaying     = async { repo.nowPlayingMovies().results }
                val popularTV      = async { repo.popularTV().results }
                val topRatedTV     = async { repo.topRatedTV().results }
                val airingTV       = async { repo.airingTV().results }
                val action         = async { repo.moviesByGenre(28) }
                val comedy         = async { repo.moviesByGenre(35) }
                val horror         = async { repo.moviesByGenre(27) }
                val scifi          = async { repo.moviesByGenre(878) }
                val thriller       = async { repo.moviesByGenre(53) }
                val drama          = async { repo.tvByGenre(18) }

                val trendingList = trending.await()
                val hero = trendingList.firstOrNull()

                fun tag(items: List<MediaItem>, mt: String) = items.take(20).map { it.copy(mediaType = mt) }

                val rows = buildList {
                    if (trendingList.size > 1)    add(HomeRow("trending",   "Trending This Week",      trendingList.drop(1).take(20)))
                    nowPlaying.await().let        { if (it.isNotEmpty()) add(HomeRow("now",      "Now Playing",            tag(it, "movie"))) }
                    topRated.await().let          { if (it.isNotEmpty()) add(HomeRow("top",      "Top Rated Movies",       tag(it, "movie"))) }
                    popularMovies.await().let     { if (it.isNotEmpty()) add(HomeRow("movies",   "Popular Movies",         tag(it, "movie"))) }
                    action.await().let            { if (it.isNotEmpty()) add(HomeRow("action",   "⚡ Action & Adventure",  tag(it, "movie"))) }
                    comedy.await().let            { if (it.isNotEmpty()) add(HomeRow("comedy",   "😄 Easy Watch",          tag(it, "movie"))) }
                    scifi.await().let             { if (it.isNotEmpty()) add(HomeRow("scifi",    "🚀 Sci-Fi",              tag(it, "movie"))) }
                    val dark = (horror.await() + thriller.await()).distinctBy { it.id }.take(20).map { it.copy(mediaType = "movie") }
                    if (dark.isNotEmpty())        add(HomeRow("dark",     "🔥 Dark & Intense",         dark))
                    popularTV.await().let         { if (it.isNotEmpty()) add(HomeRow("tv",       "Popular TV Shows",       tag(it, "tv"))) }
                    airingTV.await().let          { if (it.isNotEmpty()) add(HomeRow("airing",   "Airing Now",             tag(it, "tv"))) }
                    topRatedTV.await().let        { if (it.isNotEmpty()) add(HomeRow("topTV",    "Top Rated Series",       tag(it, "tv"))) }
                    drama.await().let             { if (it.isNotEmpty()) add(HomeRow("drama",    "Drama Series",           tag(it, "tv"))) }
                }

                _state.value = HomeState(rows = rows, hero = hero, loading = false)
            } catch (e: Exception) {
                _state.value = HomeState(loading = false, error = e.message)
            }
        }
    }
}
