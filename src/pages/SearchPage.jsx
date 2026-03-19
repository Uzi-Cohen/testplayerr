import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { tmdb } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const doSearch = async (q, p = 1) => {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await tmdb.search(q, p)
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

  useEffect(() => { if (initialQuery) doSearch(initialQuery, 1) }, [initialQuery])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      setResults([])
      doSearch(query.trim(), 1)
    }
  }

  return (
    <div className="pt-20 max-w-7xl mx-auto px-3 sm:px-4 pb-12 space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search movies and TV shows..."
          className="flex-1 text-sm outline-none px-4 py-3 rounded"
          style={{
            background: '#0d1626',
            border: '1px solid rgba(26,127,212,0.25)',
            color: '#c8e8ff',
            fontFamily: 'Open Sans, sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(26,159,255,0.6)'}
          onBlur={e => e.target.style.borderColor = 'rgba(26,127,212,0.25)'}
        />
        <button type="submit" className="btn-glow">Search</button>
      </form>

      {initialQuery && (
        <h1 className="font-display text-lg uppercase tracking-wider" style={{ color: '#3a5a7a' }}>
          Results for <span style={{ color: '#7ecfff' }}>"{initialQuery}"</span>
        </h1>
      )}

      <div className="glow-divider" />

      <ContentGrid
        items={results}
        loading={loading}
        error={error}
        loadMore={() => doSearch(initialQuery, page + 1)}
        hasMore={page < totalPages}
        emptyMessage={initialQuery ? `No results for "${initialQuery}"` : 'Search for movies and TV shows above'}
      />
    </div>
  )
}
