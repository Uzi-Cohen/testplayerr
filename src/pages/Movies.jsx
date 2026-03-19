import { useState } from 'react'
import { usePaginatedTMDB } from '../hooks/useTMDB'
import { tmdb } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'

const CATEGORIES = [
  { label: 'Popular', fn: (p) => tmdb.popularMovies(p) },
  { label: 'Top Rated', fn: (p) => tmdb.topRatedMovies(p) },
  { label: 'Now Playing', fn: (p) => tmdb.nowPlayingMovies(p) },
]

export default function Movies() {
  const [catIndex, setCatIndex] = useState(0)
  const { items, loading, error, loadMore, hasMore } = usePaginatedTMDB(CATEGORIES[catIndex].fn)

  return (
    <div className="pt-20 max-w-7xl mx-auto px-3 sm:px-4 pb-12 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl uppercase tracking-wider" style={{ color: '#c8e8ff', textShadow: '0 0 20px rgba(26,127,212,0.4)' }}>
          Movies
        </h1>
        <div className="flex gap-1.5 rounded p-1" style={{ background: 'rgba(13,22,38,0.9)', border: '1px solid rgba(26,127,212,0.2)' }}>
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setCatIndex(i)}
              className="px-3 py-1.5 text-xs rounded font-display uppercase tracking-wider transition-all"
              style={i === catIndex ? {
                background: 'linear-gradient(180deg, #1a7fd4, #0d4a8a)',
                color: '#fff',
                boxShadow: '0 0 10px rgba(26,127,212,0.5)',
              } : {
                color: '#3a5a7a',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="glow-divider" />
      <ContentGrid
        items={items.map(i => ({ ...i, media_type: 'movie' }))}
        loading={loading} error={error} loadMore={loadMore} hasMore={hasMore}
      />
    </div>
  )
}
