import { Link } from 'react-router-dom'
import { backdropUrl, formatDate } from '../utils/tmdb'

export default function HeroSection({ item }) {
  if (!item) return null

  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const backdrop = backdropUrl(item.backdrop_path)

  return (
    <div className="relative w-full h-[50vh] sm:h-[65vh] min-h-[280px] overflow-hidden">
      {backdrop && (
        <img src={backdrop} alt={title} className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Heavy 2010s gradient overlays */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(90deg, rgba(5,10,20,0.97) 0%, rgba(5,10,20,0.75) 50%, rgba(5,10,20,0.2) 100%)'
      }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(0deg, rgba(5,10,20,1) 0%, rgba(5,10,20,0.4) 40%, transparent 70%)'
      }} />

      {/* Scanline texture overlay — classic 2010s vibe */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
      }} />

      {/* Lens flare accent */}
      <div className="absolute top-8 right-1/3 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{
        background: 'radial-gradient(circle, rgba(26,159,255,0.8) 0%, transparent 70%)',
        filter: 'blur(20px)',
      }} />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-3 sm:px-6 flex items-end pb-8 sm:pb-14">
        <div className="max-w-xl space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded"
              style={{
                background: mediaType === 'tv'
                  ? 'linear-gradient(135deg, #6a1a9a, #4a0a7a)'
                  : 'linear-gradient(135deg, #1a7fd4, #0d4a8a)',
                boxShadow: mediaType === 'tv'
                  ? '0 0 10px rgba(106,26,154,0.6)'
                  : '0 0 10px rgba(26,127,212,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
              {mediaType === 'tv' ? 'TV Series' : 'Movie'}
            </span>
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 text-sm font-bold" style={{ color: '#ffc107' }}>
                {'★'.repeat(Math.round(item.vote_average / 2))}
                <span className="text-xs font-body" style={{ color: '#aac0d0' }}>
                  {item.vote_average.toFixed(1)}/10
                </span>
              </span>
            )}
            {date && <span className="text-xs" style={{ color: '#6a8fad' }}>{formatDate(date)}</span>}
          </div>

          <h1 className="font-display font-bold leading-tight text-2xl sm:text-4xl md:text-5xl uppercase"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(26,127,212,0.2)', color: '#e8f4ff' }}>
            {title}
          </h1>

          {item.overview && (
            <p className="text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3"
              style={{ color: '#7a9db8' }}>
              {item.overview}
            </p>
          )}

          <Link to={`/watch/${mediaType}/${item.id}`} className="btn-glow">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Now
          </Link>
        </div>
      </div>
    </div>
  )
}
