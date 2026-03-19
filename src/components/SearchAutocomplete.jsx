import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { tmdb, posterUrl, formatDate } from '../utils/tmdb'

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()

  // Debounced live search
  useEffect(() => {
    const q = query.trim()
    if (!q) { setResults([]); setOpen(false); return }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await tmdb.searchQuick(q)
        const filtered = data.results
          .filter(r => r.media_type !== 'person')
          .slice(0, 7)
        setResults(filtered)
        setOpen(true)
        setActiveIdx(-1)
      } catch { /* ignore */ }
      setLoading(false)
    }, 280)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        !dropdownRef.current?.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go = useCallback((item) => {
    const mt = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
    navigate(`/watch/${mt}/${item.id}`)
    setOpen(false)
    setQuery('')
  }, [navigate])

  const handleKeyDown = (e) => {
    if (!open && e.key !== 'Enter') return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && results[activeIdx]) {
        go(results[activeIdx])
      } else if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`)
        setOpen(false)
        setQuery('')
      }
    }
  }

  return (
    <div className="relative">
      {/* Input */}
      <div className="flex items-center gap-2 rounded px-3 py-1.5 transition-all"
        style={{
          background: 'rgba(8,15,28,0.95)',
          border: open ? '1px solid rgba(26,159,255,0.5)' : '1px solid rgba(26,127,212,0.2)',
          boxShadow: open ? '0 0 14px rgba(26,127,212,0.25)' : 'none',
          minWidth: open ? '220px' : '36px',
          transition: 'all 0.2s ease',
        }}>
        <svg className="w-4 h-4 shrink-0" style={{ color: open ? '#7ecfff' : '#2a4a6a' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search titles, actors..."
          className="bg-transparent text-sm outline-none w-0 focus:w-40 sm:focus:w-52 transition-all duration-200"
          style={{ color: '#c8e8ff', caretColor: '#1a9fff' }}
        />
        {loading && (
          <div className="w-3 h-3 rounded-full border border-transparent shrink-0 animate-spin"
            style={{ borderTopColor: '#1a9fff' }} />
        )}
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus() }}
            className="shrink-0 text-xs leading-none"
            style={{ color: '#2a4a6a' }}>✕</button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 mt-2 rounded overflow-hidden z-50"
          style={{
            width: '320px',
            background: 'linear-gradient(180deg, #0a1220 0%, #060d18 100%)',
            border: '1px solid rgba(26,127,212,0.35)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.9), 0 0 20px rgba(26,127,212,0.15)',
          }}
        >
          {/* Header */}
          <div className="px-3 py-1.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(26,127,212,0.15)', background: 'rgba(26,127,212,0.05)' }}>
            <span className="font-display text-xs uppercase tracking-widest" style={{ color: '#2a5a8a' }}>
              Suggestions
            </span>
            <span className="text-xs" style={{ color: '#1a3a5a' }}>{results.length} results</span>
          </div>

          {/* Results */}
          {results.map((item, i) => {
            const mt = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
            const title = item.title || item.name
            const date = item.release_date || item.first_air_date
            const poster = posterUrl(item.poster_path, 'w92')
            const isActive = i === activeIdx

            return (
              <button
                key={item.id}
                onClick={() => go(item)}
                onMouseEnter={() => setActiveIdx(i)}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 transition-all"
                style={{
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(26,127,212,0.25), rgba(26,127,212,0.05))'
                    : 'transparent',
                  borderLeft: isActive ? '2px solid #1a9fff' : '2px solid transparent',
                }}
              >
                {/* Poster thumbnail */}
                <div className="shrink-0 w-9 h-13 rounded overflow-hidden"
                  style={{ border: '1px solid rgba(26,127,212,0.2)', width: '36px', height: '52px' }}>
                  {poster
                    ? <img src={poster} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full" style={{ background: '#0d1626' }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display uppercase tracking-wide truncate"
                    style={{ color: isActive ? '#c8e8ff' : '#7a9db8' }}>
                    {title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-display text-xs px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                      style={{
                        fontSize: '9px',
                        background: mt === 'tv' ? 'rgba(106,26,154,0.4)' : 'rgba(26,127,212,0.3)',
                        border: mt === 'tv' ? '1px solid rgba(106,26,154,0.4)' : '1px solid rgba(26,127,212,0.3)',
                        color: mt === 'tv' ? '#c87eff' : '#7ecfff',
                      }}>
                      {mt === 'tv' ? 'TV' : 'Movie'}
                    </span>
                    {date && <span className="text-xs" style={{ color: '#2a4a6a' }}>{formatDate(date)}</span>}
                    {item.vote_average > 0 && (
                      <span className="text-xs" style={{ color: '#ffc107' }}>★ {item.vote_average.toFixed(1)}</span>
                    )}
                  </div>
                  {item.overview && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#1a3a5a' }}>
                      {item.overview}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <svg className="w-3.5 h-3.5 shrink-0 transition-opacity" style={{ color: '#1a4a7a', opacity: isActive ? 1 : 0 }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          })}

          {/* Footer: view all */}
          <button
            onClick={() => { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setOpen(false); setQuery('') }}
            className="flex items-center justify-between w-full px-3 py-2.5 transition-all group"
            style={{ borderTop: '1px solid rgba(26,127,212,0.15)', background: 'rgba(26,127,212,0.05)' }}
          >
            <span className="font-display text-xs uppercase tracking-widest" style={{ color: '#1a7fd4' }}>
              See all results for "{query}"
            </span>
            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" style={{ color: '#1a7fd4' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
