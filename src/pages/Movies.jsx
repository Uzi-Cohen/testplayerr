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
  const { items, loading, error, loadMore, hasMore } = usePaginatedTMDB(
    CATEGORIES[catIndex].fn
  )

  return (
    <div className="pt-20 max-w-7xl mx-auto px-3 sm:px-4 pb-12 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Movies</h1>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setCatIndex(i)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                i === catIndex ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <ContentGrid
        items={items.map(i => ({ ...i, media_type: 'movie' }))}
        loading={loading}
        error={error}
        loadMore={loadMore}
        hasMore={hasMore}
      />
    </div>
  )
}
