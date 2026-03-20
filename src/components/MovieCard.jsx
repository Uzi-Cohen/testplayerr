import { Link } from 'react-router-dom'
import { posterUrl, formatDate } from '../utils/tmdb'
import { getProgress } from '../utils/progress'

/**
 * MovieCard — supports both spatial-nav (data-tv-focus) and row-based nav (isActive prop).
 */
export default function MovieCard({ item, isActive = false }) {
  const mediaType    = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title        = item.title || item.name
  const date         = item.release_date || item.first_air_date
  const poster       = posterUrl(item.poster_path, 'w342')
  const progress     = getProgress(mediaType, item.id)
  const progressPct  = (progress?.progress || 0) * 100

  return (
    <Link
      to={`/watch/${mediaType}/${item.id}`}
      className={`tv-card ${isActive ? 'tv-card--active' : ''}`}
      data-tv-focus="card"
      tabIndex={0}
    >
      {/* Poster */}
      <div className="tv-card__poster">
        {poster ? (
          <img src={poster} alt={title} loading="lazy" className="tv-card__img" />
        ) : (
          <div className="tv-card__no-poster">🎬</div>
        )}

        {/* Active overlay — play icon */}
        <div className={`tv-card__overlay ${isActive ? 'tv-card__overlay--visible' : ''}`}>
          <div className="tv-card__play">▶</div>
        </div>

        {/* Watch progress */}
        {progressPct > 0 && (
          <div className="tv-card__progress-bar">
            <div style={{ width: `${Math.min(progressPct, 100)}%` }} />
          </div>
        )}

        {/* Type badge */}
        <div className={`tv-card__badge ${mediaType === 'tv' ? 'tv-card__badge--tv' : ''}`}>
          {mediaType === 'tv' ? 'TV' : 'HD'}
        </div>
      </div>

      {/* Info row */}
      <div className="tv-card__info">
        <p className="tv-card__title">{title}</p>
        <div className="tv-card__meta">
          {date && <span>{formatDate(date)}</span>}
          {item.vote_average > 0 && (
            <span className="tv-card__rating">★ {item.vote_average.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
