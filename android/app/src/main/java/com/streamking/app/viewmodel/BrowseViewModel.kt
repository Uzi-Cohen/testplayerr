package com.streamking.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamking.app.data.model.Genre
import com.streamking.app.data.model.MediaItem
import com.streamking.app.data.repository.TmdbRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BrowseState(
    val genres: List<Genre> = emptyList(),
    val items: List<MediaItem> = emptyList(),
    val loading: Boolean = false,
    val error: String? = null,
    val hasMore: Boolean = true,
    val page: Int = 1,
    val activeGenre: Int? = null,
    val sortBy: String = "popularity",
    val minRating: Double = 0.0,
)

class BrowseViewModel(private val isTv: Boolean) : ViewModel() {
    private val repo = TmdbRepository()
    private val _state = MutableStateFlow(BrowseState(loading = true))
    val state = _state.asStateFlow()

    init {
        loadGenres()
        fetchPage(reset = true)
    }

    private fun loadGenres() {
        viewModelScope.launch {
            try {
                val genres = if (isTv) repo.genreTV() else repo.genreMovies()
                _state.value = _state.value.copy(genres = genres)
            } catch (_: Exception) {}
        }
    }

    fun setGenre(genreId: Int?) {
        _state.value = _state.value.copy(activeGenre = genreId, items = emptyList(), page = 1, hasMore = true)
        fetchPage(reset = true)
    }

    fun setSort(sort: String) {
        _state.value = _state.value.copy(sortBy = sort, items = emptyList(), page = 1, hasMore = true)
        fetchPage(reset = true)
    }

    fun setMinRating(rating: Double) {
        _state.value = _state.value.copy(minRating = rating, items = emptyList(), page = 1, hasMore = true)
        fetchPage(reset = true)
    }

    fun loadMore() {
        if (_state.value.loading || !_state.value.hasMore) return
        fetchPage(reset = false)
    }

    private fun fetchPage(reset: Boolean) {
        viewModelScope.launch {
            val current = _state.value
            val page = if (reset) 1 else current.page
            _state.value = current.copy(loading = true)
            try {
                val sortBy = "${current.sortBy}.desc"
                val result = if (isTv) {
                    repo.discoverTV(page, current.activeGenre, sortBy, current.minRating)
                } else {
                    repo.discoverMovies(page, current.activeGenre, sortBy, current.minRating)
                }
                val mt = if (isTv) "tv" else "movie"
                val newItems = result.results.map { it.copy(mediaType = mt) }
                _state.value = _state.value.copy(
                    items = if (reset) newItems else _state.value.items + newItems,
                    loading = false,
                    page = page + 1,
                    hasMore = page < result.totalPages,
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(loading = false, error = e.message)
            }
        }
    }
}
