import { useState, useEffect } from 'react'
import { usePaginatedTMDB } from '../hooks/useTMDB'
import { tmdb } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'

const SORTS = [
  { label: 'Popular', key: 'popularity' },
  { label: 'Top Rated', key: 'vote_average' },
  { label: 'New', key: 'primary_release_date' },
]

export default function Movies() {
  const [genres, setGenres] = useState([])
  const [activeGenre, setActiveGenre] = useState(null)
  const [sortKey, setSortKey] = useState('popularity')

  useEffect(() => {
    tmdb.genreMovies().then(d => setGenres(d.genres || [])).catch(() => {})
  }, [])

  const resetKey = `${sortKey}-${activeGenre}`
  const fetchFn = (p) => tmdb.discoverMovies(p, activeGenre, `${sortKey}.desc`)
  const { items, loading, error, loadMore, hasMore } = usePaginatedTMDB(fetchFn, resetKey)

  return (
    <div className="pt-20 max-w-7xl mx-auto px-3 sm:px-4 pb-12 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl uppercase tracking-wider"
          style={{ color: '#c8e8ff', textShadow: '0 0 20px rgba(26,127,212,0.4)' }}>
          Movies
        </h1>

        {/* Sort tabs */}
        <div className="flex gap-1.5 rounded p-1"
          style={{ background: 'rgba(13,22,38,0.9)', border: '1px solid rgba(26,127,212,0.2)' }}>
          {SORTS.map(s => (
            <button key={s.key} onClick={() => setSortKey(s.key)}
              className="px-3 py-1.5 text-xs rounded font-display uppercase tracking-wider transition-all"
              style={s.key === sortKey ? {
                background: 'linear-gradient(180deg, #1a7fd4, #0d4a8a)',
                color: '#fff',
                boxShadow: '0 0 10px rgba(26,127,212,0.5)',
              } : { color: '#3a5a7a' }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre chips */}
      {genres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <GenreChip label="All" active={!activeGenre} onClick={() => setActiveGenre(null)} />
          {genres.map(g => (
            <GenreChip key={g.id} label={g.name} active={activeGenre === g.id} onClick={() => setActiveGenre(g.id === activeGenre ? null : g.id)} />
          ))}
        </div>
      )}

      <div className="glow-divider" />

      <ContentGrid
        items={items.map(i => ({ ...i, media_type: 'movie' }))}
        loading={loading} error={error} loadMore={loadMore} hasMore={hasMore}
      />
    </div>
  )
}

function GenreChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1 rounded-full text-xs font-display uppercase tracking-wider transition-all"
      style={active ? {
        background: 'linear-gradient(135deg, #1a7fd4, #0d4a8a)',
        color: '#fff',
        border: '1px solid rgba(100,180,255,0.4)',
        boxShadow: '0 0 10px rgba(26,127,212,0.5)',
      } : {
        background: 'rgba(13,22,38,0.7)',
        color: '#2a5a8a',
        border: '1px solid rgba(26,127,212,0.15)',
      }}
    >
      {label}
    </button>
  )
}
