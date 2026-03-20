import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tmdb, backdropUrl, posterUrl, formatDate, formatRuntime } from '../utils/tmdb'
import { movieUrl, tvUrl } from '../utils/vidking'
import { saveProgress, getProgress } from '../utils/progress'
import Spinner from '../components/Spinner'

// ─── tiny hook: auto-hide overlay after N ms of inactivity ───────────────────
function useAutoHide(ms = 3500) {
  const [visible, setVisible] = useState(true)
  const timer = useRef(null)
  const show = useCallback(() => {
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), ms)
  }, [ms])
  useEffect(() => { show(); return () => clearTimeout(timer.current) }, [show])
  return [visible, show]
}

export default function Watch() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const pathMediaType = window.location.pathname.split('/watch/')[1]?.split('/')[0] || 'movie'
  const isTv          = pathMediaType === 'tv'

  // ── data ──────────────────────────────────────────────────────────────────
  const [details,      setDetails]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [season,       setSeason]       = useState(1)
  const [episode,      setEpisode]      = useState(1)
  const [seasonData,   setSeasonData]   = useState(null)
  const [totalSeasons, setTotalSeasons] = useState(1)
  const [similar,      setSimilar]      = useState([])

  // ── page mode: 'detail' or 'player' ──────────────────────────────────────
  const [mode, setMode] = useState('detail')

  // player overlay (only shown in player mode)
  const [overlayVisible, showOverlay] = useAutoHide(3500)
  const iframeRef    = useRef(null)
  const focusTrapRef = useRef(null)
  const detailsRef   = useRef(null)
  const epScrollRef  = useRef(null)

  // ── detail-page D-pad zones ───────────────────────────────────────────────
  // zones: 'play' | 'seasons' | 'episodes'
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

  useEffect(() => { detailsRef.current = details }, [details])

  // ── progress tracking ─────────────────────────────────────────────────────
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

  // ── scroll focused episode into view ──────────────────────────────────────
  useEffect(() => {
    if (zone !== 'episodes' || !epScrollRef.current) return
    const btns = epScrollRef.current.querySelectorAll('.ep-btn')
    btns[episodeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [episodeIdx, zone])

  // ── build embed URL ───────────────────────────────────────────────────────
  const buildUrl = useCallback(() => {
    const saved = isTv
      ? getProgress('tv', id, season, episode)
      : getProgress('movie', id)
    const ts = saved?.timestamp || 0
    return isTv
      ? tvUrl(id, season, episode, { autoPlay: true, nextEpisode: true, episodeSelector: true, progress: ts })
      : movieUrl(id, { autoPlay: true, progress: ts })
  }, [id, isTv, season, episode])

  // ── launch player ─────────────────────────────────────────────────────────
  const openPlayer = useCallback(() => {
    setMode('player')
    showOverlay()
  }, [showOverlay])

  // ── keydown — detail mode ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'detail') return
    const episodes = seasonData?.episodes || []
    const maxEp    = Math.max(0, episodes.length - 1)

    const handler = (e) => {
      const key = e.key || {37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',13:'Enter',27:'Escape',8:'Escape'}[e.keyCode]
      if (!key) return

      if (key === 'Escape') { navigate(-1); return }
      e.preventDefault()

      // UP / DOWN
      if (key === 'ArrowUp') {
        if (zone === 'episodes') {
          if (episodeIdx > 0) { setEpisodeIdx(s => s - 1); return }
          else { setZone('seasons'); return }           // top of list → back to seasons
        }
        if (zone === 'seasons') { setZone('play'); return }
      }
      if (key === 'ArrowDown') {
        if (zone === 'episodes') { setEpisodeIdx(s => Math.min(maxEp, s + 1)); return }
        if (zone === 'play' && isTv)                    { setZone('seasons'); return }
        if (zone === 'seasons' && episodes.length)      { setZone('episodes'); return }
      }
      // LEFT / RIGHT — only for season tabs
      if (key === 'ArrowLeft') {
        if (zone === 'seasons') setSeasonIdx(s => Math.max(0, s - 1))
      }
      if (key === 'ArrowRight') {
        if (zone === 'seasons') setSeasonIdx(s => Math.min(totalSeasons - 1, s + 1))
      }
      if (key === 'Enter') {
        if (zone === 'play') { openPlayer(); return }
        if (zone === 'seasons') {
          setSeason(seasonIdx + 1)
          setEpisode(1); setEpisodeIdx(0)
          setZone('episodes')
          return
        }
        if (zone === 'episodes') {
          const ep = episodes[episodeIdx]
          if (ep) { setEpisode(ep.episode_number); openPlayer() }
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, zone, seasonIdx, episodeIdx, totalSeasons, seasonData, isTv, navigate, openPlayer])

  // ── player mode enter/exit ────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'player') {
      // Push a history entry so Android hardware back = exit player, not close app
      window.history.pushState({ skPlayer: true }, '')
      setTimeout(() => focusTrapRef.current?.focus(), 50)
    }
  }, [mode])

  // Catch hardware back button (Android) while in player mode
  useEffect(() => {
    if (mode !== 'player') return
    const onPop = () => setMode('detail')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [mode])

  // ─────────────────────────────────────────────────────────────────────────
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
  const overview = details?.overview
  const rating   = details?.vote_average
  const poster   = posterUrl(details?.poster_path, 'w342')
  const backdrop = backdropUrl(details?.backdrop_path, 'w1280')
  const episodes = seasonData?.episodes || []
  const embedUrl = buildUrl()

  // ══════════════════════════════════════════════════════════════════════════
  // PLAYER MODE — fullscreen iframe + auto-hiding back bar
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'player') {
    return (
      <div className="player-fullscreen">
        {/* iframe — pointer-events:none + tabIndex:-1 so it cannot receive any input */}
        <iframe
          ref={iframeRef}
          key={`${pathMediaType}-${id}-${season}-${episode}`}
          src={embedUrl}
          className="player-iframe"
          tabIndex={-1}
          style={{ pointerEvents: 'none' }}
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          title={`Watch ${title}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
        />

        {/*
          Input shield — covers the entire screen above the iframe.
          pointer-events:all so ALL touch/click/key events land here,
          not in the iframe. D-pad does nothing except show the overlay.
          Back is handled by popstate (hardware back) or Escape key.
        */}
        <div
          ref={focusTrapRef}
          tabIndex={0}
          className="player-shield"
          onKeyDown={(e) => {
            e.preventDefault()
            showOverlay()
            const key = e.key || { 27: 'Escape', 8: 'Escape' }[e.keyCode]
            if (key === 'Escape') {
              window.history.back()  // triggers popstate → setMode('detail')
            }
          }}
        />

        {/* Auto-hiding top bar */}
        <div className={`player-bar ${overlayVisible ? 'player-bar--visible' : ''}`}>
          <button className="player-back" onClick={() => setMode('detail')}>← Back</button>
          <span className="player-title">{title}</span>
          {isTv && <span className="player-ep">S{season} · E{episode}</span>}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DETAIL MODE — Netflix-style info + season/episode picker
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="detail-page" style={backdrop ? { '--backdrop': `url(${backdrop})` } : {}}>
      {/* Backdrop */}
      <div className="detail-backdrop" />
      <div className="detail-gradient" />

      <div className="detail-content">
        {/* Back */}
        <button className="detail-back tv-btn tv-btn--ghost" onClick={() => navigate(-1)}>← Back</button>

        <div className="detail-body">
          {/* Poster */}
          {poster && (
            <div className="detail-poster">
              <img src={poster} alt={title} />
            </div>
          )}

          {/* Info column */}
          <div className="detail-info">
            <h1 className="detail-title">{title}</h1>

            <div className="detail-meta">
              {date && <span>{formatDate(date)}</span>}
              {runtime && <span>{formatRuntime(runtime)}</span>}
              {rating > 0 && <span className="detail-rating">★ {rating.toFixed(1)}</span>}
              {genres.slice(0, 3).map(g => <span key={g.id} className="detail-genre">{g.name}</span>)}
            </div>

            {overview && <p className="detail-overview">{overview}</p>}

            {/* Movie: single play button */}
            {!isTv && (
              <button
                className={`detail-play-btn ${zone === 'play' ? 'detail-play-btn--focused' : ''}`}
                onClick={openPlayer}
              >
                ▶ Play
              </button>
            )}

            {/* TV: season + episode selector */}
            {isTv && (
              <div className="detail-tv">
                {/* Season tabs */}
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

                {/* Episode grid */}
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
                        onClick={() => { setEpisode(ep.episode_number); openPlayer() }}
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

        {/* Similar titles */}
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
