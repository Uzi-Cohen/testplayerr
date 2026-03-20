import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tmdb, posterUrl } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery  = searchParams.get('q') || ''
  const navigate      = useNavigate()

  const [query,        setQuery]        = useState(initialQuery)
  const [results,      setResults]      = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [page,         setPage]         = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)

  // Live suggestions
  const [suggestions,  setSuggestions]  = useState([])
  const [sugLoading,   setSugLoading]   = useState(false)
  const [showSug,      setShowSug]      = useState(false)
  const [sugIdx,       setSugIdx]       = useState(-1)  // -1 = input focused

  const inputRef  = useRef(null)
  const debouncedQuery = useDebounce(query, 320)

  // Auto-focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [])

  // Fetch live suggestions as user types
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) { setSuggestions([]); setShowSug(false); return }
    setSugLoading(true)
    tmdb.searchQuick(q)
      .then(data => {
        const items = (data.results || [])
          .filter(r => r.media_type !== 'person' && (r.poster_path || r.backdrop_path))
          .slice(0, 8)
        setSuggestions(items)
        setShowSug(items.length > 0)
        setSugIdx(-1)
      })
      .catch(() => {})
      .finally(() => setSugLoading(false))
  }, [debouncedQuery])

  // Full search
  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) return
    setLoading(true); setError(null)
    try {
      const data     = await tmdb.search(q, p)
      const filtered = data.results.filter(r => r.media_type !== 'person' && r.poster_path)
      setResults(prev => p === 1 ? filtered : [...prev, ...filtered])
      setTotalPages(data.total_pages)
      setPage(p)
    } catch (err) { setError(err.message) }
    finally      { setLoading(false) }
  }, [])

  useEffect(() => { if (initialQuery) doSearch(initialQuery, 1) }, [initialQuery, doSearch])

  const commitSearch = (q) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setShowSug(false)
    setSuggestions([])
    setResults([])
    setSearchParams({ q: trimmed })
    doSearch(trimmed, 1)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    commitSearch(query)
  }

  const pickSuggestion = (item) => {
    setShowSug(false)
    const type = item.media_type === 'tv' ? 'tv' : 'movie'
    navigate(`/watch/${type}/${item.id}`)
  }

  // D-pad navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSug || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSugIdx(i => Math.min(suggestions.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSugIdx(i => {
        if (i <= 0) { setShowSug(false); return -1 }
        return i - 1
      })
    } else if (e.key === 'Enter' && sugIdx >= 0) {
      e.preventDefault()
      pickSuggestion(suggestions[sugIdx])
    } else if (e.key === 'Escape') {
      setShowSug(false); setSugIdx(-1)
    }
  }

  return (
    <div className="tv-page search-page">
      <button className="tv-btn tv-btn--ghost search-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Search form + suggestions */}
      <div className="search-wrap">
        <form onSubmit={handleSubmit} className="tv-search-form">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); if (showSug) setSugIdx(-1) }}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 200)}
            placeholder="Search movies and TV shows…"
            className="tv-search-input"
            autoComplete="off"
          />
          <button type="submit" className="tv-btn tv-btn--primary tv-search-btn">
            {sugLoading ? '…' : 'Search'}
          </button>
        </form>

        {/* Live suggestions dropdown */}
        {showSug && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((item, i) => {
              const title = item.title || item.name
              const type  = item.media_type === 'tv' ? 'TV' : 'Movie'
              const year  = (item.release_date || item.first_air_date || '').slice(0, 4)
              return (
                <button
                  key={item.id}
                  className={`search-sug-item ${i === sugIdx ? 'search-sug-item--focused' : ''}`}
                  onMouseEnter={() => setSugIdx(i)}
                  onMouseDown={() => pickSuggestion(item)}
                >
                  {item.poster_path && (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt=""
                      className="search-sug-img"
                    />
                  )}
                  <span className="search-sug-title">{title}</span>
                  <span className="search-sug-meta">{type}{year ? ` · ${year}` : ''}</span>
                  {item.vote_average > 0 && (
                    <span className="search-sug-rating">★ {item.vote_average.toFixed(1)}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {initialQuery && (
        <p className="tv-search-label">
          Results for <strong className="accent">{initialQuery}</strong>
        </p>
      )}

      <div className="tv-divider" />

      <ContentGrid
        items={results}
        loading={loading}
        error={error}
        loadMore={() => doSearch(initialQuery, page + 1)}
        hasMore={page < totalPages}
        emptyMessage={initialQuery ? `No results for "${initialQuery}"` : 'Type above and press Search'}
      />
    </div>
  )
}
