import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tmdb } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query,      setQuery]      = useState(initialQuery)
  const [results,    setResults]    = useState([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Auto-focus search input when the page opens — essential for TV
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(timer)
  }, [])

  const doSearch = async (q, p = 1) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data     = await tmdb.search(q, p)
      const filtered = data.results.filter(r => r.media_type !== 'person' && r.poster_path)
      setResults(prev => p === 1 ? filtered : [...prev, ...filtered])
      setTotalPages(data.total_pages)
      setPage(p)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (initialQuery) doSearch(initialQuery, 1) }, [initialQuery]) // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      setResults([])
      doSearch(query.trim(), 1)
    }
  }

  return (
    <div className="tv-page">
      {/* Back */}
      <button className="tv-btn tv-btn--ghost mb-6" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="tv-search-form">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies and TV shows…"
          className="tv-search-input"
          autoComplete="off"
        />
        <button type="submit" className="tv-btn tv-btn--primary tv-search-btn">
          Search
        </button>
      </form>

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
