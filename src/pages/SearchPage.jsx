import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { tmdb } from '../utils/tmdb'
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
  const navigate  = useNavigate()
  const inputRef  = useRef(null)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const debouncedQuery = useDebounce(query, 350)

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [])

  // Search as you type
  useEffect(() => {
    const q = debouncedQuery.trim()
    if (!q) { setResults([]); setLoading(false); return }
    setLoading(true)
    setError(null)
    tmdb.search(q)
      .then(data => {
        setResults(data.results.filter(r => r.media_type !== 'person' && r.poster_path))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  return (
    <div className="tv-page search-page">
      <button className="tv-btn tv-btn--ghost search-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search movies and TV shows…"
        className="tv-search-input"
        autoComplete="off"
        style={{ marginBottom: '20px' }}
      />

      <ContentGrid
        items={results}
        loading={loading}
        error={error}
        emptyMessage={query.trim() ? `No results for "${query}"` : 'Start typing to search…'}
      />
    </div>
  )
}
