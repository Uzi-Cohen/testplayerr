package com.streamking.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamking.app.data.model.Episode
import com.streamking.app.data.model.MediaDetails
import com.streamking.app.data.model.MediaItem
import com.streamking.app.data.repository.TmdbRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class WatchState(
    val details: MediaDetails? = null,
    val similar: List<MediaItem> = emptyList(),
    val episodes: List<Episode> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
    val selectedSeason: Int = 1,
    val loadingSeason: Boolean = false,
)

class WatchViewModel : ViewModel() {
    private val repo = TmdbRepository()
    private val _state = MutableStateFlow(WatchState())
    val state = _state.asStateFlow()

    fun load(id: Int, isTv: Boolean) {
        viewModelScope.launch {
            _state.value = WatchState(loading = true)
            try {
                val details = if (isTv) repo.tvDetails(id) else repo.movieDetails(id)
                val similar = if (isTv) repo.similarTV(id) else repo.similarMovies(id)
                _state.value = WatchState(
                    details = details,
                    similar = similar.map { it.copy(mediaType = if (isTv) "tv" else "movie") }.take(8),
                    loading = false,
                )
                if (isTv) loadSeason(id, 1)
            } catch (e: Exception) {
                _state.value = WatchState(loading = false, error = e.message)
            }
        }
    }

    fun selectSeason(id: Int, season: Int) {
        _state.value = _state.value.copy(selectedSeason = season)
        loadSeason(id, season)
    }

    private fun loadSeason(id: Int, season: Int) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loadingSeason = true)
            try {
                val data = repo.tvSeason(id, season)
                _state.value = _state.value.copy(episodes = data.episodes, loadingSeason = false)
            } catch (_: Exception) {
                _state.value = _state.value.copy(loadingSeason = false, episodes = emptyList())
            }
        }
    }
}
