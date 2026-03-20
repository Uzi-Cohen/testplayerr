import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tmdb, posterUrl, backdropUrl, formatDate, formatRuntime } from '../utils/tmdb'
import { movieUrl, tvUrl } from '../utils/vidking'
import { saveProgress, getProgress } from '../utils/progress'
import Section from '../components/Section'
import Spinner from '../components/Spinner'
import { registerPlugin } from '@capacitor/core'

// Register native player plugin — gracefully no-ops on web/dev
const NativePlayer = registerPlugin('NativePlayer', {
  web: {
    open: () => Promise.resolve(), // no-op fallback in browser
  },
})

function isAndroid() {
  return typeof window !== 'undefined' && /android/i.test(navigator.userAgent)
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
  const [embedUrl,     setEmbedUrl]     = useState('')

  // Overlay / zone navigation
  const [overlayZone,  setOverlayZone]  = useState('info')   // 'info' | 'seasons' | 'episodes' | 'similar'
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [seasonIdx,    setSeasonIdx]    = useState(0)
  const [episodeIdx,   setEpisodeIdx]   = useState(0)
  const [similarIdx,   setSimilarIdx]   = useState(0)

  const hideTimer   = useRef(null)
  const epScrollRef = useRef(null)
  const detailsRef  = useRef(null)

  // ── Fetch details ──────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetchFn = isTv ? tmdb.tvDetails : tmdb.movieDetails
    fetchFn(id)
      .then(data => {
        setDetails(data)
        if (isTv) setTotalSeasons(data.number_of_seasons || 1)
        setLoading(false)
        const endpoint = isTv ? `/tv/${id}/similar` : `/movie/${id}/similar`
        fetch(`https://api.themoviedb.org/3${endpoint}`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`, accept: 'application/json' },
        })
          .then(r => r.json())
          .then(d => setSimilar(d.results?.slice(0, 12).map(i => ({ ...i, media_type: pathMediaType })) || []))
          .catch(() => {})
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id, pathMediaType, isTv])

  useEffect(() => {
    if (!isTv) return
    tmdb.tvSeason(id, season).then(setSeasonData).catch(() => setSeasonData(null))
  }, [id, season, isTv])

  useEffect(() => {
    const saved = isTv ? getProgress('tv', id, season, episode) : getProgress('movie', id)
    const ts    = saved?.timestamp || 0
    const url   = isTv
      ? tvUrl(id, season, episode, { autoPlay: true, nextEpisode: true, episodeSelector: true, progress: ts })
      : movieUrl(id, { autoPlay: true, progress: ts })
    setEmbedUrl(url)
  }, [id, isTv, season, episode])

  useEffect(() => { detailsRef.current = details }, [details])

  // ── Progress tracking ──────────────────────────────────────────
  const handleMessage = useCallback((event) => {
    if (!event.data || typeof event.data !== 'string') return
    try {
      const msg = JSON.parse(event.data)
      if (msg.type !== 'PLAYER_EVENT') return
      const { data } = msg
      if (data.event === 'timeupdate' && data.progress > 0.01) {
        const d = detailsRef.current
        saveProgress(pathMediaType, id, {
          id, mediaType: pathMediaType,
          progress: data.progress, timestamp: data.currentTime,
          duration: data.duration, season: data.season, episode: data.episode,
          title: d?.title || d?.name, name: d?.name || d?.title,
          poster_path: d?.poster_path, vote_average: d?.vote_average,
          release_date: d?.release_date, first_air_date: d?.first_air_date,
        })
      }
    } catch { /* not JSON */ }
  }, [id, pathMediaType])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // ── Open native player ─────────────────────────────────────────
  const openNativePlayer = useCallback((url) => {
    if (!url) return
    NativePlayer.open({ url }).catch(() => {
      // Plugin not available (web dev) — nothing to do, page already shows details
    })
  }, [])

  // Auto-launch native player when embedUrl is ready on Android
  useEffect(() => {
    if (embedUrl && isAndroid()) {
      openNativePlayer(embedUrl)
    }
  }, [embedUrl, openNativePlayer])

  // ── Overlay auto-hide ──────────────────────────────────────────
  const showOverlay = useCallback(() => {
    setOverlayVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setOverlayVisible(false), 4000)
  }, [])

  useEffect(() => {
    showOverlay()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showOverlay])

  // ── D-pad navigation ───────────────────────────────────────────
  useEffect(() => {
    const episodes = seasonData?.episodes || []
    const maxEp    = Math.max(0, episodes.length - 1)
    const maxSim   = Math.max(0, similar.length - 1)

    const handler = (e) => {
      const key = e.key || {37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',13:'Enter',27:'Escape',8:'Escape'}[e.keyCode]
      if (!key) return

      // Any key press shows overlay
      showOverlay()

      if (key === 'Escape') { navigate(-1); return }
      e.preventDefault()

      if (key === 'ArrowUp') {
        if (overlayZone === 'similar')  { setOverlayZone(isTv ? 'episodes' : 'info'); return }
        if (overlayZone === 'episodes') { setOverlayZone('seasons'); return }
        if (overlayZone === 'seasons')  { setOverlayZone('info'); return }
        return
      }
      if (key === 'ArrowDown') {
        if (overlayZone === 'info')     { setOverlayZone(isTv ? 'seasons' : (similar.length ? 'similar' : 'info')); return }
        if (overlayZone === 'seasons')  { setOverlayZone('episodes'); return }
        if (overlayZone === 'episodes' && similar.length) { setOverlayZone('similar'); return }
        return
      }
      if (key === 'ArrowLeft') {
        if (overlayZone === 'seasons')  setSeasonIdx(s => Math.max(0, s - 1))
        if (overlayZone === 'episodes') setEpisodeIdx(s => Math.max(0, s - 1))
        if (overlayZone === 'similar')  setSimilarIdx(s => Math.max(0, s - 1))
        return
      }
      if (key === 'ArrowRight') {
        if (overlayZone === 'seasons')  setSeasonIdx(s => Math.min(totalSeasons - 1, s + 1))
        if (overlayZone === 'episodes') setEpisodeIdx(s => Math.min(maxEp, s + 1))
        if (overlayZone === 'similar')  setSimilarIdx(s => Math.min(maxSim, s + 1))
        return
      }
      if (key === 'Enter') {
        if (overlayZone === 'info') {
          // Re-open native player
          if (isAndroid()) openNativePlayer(embedUrl)
          return
        }
        if (overlayZone === 'seasons') {
          const newSeason = seasonIdx + 1
          setSeason(newSeason); setEpisode(1); setEpisodeIdx(0)
          setOverlayZone('episodes')
          return
        }
        if (overlayZone === 'episodes') {
          const ep = episodes[episodeIdx]
          if (ep) setEpisode(ep.episode_number)
          return
        }
        if (overlayZone === 'similar') {
          const item = similar[similarIdx]
          if (item) navigate(`/watch/${pathMediaType}/${item.id}`)
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overlayZone, seasonIdx, episodeIdx, similarIdx, similar, totalSeasons, seasonData, isTv, navigate, pathMediaType, embedUrl, openNativePlayer, showOverlay])

  // Scroll focused episode into view
  useEffect(() => {
    if (overlayZone !== 'episodes' || !epScrollRef.current) return
    const items = epScrollRef.current.querySelectorAll('.watch-ep-btn')
    items[episodeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [episodeIdx, overlayZone])

  // ── Render ─────────────────────────────────────────────────────
  if (loading) return <div className="tv-loading"><Spinner /></div>

  if (error) {
    return (
      <div className="tv-error">
        <p className="tv-error__title">{error}</p>
        <button className="tv-btn tv-btn--primary" onClick={() => navigate(-1)}>← Back</button>
      </div>
    )
  }

  const title    = details?.title || details?.name
  const genres   = details?.genres || []
  const runtime  = details?.runtime
  const date     = details?.release_date || details?.first_air_date
  const backdrop = backdropUrl(details?.backdrop_path, 'w1280')
  const episodes = seasonData?.episodes || []

  return (
    <div className="watch-detail-page" style={backdrop ? { '--backdrop': `url(${backdrop})` } : {}}>

      {/* ── Backdrop ── */}
      <div className="watch-backdrop" />

      {/* ── Overlay (auto-hides) ── */}
      <div className={`watch-overlay ${overlayVisible ? 'watch-overlay--visible' : ''}`}>

        {/* Top bar */}
        <div className={`watch-topbar ${overlayZone === 'info' ? 'watch-zone--active' : ''}`}>
          <button className="watch-back" onClick={() => navigate(-1)}>← Back</button>
          <div className="watch-topbar__info">
            <span className="watch-topbar__title">{title}</span>
            {isTv && <span className="watch-topbar__ep">S{season} · E{episode}</span>}
          </div>
          <div className="watch-topbar__meta">
            {date && <span>{formatDate(date)}</span>}
            {runtime && <span>{formatRuntime(runtime)}</span>}
            {details?.vote_average > 0 && <span className="watch-rating">★ {details.vote_average.toFixed(1)}</span>}
          </div>
        </div>

        {/* Centre: play button (Android re-opens native player) */}
        <div className="watch-center">
          {isAndroid() && overlayZone === 'info' && (
            <button
              className="watch-play-btn watch-play-btn--focused"
              onClick={() => openNativePlayer(embedUrl)}
              aria-label="Play"
            >
              ▶
            </button>
          )}
          {!isAndroid() && (
            <div className="watch-web-hint">Running in browser — native player unavailable</div>
          )}
        </div>

        {/* Bottom panel */}
        <div className="watch-bottom">
          {details?.overview && (
            <p className="watch-overview">{details.overview}</p>
          )}
          {genres.length > 0 && (
            <div className="watch-genres">
              {genres.slice(0, 4).map(g => <span key={g.id} className="watch-genre">{g.name}</span>)}
            </div>
          )}

          {/* Season / Episode selector */}
          {isTv && (
            <div className="watch-tv-controls">
              <div className={`watch-seasons ${overlayZone === 'seasons' ? 'watch-zone--active' : ''}`}>
                <span className="watch-zone-label">Season</span>
                <div className="watch-seasons__tabs">
                  {Array.from({ length: totalSeasons }, (_, i) => (
                    <button
                      key={i + 1}
                      className={[
                        'watch-season-btn',
                        season === i + 1        ? 'watch-season-btn--current' : '',
                        overlayZone === 'seasons' && seasonIdx === i ? 'watch-season-btn--focused' : '',
                      ].join(' ')}
                      onClick={() => { setSeason(i + 1); setEpisode(1); setEpisodeIdx(0) }}
                    >
                      S{i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`watch-episodes ${overlayZone === 'episodes' ? 'watch-zone--active' : ''}`}>
                <span className="watch-zone-label">Episode</span>
                <div ref={epScrollRef} className="watch-episodes__list tv-row-scroll">
                  {(episodes.length > 0
                    ? episodes
                    : Array.from({ length: 24 }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}`, still_path: null }))
                  ).map((ep, i) => (
                    <button
                      key={ep.episode_number}
                      className={[
                        'watch-ep-btn',
                        episode === ep.episode_number   ? 'watch-ep-btn--current' : '',
                        overlayZone === 'episodes' && episodeIdx === i ? 'watch-ep-btn--focused' : '',
                      ].join(' ')}
                      onClick={() => setEpisode(ep.episode_number)}
                    >
                      {ep.still_path && (
                        <img src={`https://image.tmdb.org/t/p/w185${ep.still_path}`} alt="" className="watch-ep-btn__thumb" />
                      )}
                      <span className="watch-ep-btn__num">E{ep.episode_number}</span>
                      <span className="watch-ep-btn__name">{ep.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Similar titles ── */}
      {similar.length > 0 && (
        <div className="watch-similar-section">
          <Section
            title={`More Like ${title}`}
            items={similar}
            isActive={overlayZone === 'similar'}
            focusedIndex={similarIdx}
          />
        </div>
      )}
    </div>
  )
}
