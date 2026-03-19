import { useState } from 'react'
import { Link } from 'react-router-dom'
import { posterUrl, formatDate } from '../utils/tmdb'
import { getProgress } from '../utils/progress'

export default function MovieCard({ item }) {
  const [hovered, setHovered] = useState(false)

  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const poster = posterUrl(item.poster_path, 'w342')
  const progress = getProgress(mediaType, item.id)
  const progressPct = (progress?.progress || 0) * 100
  const starsOut5 = Math.round((item.vote_average || 0) / 2)

  return (
    <Link
      to={`/watch/${mediaType}/${item.id}`}
      className="group block card-2010"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative overflow-hidden" style={{ background: '#080c16' }}>
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.12)' : 'scale(1)' }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: '#1a2a40' }}>
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )}

        {/* Hover overlay — synopsis panel slides up */}
        <div className="absolute inset-0 flex flex-col justify-end transition-all duration-300"
          style={{
            background: 'linear-gradient(0deg, rgba(4,6,10,0.98) 0%, rgba(4,6,10,0.75) 45%, rgba(4,6,10,0.1) 100%)',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
          }}>
          <div className="p-2.5 space-y-1.5">

            {/* Play icon + title */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(180deg, #e03030, #9a1515)',
                  boxShadow: '0 0 12px rgba(200,30,30,0.7)',
                  border: '1px solid rgba(255,80,80,0.3)',
                }}>
                <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="font-display text-xs uppercase tracking-wide truncate"
                style={{ color: '#c8dcea', fontSize: '10px', letterSpacing: '0.08em' }}>
                {title}
              </span>
            </div>

            {/* Stars */}
            {item.vote_average > 0 && (
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className="w-2.5 h-2.5"
                    fill={s <= starsOut5 ? '#e8a020' : 'rgba(255,255,255,0.1)'} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span style={{ color: '#4a6a8a', fontSize: '9px' }}>{item.vote_average.toFixed(1)}</span>
              </div>
            )}

            {/* Overview */}
            {item.overview && (
              <p className="line-clamp-3 leading-snug" style={{ color: '#3a5872', fontSize: '9px' }}>
                {item.overview}
              </p>
            )}
          </div>
        </div>

        {/* Watch progress bar */}
        {progressPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="h-full" style={{
              width: `${Math.min(progressPct, 100)}%`,
              background: 'linear-gradient(90deg, #cc2200, #ff6040)',
              boxShadow: '0 0 6px rgba(200,60,0,0.8)',
            }} />
          </div>
        )}

        {/* HD badge */}
        <div className="absolute top-1.5 right-1.5">
          <span className="font-display font-bold px-1.5 py-0.5 rounded-sm"
            style={{
              background: 'rgba(0,0,0,0.75)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '8px',
              letterSpacing: '0.08em',
            }}>
            HD
          </span>
        </div>

        {/* TV badge */}
        {mediaType === 'tv' && (
          <div className="absolute top-1.5 left-1.5">
            <span className="font-display font-bold px-1.5 py-0.5 rounded-sm"
              style={{
                background: 'linear-gradient(135deg, #4a1a7a, #2a0a4a)',
                border: '1px solid rgba(140,60,200,0.4)',
                color: '#c87eff',
                fontSize: '8px',
                letterSpacing: '0.05em',
              }}>
              TV
            </span>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-2 py-2" style={{
        background: 'linear-gradient(180deg, #0c1420, #07090f)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <p className="text-xs font-display font-semibold truncate uppercase"
          style={{ color: hovered ? '#c8dcea' : '#7a9ab8', fontSize: '10px', letterSpacing: '0.07em', transition: 'color 0.2s' }}>
          {title}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span style={{ color: '#2a4060', fontSize: '9px' }}>{formatDate(date)}</span>
          {item.vote_average > 0 && (
            <span style={{ color: '#b07818', fontSize: '9px' }}>★ {item.vote_average.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
