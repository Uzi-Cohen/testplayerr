import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tmdb, posterUrl, formatDate, formatRuntime } from '../utils/tmdb'
import { movieUrl, tvUrl } from '../utils/vidking'
import { saveProgress, getProgress } from '../utils/progress'
import Spinner from '../components/Spinner'
import Section from '../components/Section'

export default function Watch() {
  const { id } = useParams()
  const pathMediaType = window.location.pathname.split('/watch/')[1]?.split('/')[0] || 'movie'
  const isTv = pathMediaType === 'tv'

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [totalSeasons, setTotalSeasons] = useState(1)

  const [similar, setSimilar] = useState([])
  const [embedUrl, setEmbedUrl] = useState('')
  const iframeKey = `${pathMediaType}-${id}-${season}-${episode}`
  const iframeRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetchDetails = isTv ? tmdb.tvDetails : tmdb.movieDetails
    fetchDetails(id)
      .then(data => {
        setDetails(data)
        if (isTv) setTotalSeasons(data.number_of_seasons || 1)
        setLoading(false)

        const endpoint = isTv ? `/tv/${id}/similar` : `/movie/${id}/similar`
        fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
          .then(r => r.json())
          .then(d => setSimilar(d.results?.slice(0, 12).map(i => ({ ...i, media_type: pathMediaType })) || []))
          .catch(() => {})
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id, pathMediaType, isTv])

  useEffect(() => {
    if (!isTv) return
    tmdb.tvSeason(id, season)
      .then(setSeasonData)
      .catch(() => setSeasonData(null))
  }, [id, season, isTv])

  useEffect(() => {
    const saved = isTv
      ? getProgress('tv', id, season, episode)
      : getProgress('movie', id)
    const ts = saved?.timestamp || 0
    const url = isTv
      ? tvUrl(id, season, episode, { autoPlay: true, nextEpisode: true, episodeSelector: true, progress: ts })
      : movieUrl(id, { autoPlay: true, progress: ts })
    setEmbedUrl(url)
  }, [id, isTv, season, episode])

  const detailsRef = useRef(null)
  useEffect(() => { detailsRef.current = details }, [details])

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

  if (loading) {
    return <div className="pt-14 flex justify-center items-center min-h-screen"><Spinner /></div>
  }

  if (error) {
    return (
      <div className="pt-14 flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="font-display uppercase tracking-wider" style={{ color: '#e05050' }}>{error}</p>
        <Link to="/" style={{ color: '#1a9fff' }} className="text-sm hover:underline">← Back to Home</Link>
      </div>
    )
  }

  const title = details?.title || details?.name
  const genres = details?.genres || []
  const runtime = details?.runtime
  const date = details?.release_date || details?.first_air_date
  const cast = details?.credits?.cast?.slice(0, 8) || []
  const episodes = seasonData?.episodes || []

  return (
    <div className="pt-14 min-h-screen">
      {/* Player */}
      <div className="w-full bg-black" style={{ aspectRatio: '16/9' }}
        onClick={() => iframeRef.current?.focus()}>
        {embedUrl && (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={embedUrl}
            width="100%" height="100%"
            frameBorder="0" allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            title={`Watch ${title}`}
            style={{ display: 'block' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
            onLoad={() => iframeRef.current?.focus()}
          />
        )}
      </div>

      {/* Bottom glow under player */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(26,127,212,0.5), transparent)' }} />

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-8">
        {/* Title block */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="font-display font-bold text-xl sm:text-3xl uppercase tracking-wide"
              style={{ color: '#e8f4ff', textShadow: '0 0 20px rgba(26,127,212,0.3)' }}>
              {title}
            </h1>
            {details?.vote_average > 0 && (
              <div className="shrink-0 text-right">
                <div className="font-display text-lg font-bold" style={{ color: '#ffc107' }}>
                  ★ {details.vote_average.toFixed(1)}
                </div>
                <div className="text-xs" style={{ color: '#3a5a7a' }}>/ 10</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: '#3a5a7a' }}>
            {date && <span style={{ color: '#6a8fad' }}>{formatDate(date)}</span>}
            {runtime && <span>· {formatRuntime(runtime)}</span>}
            {genres.slice(0, 4).map(g => (
              <span key={g.id} className="px-2 py-0.5 rounded-sm font-display uppercase tracking-wider text-xs"
                style={{ background: 'rgba(26,127,212,0.1)', border: '1px solid rgba(26,127,212,0.2)', color: '#4a7aaa' }}>
                {g.name}
              </span>
            ))}
          </div>

          {details?.overview && (
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#5a7a94' }}>
              {details.overview}
            </p>
          )}
        </div>

        <div className="glow-divider" />

        {/* TV Episode Selector */}
        {isTv && (
          <div className="space-y-4">
            <h2 className="section-title">Episodes</h2>

            {/* Season tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
                <button
                  key={s}
                  onClick={() => { setSeason(s); setEpisode(1) }}
                  className="shrink-0 px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider transition-all"
                  style={s === season ? {
                    background: 'linear-gradient(180deg, #1a7fd4, #0d4a8a)',
                    color: '#fff',
                    boxShadow: '0 0 10px rgba(26,127,212,0.5)',
                    border: '1px solid rgba(100,180,255,0.3)',
                  } : {
                    background: 'rgba(13,22,38,0.8)',
                    border: '1px solid rgba(26,127,212,0.15)',
                    color: '#3a5a7a',
                  }}
                >
                  Season {s}
                </button>
              ))}
            </div>

            {/* Episode list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {(episodes.length > 0
                ? episodes
                : Array.from({ length: 24 }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))
              ).map(ep => (
                <button
                  key={ep.episode_number}
                  onClick={() => setEpisode(ep.episode_number)}
                  className="flex items-center gap-3 w-full p-2.5 rounded text-left transition-all"
                  style={episode === ep.episode_number ? {
                    background: 'linear-gradient(90deg, rgba(26,127,212,0.2), rgba(26,127,212,0.05))',
                    border: '1px solid rgba(26,127,212,0.35)',
                    boxShadow: '0 0 8px rgba(26,127,212,0.1)',
                  } : {
                    background: 'rgba(13,22,38,0.5)',
                    border: '1px solid rgba(26,127,212,0.08)',
                  }}
                >
                  {ep.still_path ? (
                    <img src={`https://image.tmdb.org/t/p/w185${ep.still_path}`} alt=""
                      className="w-24 h-14 object-cover rounded shrink-0"
                      style={{ border: '1px solid rgba(26,127,212,0.2)' }} />
                  ) : (
                    <div className="w-24 h-14 rounded shrink-0 flex items-center justify-center font-display font-bold text-sm"
                      style={{ background: '#0a1220', border: '1px solid rgba(26,127,212,0.15)', color: '#1a4a7a' }}>
                      {ep.episode_number}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display uppercase tracking-wide truncate"
                      style={{ color: episode === ep.episode_number ? '#c8e8ff' : '#5a7a94' }}>
                      {ep.episode_number}. {ep.name}
                    </p>
                    {ep.overview && (
                      <p className="text-xs line-clamp-1 mt-0.5 hidden sm:block" style={{ color: '#2a4a6a' }}>
                        {ep.overview}
                      </p>
                    )}
                  </div>
                  {episode === ep.episode_number && (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: '#1a9fff', boxShadow: '0 0 6px rgba(26,159,255,0.8)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <div className="space-y-3">
            <h2 className="section-title">Cast</h2>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {cast.map(person => (
                <div key={person.id} className="shrink-0 w-16 text-center space-y-1.5">
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto"
                    style={{ border: '2px solid rgba(26,127,212,0.3)', boxShadow: '0 0 8px rgba(26,127,212,0.2)' }}>
                    {person.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl"
                        style={{ background: '#0d1626', color: '#1a3a5a' }}>👤</div>
                    )}
                  </div>
                  <p className="text-xs font-display uppercase truncate" style={{ color: '#7a9db8', fontSize: '9px', letterSpacing: '0.05em' }}>
                    {person.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <>
            <div className="glow-divider" />
            <Section title={`More Like ${title}`} items={similar} />
          </>
        )}
      </div>
    </div>
  )
}
