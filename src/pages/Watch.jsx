import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tmdb, backdropUrl, posterUrl, formatDate, formatRuntime } from '../utils/tmdb'
import { movieUrl, tvUrl } from '../utils/vidking'
import { getProgress, removeFromHistory } from '../utils/progress'
import { isInWatchlist, toggleWatchlist } from '../utils/watchlist'
import Spinner from '../components/Spinner'
import { registerPlugin } from '@capacitor/core'

const NativePlayer = registerPlugin('NativePlayer', {
  web: { open: ({ url }) => { window.open(url, '_blank'); return Promise.resolve() } },
})

function openPlayer(url) {
  NativePlayer.open({ url }).catch(() => window.open(url, '_blank'))
}

export default function Watch() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const pathMediaType = window.location.pathname.split('/watch/')[1]?.split('/')[0] || 'movie'
  const isTv          = pathMediaType === 'tv'

  const [details,      setDetails]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [season,       setSeason]       = useState(1)
  const [episode,      setEpisode]      = useState(1)
  const [seasonData,   setSeasonData]   = useState(null)
  const [totalSeasons, setTotalSeasons] = useState(1)
  const [similar,      setSimilar]      = useState([])
  const [inList,       setInList]       = useState(false)
  const [removedMsg,   setRemovedMsg]   = useState(false)

  const epScrollRef = useRef(null)

  // D-pad zones: 'play' | 'seasons' | 'episodes'
  const [zone,       setZone]       = useState(isTv ? 'seasons' : 'play')
  const [seasonIdx,  setSeasonIdx]  = useState(0)
  const [episodeIdx, setEpisodeIdx] = useState(0)

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true); setError(null)
    const fn = isTv ? tmdb.tvDetails : tmdb.movieDetails
    fn(id)
      .then(data => {
        setDetails(data)
        if (isTv) setTotalSeasons(data.number_of_seasons || 1)
        setLoading(false)
        setInList(isInWatchlist(pathMediaType, Number(id)))
        const ep = isTv ? `/tv/${id}/similar` : `/movie/${id}/similar`
        fetch(`https://api.themoviedb.org/3${ep}`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`, accept: 'application/json' },
        }).then(r => r.json())
          .then(d => setSimilar(d.results?.slice(0, 8).map(i => ({ ...i, media_type: pathMediaType })) || []))
          .catch(() => {})
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id, pathMediaType, isTv])

  useEffect(() => {
    if (!isTv) return
    setSeasonData(null)
    tmdb.tvSeason(id, season).then(setSeasonData).catch(() => setSeasonData(null))
  }, [id, season, isTv])

  // ── build embed URL and open in Chrome ────────────────────────────────────
  const play = (s = season, e = episode) => {
    const saved = isTv ? getProgress('tv', id, s, e) : getProgress('movie', id)
    const ts    = saved?.timestamp || 0
    const url   = isTv
      ? tvUrl(id, s, e, { autoPlay: true, nextEpisode: true, episodeSelector: true, progress: ts })
      : movieUrl(id, { autoPlay: true, progress: ts })
    openPlayer(url)
  }

  // ── watchlist toggle ───────────────────────────────────────────────────────
  function handleWatchlist() {
    if (!details) return
    const added = toggleWatchlist({ ...details, id: Number(id), media_type: pathMediaType })
    setInList(added)
  }

  // ── remove from continue watching ─────────────────────────────────────────
  function handleMarkWatched() {
    removeFromHistory(pathMediaType, Number(id))
    setRemovedMsg(true)
    setTimeout(() => setRemovedMsg(false), 2000)
  }

  // ── scroll focused episode into view ──────────────────────────────────────
  useEffect(() => {
    if (zone !== 'episodes' || !epScrollRef.current) return
    const btns = epScrollRef.current.querySelectorAll('.ep-btn')
    btns[episodeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [episodeIdx, zone])

  // ── D-pad navigation ──────────────────────────────────────────────────────
  useEffect(() => {
    const episodes = seasonData?.episodes || []
    const maxEp    = Math.max(0, episodes.length - 1)

    const handler = (e) => {
      const key = e.key || {37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',13:'Enter',27:'Escape',8:'Escape'}[e.keyCode]
      if (!key) return
      if (key === 'Escape') { navigate(-1); return }
      e.preventDefault()

      if (key === 'ArrowUp') {
        if (zone === 'episodes') {
          if (episodeIdx > 0) setEpisodeIdx(s => s - 1)
          else setZone('seasons')
          return
        }
        if (zone === 'seasons') { setZone('play'); return }
      }
      if (key === 'ArrowDown') {
        if (zone === 'episodes') { setEpisodeIdx(s => Math.min(maxEp, s + 1)); return }
        if (zone === 'play' && isTv)               { setZone('seasons'); return }
        if (zone === 'seasons' && episodes.length) { setZone('episodes'); return }
      }
      if (key === 'ArrowLeft'  && zone === 'seasons') setSeasonIdx(s => Math.max(0, s - 1))
      if (key === 'ArrowRight' && zone === 'seasons') setSeasonIdx(s => Math.min(totalSeasons - 1, s + 1))

      if (key === 'Enter') {
        if (zone === 'play') { play(); return }
        if (zone === 'seasons') {
          setSeason(seasonIdx + 1); setEpisode(1); setEpisodeIdx(0); setZone('episodes')
          return
        }
        if (zone === 'episodes') {
          const ep = episodes[episodeIdx]
          if (ep) { setEpisode(ep.episode_number); play(season, ep.episode_number) }
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [zone, seasonIdx, episodeIdx, totalSeasons, seasonData, isTv, navigate, season, episode])

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="tv-loading"><Spinner /></div>
  if (error)   return (
    <div className="tv-error">
      <p className="tv-error__title">{error}</p>
      <button className="tv-btn tv-btn--primary" onClick={() => navigate(-1)}>← Back</button>
    </div>
  )

  const title    = details?.title || details?.name
  const genres   = details?.genres || []
  const runtime  = details?.runtime
  const date     = details?.release_date || details?.first_air_date
  const rating   = details?.vote_average
  const poster   = posterUrl(details?.poster_path, 'w342')
  const backdrop = backdropUrl(details?.backdrop_path, 'w1280')
  const episodes = seasonData?.episodes || []

  return (
    <div className="detail-page" style={backdrop ? { '--backdrop': `url(${backdrop})` } : {}}>
      <div className="detail-backdrop" />
      <div className="detail-gradient" />

      <div className="detail-content">
        <button className="detail-back tv-btn tv-btn--ghost" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-body">
          {poster && (
            <div className="detail-poster">
              <img src={poster} alt={title} />
            </div>
          )}

          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta">
              {date && <span>{formatDate(date)}</span>}
              {runtime && <span>{formatRuntime(runtime)}</span>}
              {rating > 0 && <span className="detail-rating">★ {rating.toFixed(1)}</span>}
              {genres.slice(0, 3).map(g => <span key={g.id} className="detail-genre">{g.name}</span>)}
            </div>

            {details?.overview && <p className="detail-overview">{details.overview}</p>}

            {/* Action buttons row */}
            <div className="detail-actions">
              {/* Movie: single play button */}
              {!isTv && (
                <button
                  className={`detail-play-btn ${zone === 'play' ? 'detail-play-btn--focused' : ''}`}
                  onClick={() => play()}
                >
                  ▶ Play
                </button>
              )}

              {/* Watchlist toggle */}
              <button
                className={`detail-watchlist-btn ${inList ? 'detail-watchlist-btn--active' : ''}`}
                onClick={handleWatchlist}
              >
                {inList ? '♥ In My List' : '♡ My List'}
              </button>

              {/* Mark as watched (remove from continue watching) */}
              <button className="detail-watched-btn" onClick={handleMarkWatched}>
                {removedMsg ? '✓ Removed' : '✓ Mark Watched'}
              </button>
            </div>

            {/* TV: season + episode picker */}
            {isTv && (
              <div className="detail-tv">
                <div className={`detail-seasons ${zone === 'seasons' ? 'detail-zone--active' : ''}`}>
                  <p className="detail-zone-label">Season</p>
                  <div className="detail-seasons__row">
                    {Array.from({ length: totalSeasons }, (_, i) => (
                      <button
                        key={i + 1}
                        className={[
                          'detail-season-btn',
                          season === i + 1 ? 'detail-season-btn--on' : '',
                          zone === 'seasons' && seasonIdx === i ? 'detail-season-btn--focus' : '',
                        ].join(' ')}
                        onClick={() => { setSeason(i + 1); setEpisode(1); setEpisodeIdx(0); setZone('episodes') }}
                      >
                        S{i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`detail-episodes ${zone === 'episodes' ? 'detail-zone--active' : ''}`}>
                  <p className="detail-zone-label">Season {season} Episodes</p>
                  <div ref={epScrollRef} className="detail-episodes__grid">
                    {(episodes.length > 0
                      ? episodes
                      : Array.from({ length: 20 }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}`, still_path: null, overview: '' }))
                    ).map((ep, i) => (
                      <button
                        key={ep.episode_number}
                        className={[
                          'ep-btn',
                          episode === ep.episode_number ? 'ep-btn--on' : '',
                          zone === 'episodes' && episodeIdx === i ? 'ep-btn--focus' : '',
                        ].join(' ')}
                        onClick={() => { setEpisode(ep.episode_number); play(season, ep.episode_number) }}
                      >
                        {ep.still_path
                          ? <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt="" className="ep-btn__thumb" />
                          : <div className="ep-btn__thumb ep-btn__thumb--blank" />
                        }
                        <div className="ep-btn__info">
                          <span className="ep-btn__num">E{ep.episode_number}</span>
                          <span className="ep-btn__name">{ep.name}</span>
                          {ep.overview && <span className="ep-btn__desc">{ep.overview}</span>}
                        </div>
                        <div className="ep-btn__play">▶</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="detail-similar">
            <p className="detail-zone-label">More Like This</p>
            <div className="detail-similar__row">
              {similar.map(item => (
                <button
                  key={item.id}
                  className="detail-similar-card"
                  onClick={() => navigate(`/watch/${item.media_type}/${item.id}`)}
                >
                  {item.poster_path
                    ? <img src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} alt={item.title || item.name} />
                    : <div className="detail-similar-card__blank" />
                  }
                  <span>{item.title || item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
