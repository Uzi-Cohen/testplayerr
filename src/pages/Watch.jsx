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

  // TV state
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [totalSeasons, setTotalSeasons] = useState(1)

  // Similar content
  const [similar, setSimilar] = useState([])

  // The embed URL — only recomputed when id/season/episode change, not on every render
  const [embedUrl, setEmbedUrl] = useState('')
  // Stable iframe key — only changes when the content actually changes
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

  // Load season episodes
  useEffect(() => {
    if (!isTv) return
    tmdb.tvSeason(id, season)
      .then(setSeasonData)
      .catch(() => setSeasonData(null))
  }, [id, season, isTv])

  // Build embed URL only when id/season/episode change
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

  // Save progress from player postMessage events
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
          id,
          mediaType: pathMediaType,
          progress: data.progress,
          timestamp: data.currentTime,
          duration: data.duration,
          season: data.season,
          episode: data.episode,
          title: d?.title || d?.name,
          name: d?.name || d?.title,
          poster_path: d?.poster_path,
          vote_average: d?.vote_average,
          release_date: d?.release_date,
          first_air_date: d?.first_air_date,
        })
      }
    } catch { /* not JSON */ }
  }, [id, pathMediaType])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  if (loading) {
    return (
      <div className="pt-16 flex justify-center items-center min-h-screen">
        <Spinner size={12} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-16 flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-400">{error}</p>
        <Link to="/" className="text-blue-400 hover:underline">← Back to Home</Link>
      </div>
    )
  }

  const title = details?.title || details?.name
  const genres = details?.genres || []
  const runtime = details?.runtime
  const date = details?.release_date || details?.first_air_date
  const cast = details?.credits?.cast?.slice(0, 6) || []
  const episodes = seasonData?.episodes || []

  return (
    <div className="pt-14 min-h-screen">
      {/* Player — full width, sticky on mobile */}
      <div
        className="w-full bg-black"
        style={{ aspectRatio: '16/9' }}
        onClick={() => iframeRef.current?.focus()}
        onDoubleClick={() => {
          const el = iframeRef.current
          if (!el) return
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.()
          }
        }}
      >
        {embedUrl && (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            title={`Watch ${title}`}
            style={{ display: 'block' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-fullscreen"
            onLoad={() => iframeRef.current?.focus()}
          />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 space-y-6">
        {/* Title & meta */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
            {date && <span>{formatDate(date)}</span>}
            {runtime && <span>{formatRuntime(runtime)}</span>}
            {details?.vote_average > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {details.vote_average.toFixed(1)}
              </span>
            )}
            {genres.slice(0, 3).map(g => (
              <span key={g.id} className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{g.name}</span>
            ))}
          </div>
          {details?.overview && (
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{details.overview}</p>
          )}
        </div>

        {/* TV: Season/Episode selector */}
        {isTv && (
          <div className="space-y-3">
            {/* Season tabs — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
                <button
                  key={s}
                  onClick={() => { setSeason(s); setEpisode(1) }}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    s === season ? 'bg-blue-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  S{s}
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
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-colors ${
                    episode === ep.episode_number
                      ? 'bg-blue-600/25 border border-blue-500/40'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {ep.still_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                      alt=""
                      className="w-24 h-14 object-cover rounded-lg shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-14 bg-[#242424] rounded-lg shrink-0 flex items-center justify-center text-gray-500 text-sm font-bold">
                      {ep.episode_number}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {ep.episode_number}. {ep.name}
                    </p>
                    {ep.overview && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 hidden sm:block">{ep.overview}</p>
                    )}
                    {ep.runtime && (
                      <p className="text-xs text-gray-600 mt-0.5">{ep.runtime}m</p>
                    )}
                  </div>
                  {episode === ep.episode_number && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-gray-400 uppercase tracking-wider">Cast</h2>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {cast.map(person => (
                <div key={person.id} className="shrink-0 w-16 text-center space-y-1">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#242424] mx-auto">
                    {person.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl">👤</div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{person.name}</p>
                  <p className="text-xs text-gray-500 truncate">{person.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar content */}
        {similar.length > 0 && (
          <Section title={`More like ${title}`} items={similar} />
        )}
      </div>
    </div>
  )
}
