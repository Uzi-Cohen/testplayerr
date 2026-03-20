import { Link } from 'react-router-dom'
import { backdropUrl, posterUrl, formatDate } from '../utils/tmdb'

function ratingLabel(v) {
  if (!v) return null
  if (v >= 8) return 'PG'
  if (v >= 6.5) return 'PG-13'
  return 'R'
}

export default function HeroSection({ item }) {
  if (!item) return null

  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const backdrop = backdropUrl(item.backdrop_path, 'w1280')
  const poster = posterUrl(item.poster_path, 'w342')
  const rating = ratingLabel(item.vote_average)
  const starsOut5 = Math.round((item.vote_average || 0) / 2)

  return (
    <div className="relative w-full overflow-hidden"
      style={{ minHeight: '520px', height: '70vh', maxHeight: '700px' }}>

      {/* Backdrop */}
      {backdrop && (
        <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 20%' }} />
      )}

      {/* Multi-layer vignette */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(90deg, rgba(5,7,12,0.97) 0%, rgba(5,7,12,0.75) 45%, rgba(5,7,12,0.25) 70%, rgba(5,7,12,0.65) 100%)'
      }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(0deg, rgba(5,7,12,1) 0%, rgba(5,7,12,0.5) 38%, transparent 68%)'
      }} />
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, rgba(5,7,12,0.55) 0%, transparent 22%)'
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 62% 50%, transparent 28%, rgba(0,0,0,0.55) 100%)'
      }} />

      {/* Dense grain on hero */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '160px 160px',
        opacity: 0.05,
        mixBlendMode: 'overlay',
      }} />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-end pb-10 sm:pb-16">
        <div className="flex items-end gap-6 sm:gap-10 w-full">

          {/* Poster card — hidden on mobile */}
          {poster && (
            <div className="hidden sm:block shrink-0 w-32 md:w-40 self-end rounded-sm overflow-hidden"
              style={{
                boxShadow: '0 10px 50px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.07)',
              }}>
              <img src={poster} alt={title} className="w-full block" />
            </div>
          )}

          {/* Text */}
          <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold uppercase tracking-widest text-white px-2.5 py-1 rounded-sm"
                style={{
                  fontSize: '9px', letterSpacing: '0.2em',
                  background: 'linear-gradient(180deg, #cc2200, #880e00)',
                  boxShadow: '0 0 12px rgba(200,40,0,0.65)',
                  border: '1px solid rgba(255,80,40,0.3)',
                }}>
                ★ Featured
              </span>

              <span className="font-display font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm"
                style={{
                  fontSize: '9px', letterSpacing: '0.15em',
                  background: mediaType === 'tv' ? 'linear-gradient(180deg, #5a1a8a, #3a0a60)' : 'linear-gradient(180deg, #1a5a9a, #0d3a6a)',
                  border: mediaType === 'tv' ? '1px solid rgba(140,60,200,0.35)' : '1px solid rgba(60,140,220,0.35)',
                  color: mediaType === 'tv' ? '#d0a0ff' : '#90c8ff',
                }}>
                {mediaType === 'tv' ? 'TV Series' : 'Film'}
              </span>

              {rating && (
                <span className="font-display font-bold uppercase px-2 py-0.5 rounded-sm"
                  style={{
                    fontSize: '9px', letterSpacing: '0.1em',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                  {rating}
                </span>
              )}

              {date && (
                <span className="text-xs font-display" style={{ color: '#3a5a7a', letterSpacing: '0.05em' }}>
                  {formatDate(date)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-display font-bold leading-none uppercase"
              style={{
                fontSize: 'clamp(1.8rem, 5vw, 3.8rem)',
                color: '#e0ecff',
                textShadow: '0 2px 40px rgba(0,0,0,1), 0 0 80px rgba(0,0,0,0.8)',
                letterSpacing: '0.04em',
              }}>
              {title}
            </h1>

            {/* Stars */}
            {item.vote_average > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-3.5 h-3.5"
                      fill={s <= starsOut5 ? '#e8a020' : 'rgba(255,255,255,0.1)'} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-display" style={{ color: '#4a6a8a', letterSpacing: '0.05em' }}>
                  {item.vote_average.toFixed(1)} / 10
                </span>
              </div>
            )}

            {/* Overview */}
            {item.overview && (
              <p className="leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-xl"
                style={{ color: '#4a6880', fontSize: '0.82rem', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                {item.overview}
              </p>
            )}

            {/* Buttons — focusable via D-pad */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                to={`/watch/${mediaType}/${item.id}`}
                data-tv-focus="nav"
                tabIndex={0}
                className="btn-red"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Now
              </Link>
              <Link
                to={`/watch/${mediaType}/${item.id}`}
                data-tv-focus="nav"
                tabIndex={0}
                className="btn-glow"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                More Info
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Film-strip bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{ height: '8px', background: '#040608', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex h-full">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="flex-1 h-full" style={{
              background: i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
