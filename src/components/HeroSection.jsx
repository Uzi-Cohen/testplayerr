import { Link } from 'react-router-dom'
import { backdropUrl, formatDate } from '../utils/tmdb'

export default function HeroSection({ item }) {
  if (!item) return null

  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const backdrop = backdropUrl(item.backdrop_path)

  return (
    <div className="relative w-full h-[70vh] min-h-[400px] overflow-hidden">
      {/* Backdrop */}
      {backdrop && (
        <img
          src={backdrop}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex items-end pb-16">
        <div className="max-w-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              mediaType === 'tv' ? 'bg-purple-600' : 'bg-blue-600'
            }`}>
              {mediaType === 'tv' ? 'TV Show' : 'Movie'}
            </span>
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {item.vote_average.toFixed(1)}
              </span>
            )}
            <span className="text-sm text-gray-400">{formatDate(date)}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight">{title}</h1>

          {item.overview && (
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{item.overview}</p>
          )}

          <Link
            to={`/watch/${mediaType}/${item.id}`}
            className="btn-primary bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Now
          </Link>
        </div>
      </div>
    </div>
  )
}
