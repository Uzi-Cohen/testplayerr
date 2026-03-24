import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaginatedTMDB } from '../hooks/useTMDB'
import { tmdb } from '../utils/tmdb'
import ContentGrid from '../components/ContentGrid'
import Navbar from '../components/Navbar'

const SORTS = [
  { label: 'Popular',   key: 'popularity' },
  { label: 'Top Rated', key: 'vote_average' },
  { label: 'Newest',    key: 'primary_release_date' },
]

const RATINGS = [
  { label: 'Any Rating', value: 0 },
  { label: '6+',         value: 6 },
  { label: '7+',         value: 7 },
  { label: '8+',         value: 8 },
]

export default function Movies() {
  const [genres,      setGenres]      = useState([])
  const [activeGenre, setActiveGenre] = useState(null)
  const [sortKey,     setSortKey]     = useState('popularity')
  const [minRating,   setMinRating]   = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    tmdb.genreMovies().then(d => setGenres(d.genres || [])).catch(() => {})
  }, [])

  const resetKey = `${sortKey}-${activeGenre}-${minRating}`
  const fetchFn  = (p) => tmdb.discoverMovies(p, activeGenre, `${sortKey}.desc`, minRating)
  const { items, loading, error, loadMore, hasMore } = usePaginatedTMDB(fetchFn, resetKey)

  return (
    <div className="tv-page">
      <Navbar />
      <div className="tv-page__header" style={{ paddingTop: 88 }}>
        <button className="tv-btn tv-btn--ghost" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="tv-page__title">Movies</h1>
        <div className="tv-sort-tabs">
          {SORTS.map(s => (
            <button
              key={s.key}
              data-tv-focus="nav"
              tabIndex={0}
              onClick={() => setSortKey(s.key)}
              className={`tv-sort-btn ${s.key === sortKey ? 'tv-sort-btn--active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre chips */}
      {genres.length > 0 && (
        <div className="tv-chips tv-row-scroll">
          <ChipBtn label="All" active={!activeGenre} onClick={() => setActiveGenre(null)} />
          {genres.map(g => (
            <ChipBtn
              key={g.id} label={g.name}
              active={activeGenre === g.id}
              onClick={() => setActiveGenre(activeGenre === g.id ? null : g.id)}
            />
          ))}
        </div>
      )}

      {/* Rating filter */}
      <div className="tv-chips tv-row-scroll" style={{ marginTop: 8 }}>
        <span className="tv-filter-label">Min Rating:</span>
        {RATINGS.map(r => (
          <ChipBtn
            key={r.value} label={r.label}
            active={minRating === r.value}
            onClick={() => setMinRating(r.value)}
          />
        ))}
      </div>

      <div className="tv-divider" />

      <ContentGrid
        items={items.map(i => ({ ...i, media_type: 'movie' }))}
        loading={loading} error={error} loadMore={loadMore} hasMore={hasMore}
      />
    </div>
  )
}

function ChipBtn({ label, active, onClick }) {
  return (
    <button
      data-tv-focus="nav"
      tabIndex={0}
      onClick={onClick}
      className={`tv-chip ${active ? 'tv-chip--active' : ''}`}
    >
      {label}
    </button>
  )
}
