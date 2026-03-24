package com.streamking.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.streamking.app.data.model.MediaItem
import com.streamking.app.data.repository.TmdbRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@OptIn(FlowPreview::class)
class SearchViewModel : ViewModel() {
    private val repo = TmdbRepository()

    private val _query = MutableStateFlow("")
    val query = _query.asStateFlow()

    private val _results = MutableStateFlow<List<MediaItem>>(emptyList())
    val results = _results.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading = _loading.asStateFlow()

    init {
        viewModelScope.launch {
            _query
                .debounce(350)
                .distinctUntilChanged()
                .collectLatest { q ->
                    if (q.isBlank()) { _results.value = emptyList(); return@collectLatest }
                    _loading.value = true
                    try {
                        val page = repo.search(q)
                        _results.value = page.results.filter {
                            it.mediaType != "person" && it.posterPath != null
                        }
                    } catch (_: Exception) {
                        _results.value = emptyList()
                    }
                    _loading.value = false
                }
        }
    }

    fun setQuery(q: String) { _query.value = q }
}
