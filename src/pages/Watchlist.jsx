import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWatchlist, removeFromWatchlist } from '../utils/watchlist'
import { getWatchHistory, removeFromHistory } from '../utils/progress'
import { posterUrl, formatDate } from '../utils/tmdb'
import Navbar from '../components/Navbar'

export default function Watchlist() {
  const navigate = useNavigate()
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const watchlist = getWatchlist()
  const history   = getWatchHistory()

  function removeFromContinue(item) {
    const mt = item.mediaType || item.media_type
    removeFromHistory(mt, item.id)
    refresh()
  }

  return (
    <div className="tv-page" style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ padding: '100px 48px 48px' }}>
        {/* My List */}
        <section style={{ marginBottom: 56 }}>
          <h2 className="wl-section-title">My List</h2>
          {watchlist.length === 0 ? (
            <p className="wl-empty">Nothing saved yet — hit the ♥ on any title to add it here.</p>
          ) : (
            <div className="wl-grid">
              {watchlist.map(item => {
                const mt    = item.mediaType || item.media_type
                const title = item.title || item.name
                const poster = posterUrl(item.poster_path, 'w342')
                return (
                  <div key={`${mt}-${item.id}`} className="wl-card">
                    <button className="wl-card__img-wrap" onClick={() => navigate(`/watch/${mt}/${item.id}`)}>
                      {poster
                        ? <img src={poster} alt={title} className="wl-card__img" />
                        : <div className="wl-card__no-poster">🎬</div>
                      }
                      <div className="wl-card__play-overlay">▶</div>
                    </button>
                    <div className="wl-card__info">
                      <p className="wl-card__title">{title}</p>
                      <p className="wl-card__meta">
                        {mt === 'tv' ? 'TV' : 'Film'}
                        {item.release_date || item.first_air_date ? ` · ${formatDate(item.release_date || item.first_air_date)}` : ''}
                        {item.vote_average > 0 ? ` · ★ ${item.vote_average.toFixed(1)}` : ''}
                      </p>
                    </div>
                    <button
                      className="wl-card__remove"
                      onClick={() => { removeFromWatchlist(mt, item.id); refresh() }}
                      title="Remove from My List"
                    >✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Continue Watching */}
        <section>
          <h2 className="wl-section-title">Continue Watching</h2>
          {history.length === 0 ? (
            <p className="wl-empty">No watch history yet.</p>
          ) : (
            <div className="wl-grid">
              {history.map(item => {
                const mt    = item.mediaType
                const title = item.title || item.name
                const poster = posterUrl(item.poster_path, 'w342')
                const pct   = Math.round((item.progress || 0) * 100)
                return (
                  <div key={`${mt}-${item.id}-${item.season}-${item.episode}`} className="wl-card">
                    <button className="wl-card__img-wrap" onClick={() => navigate(`/watch/${mt}/${item.id}`)}>
                      {poster
                        ? <img src={poster} alt={title} className="wl-card__img" />
                        : <div className="wl-card__no-poster">🎬</div>
                      }
                      <div className="wl-card__play-overlay">▶</div>
                      {pct > 0 && (
                        <div className="wl-card__progress-track">
                          <div className="wl-card__progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      )}
                    </button>
                    <div className="wl-card__info">
                      <p className="wl-card__title">{title}</p>
                      <p className="wl-card__meta">
                        {mt === 'tv' && item.season ? `S${item.season}E${item.episode} · ` : ''}
                        {pct > 0 ? `${pct}% watched` : 'Started'}
                      </p>
                    </div>
                    <button
                      className="wl-card__remove"
                      onClick={() => removeFromContinue(item)}
                      title="Remove from history"
                    >✕</button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
