import { useState } from 'react'
import { usePaginatedTMDB } from '../hooks/useTMDB'
import { tmdb } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'

const CATEGORIES = [
  { label: 'Popular', fn: (p) => tmdb.popularTV(p) },
  { label: 'Top Rated', fn: (p) => tmdb.topRatedTV(p) },
  { label: 'Airing Now', fn: (p) => tmdb.airingTV(p) },
]

export default function TVShows() {
  const [catIndex, setCatIndex] = useState(0)
  const { items, loading, error, loadMore, hasMore } = usePaginatedTMDB(CATEGORIES[catIndex].fn)

  return (
    <div className="pt-20 max-w-7xl mx-auto px-3 sm:px-4 pb-12 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl uppercase tracking-wider" style={{ color: '#c8e8ff', textShadow: '0 0 20px rgba(106,26,154,0.5)' }}>
          TV Shows
        </h1>
        <div className="flex gap-1.5 rounded p-1" style={{ background: 'rgba(13,22,38,0.9)', border: '1px solid rgba(106,26,154,0.2)' }}>
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setCatIndex(i)}
              className="px-3 py-1.5 text-xs rounded font-display uppercase tracking-wider transition-all"
              style={i === catIndex ? {
                background: 'linear-gradient(180deg, #6a1a9a, #4a0a7a)',
                color: '#fff',
                boxShadow: '0 0 10px rgba(106,26,154,0.5)',
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
        items={items.map(i => ({ ...i, media_type: 'tv' }))}
        loading={loading} error={error} loadMore={loadMore} hasMore={hasMore}
      />
    </div>
  )
}
