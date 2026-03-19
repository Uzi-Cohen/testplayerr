import { Link } from 'react-router-dom'
import { posterUrl, formatDate } from '../utils/tmdb'
import { getProgress } from '../utils/progress'

export default function MovieCard({ item }) {
  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const poster = posterUrl(item.poster_path, 'w342')
  const progress = getProgress(mediaType, item.id)
  const progressPct = (progress?.progress || 0) * 100

  return (
    <Link to={`/watch/${mediaType}/${item.id}`} className="group block card-2010">
      {/* Poster */}
      <div className="aspect-[2/3] relative overflow-hidden" style={{ background: '#0a1220' }}>
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: '#1a3050' }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, rgba(5,10,20,0.1) 0%, rgba(5,10,20,0.7) 100%)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1a7fd4, #0d4a8a)',
              boxShadow: '0 0 20px rgba(26,127,212,0.8)',
              border: '2px solid rgba(126,207,255,0.5)',
            }}>
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Watch progress bar */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="h-full transition-all" style={{
              width: `${Math.min(progressPct, 100)}%`,
              background: 'linear-gradient(90deg, #1a7fd4, #7ecfff)',
              boxShadow: '0 0 6px rgba(26,159,255,0.8)',
            }} />
          </div>
        )}

        {/* HD badge */}
        <div className="absolute top-1.5 right-1.5">
          <span className="text-xs font-display font-bold px-1.5 py-0.5 rounded-sm"
            style={{
              background: 'linear-gradient(135deg, #1a4a7a, #0d2a4a)',
              border: '1px solid rgba(26,127,212,0.5)',
              color: '#7ecfff',
              fontSize: '9px',
              letterSpacing: '0.05em',
            }}>
            HD
          </span>
        </div>

        {/* TV badge */}
        {mediaType === 'tv' && (
          <div className="absolute top-1.5 left-1.5">
            <span className="text-xs font-display font-bold px-1.5 py-0.5 rounded-sm"
              style={{
                background: 'linear-gradient(135deg, #4a1a7a, #2a0a4a)',
                border: '1px solid rgba(106,26,154,0.5)',
                color: '#c87eff',
                fontSize: '9px',
                letterSpacing: '0.05em',
              }}>
              TV
            </span>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-2 py-2" style={{ background: 'linear-gradient(180deg, #0d1626, #080f1c)' }}>
        <p className="text-xs font-display font-semibold truncate uppercase tracking-wide"
          style={{ color: '#c8dcea' }}>
          {title}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs" style={{ color: '#3a5a7a', fontSize: '10px' }}>{formatDate(date)}</span>
          {item.vote_average > 0 && (
            <span className="text-xs" style={{ color: '#ffc107', fontSize: '10px' }}>
              ★ {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
