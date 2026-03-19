import { Link } from 'react-router-dom'
import { posterUrl, formatDate } from '../utils/tmdb'
import { getProgress } from '../utils/progress'

export default function MovieCard({ item }) {
  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  const title = item.title || item.name
  const date = item.release_date || item.first_air_date
  const poster = posterUrl(item.poster_path, 'w342')
  const progress = getProgress(mediaType, item.id)
  const progressPct = progress?.progress || 0

  return (
    <Link to={`/watch/${mediaType}/${item.id}`} className="group block">
      <div className="card-hover relative rounded-xl overflow-hidden bg-[#181818] border border-white/5">
        {/* Poster */}
        <div className="aspect-[2/3] relative overflow-hidden bg-[#242424]">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}

          {/* Watch progress bar */}
          {progressPct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(progressPct * 100, 100)}%` }}
              />
            </div>
          )}

          {/* Media type badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              mediaType === 'tv' ? 'bg-purple-600/90' : 'bg-blue-600/90'
            }`}>
              {mediaType === 'tv' ? 'TV' : 'Movie'}
            </span>
          </div>

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5">
          <p className="text-sm font-medium truncate text-white/90">{title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{formatDate(date)}</span>
            {item.vote_average > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {item.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
