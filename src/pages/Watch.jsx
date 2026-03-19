import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { tmdb, posterUrl, backdropUrl, formatDate, formatRuntime } from '../utils/tmdb'
import { movieUrl, tvUrl } from '../utils/vidking'
import { saveProgress, getProgress } from '../utils/progress'
import { usePlayerColor } from '../hooks/usePlayerColor'
import ColorPicker from '../components/ColorPicker'
import Spinner from '../components/Spinner'
import Section from '../components/Section'

export default function Watch() {
  const params = useParams()
  const { id } = params
  // Derive media type from the URL pattern /watch/movie/:id or /watch/tv/:id
  const pathMediaType = window.location.pathname.split('/watch/')[1]?.split('/')[0] || 'movie'

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // TV state
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [seasonData, setSeasonData] = useState(null)
  const [totalSeasons, setTotalSeasons] = useState(1)

  // Player settings
  const { color, setColor } = usePlayerColor()
  const [autoPlay, setAutoPlay] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Progress
  const [playerEvents, setPlayerEvents] = useState([])
  const progressRef = useRef(null)

  // Similar content
  const [similar, setSimilar] = useState([])

  const isTv = pathMediaType === 'tv'


  useEffect(() => {
    setLoading(true)
    setError(null)
    const fetchDetails = isTv ? tmdb.tvDetails : tmdb.movieDetails
    fetchDetails(id)
      .then(data => {
        setDetails(data)
        if (isTv) {
          setTotalSeasons(data.number_of_seasons || 1)
        }
        setLoading(false)

        // Load similar
        const endpoint = isTv ? `/tv/${id}/similar` : `/movie/${id}/similar`
        fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
          .then(r => r.json())
          .then(d => setSimilar(d.results?.slice(0, 12).map(i => ({ ...i, media_type: pathMediaType })) || []))
          .catch(() => {})
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [id, pathMediaType, isTv])

  // Load season data when season changes
  useEffect(() => {
    if (!isTv) return
    tmdb.tvSeason(id, season)
      .then(setSeasonData)
      .catch(() => setSeasonData(null))
  }, [id, season, isTv])

  // Restore progress
  useEffect(() => {
    if (!details) return
    const saved = isTv
      ? getProgress('tv', id, season, episode)
      : getProgress('movie', id)
    progressRef.current = saved
  }, [id, isTv, season, episode, details])

  // Listen for player events via postMessage
  const handleMessage = useCallback((event) => {
    if (!event.data || typeof event.data !== 'string') return
    try {
      const msg = JSON.parse(event.data)
      if (msg.type !== 'PLAYER_EVENT') return
      const { data } = msg

      setPlayerEvents(prev => [
        { ...data, receivedAt: Date.now() },
        ...prev.slice(0, 9),
      ])

      // Save progress on timeupdate
      if (data.event === 'timeupdate' && data.progress > 0.01) {
        saveProgress(pathMediaType, id, {
          id,
          mediaType: pathMediaType,
          progress: data.progress,
          timestamp: data.currentTime,
          duration: data.duration,
          season: data.season,
          episode: data.episode,
          title: details?.title || details?.name,
          name: details?.name || details?.title,
          poster_path: details?.poster_path,
          vote_average: details?.vote_average,
          release_date: details?.release_date,
          first_air_date: details?.first_air_date,
        })
      }
    } catch {
      // Not JSON
    }
  }, [id, pathMediaType, details])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  const savedProgress = isTv
    ? getProgress('tv', id, season, episode)
    : getProgress('movie', id)

  const embedUrl = isTv
    ? tvUrl(id, season, episode, {
        color,
        autoPlay,
        nextEpisode: true,
        episodeSelector: true,
        progress: savedProgress?.timestamp || 0,
      })
    : movieUrl(id, {
        color,
        autoPlay,
        progress: savedProgress?.timestamp || 0,
      })

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
  const overview = details?.overview
  const backdrop = backdropUrl(details?.backdrop_path, 'w1280')
  const poster = posterUrl(details?.poster_path, 'w342')
  const genres = details?.genres || []
  const runtime = details?.runtime
  const date = details?.release_date || details?.first_air_date
  const cast = details?.credits?.cast?.slice(0, 6) || []
  const episodes = seasonData?.episodes || []

  return (
    <div className="pt-16 min-h-screen">
      {/* Player */}
      <div className="w-full bg-black" style={{ aspectRatio: '16/9', maxHeight: '85vh' }}>
        <iframe
          key={embedUrl}
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; fullscreen"
          title={`Watch ${title}`}
          style={{ display: 'block' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Title & meta */}
        <div className="flex gap-4">
          {poster && (
            <img
              src={poster}
              alt={title}
              className="w-20 h-28 object-cover rounded-lg shrink-0 hidden sm:block"
            />
          )}
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              {date && <span>{formatDate(date)}</span>}
              {runtime && <span>{formatRuntime(runtime)}</span>}
              {details?.vote_average > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {details.vote_average.toFixed(1)}
                </span>
              )}
              {genres.map(g => (
                <span key={g.id} className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{g.name}</span>
              ))}
            </div>
            {overview && <p className="text-gray-400 text-sm leading-relaxed">{overview}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: TV episode selector + cast */}
          <div className="lg:col-span-2 space-y-6">
            {/* TV Episode Selector */}
            {isTv && (
              <div className="bg-[#181818] rounded-xl p-4 space-y-4">
                <h2 className="font-semibold">Episodes</h2>
                <div className="flex gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Season</label>
                    <select
                      value={season}
                      onChange={e => { setSeason(Number(e.target.value)); setEpisode(1) }}
                      className="bg-[#242424] border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                    >
                      {Array.from({ length: totalSeasons }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Episode</label>
                    <select
                      value={episode}
                      onChange={e => setEpisode(Number(e.target.value))}
                      className="bg-[#242424] border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                    >
                      {(episodes.length > 0
                        ? episodes
                        : Array.from({ length: 24 }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }))
                      ).map(ep => (
                        <option key={ep.episode_number} value={ep.episode_number}>
                          {ep.episode_number}. {ep.name || `Episode ${ep.episode_number}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Episode list */}
                {episodes.length > 0 && (
                  <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                    {episodes.map(ep => (
                      <button
                        key={ep.episode_number}
                        onClick={() => setEpisode(ep.episode_number)}
                        className={`flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                          episode === ep.episode_number
                            ? 'bg-blue-600/30 border border-blue-500/50'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {ep.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                            alt=""
                            className="w-20 h-12 object-cover rounded shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-12 bg-[#242424] rounded shrink-0 flex items-center justify-center text-gray-600 text-xs">
                            {ep.episode_number}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {ep.episode_number}. {ep.name}
                          </p>
                          {ep.overview && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{ep.overview}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold">Cast</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {cast.map(person => (
                    <div key={person.id} className="text-center space-y-1">
                      <div className="w-full aspect-square rounded-full overflow-hidden bg-[#242424]">
                        {person.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                            👤
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{person.name}</p>
                      <p className="text-xs text-gray-500 truncate">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Player settings + event log */}
          <div className="space-y-4">
            {/* Settings panel */}
            <div className="bg-[#181818] rounded-xl p-4 space-y-4">
              <button
                onClick={() => setShowSettings(s => !s)}
                className="flex items-center justify-between w-full"
              >
                <span className="font-semibold text-sm">Player Settings</span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${showSettings ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSettings && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <ColorPicker color={color} onChange={setColor} />

                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Options</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setAutoPlay(a => !a)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${autoPlay ? 'bg-blue-600' : 'bg-white/20'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoPlay ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm text-gray-300">Auto Play</span>
                    </label>
                  </div>

                  {savedProgress && savedProgress.progress > 0 && (
                    <div className="text-xs text-gray-400 bg-white/5 rounded-lg p-2 space-y-1">
                      <p className="font-medium text-gray-300">Saved Progress</p>
                      <p>{Math.round(savedProgress.progress * 100)}% watched</p>
                      <p>At {formatRuntime(Math.floor((savedProgress.timestamp || 0) / 60))}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live event log */}
            {playerEvents.length > 0 && (
              <div className="bg-[#181818] rounded-xl p-4 space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Player Events</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {playerEvents.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                      <span className={`font-mono font-semibold ${
                        ev.event === 'play' ? 'text-green-400' :
                        ev.event === 'pause' ? 'text-yellow-400' :
                        ev.event === 'ended' ? 'text-red-400' :
                        ev.event === 'seeked' ? 'text-purple-400' :
                        'text-blue-400'
                      }`}>
                        {ev.event}
                      </span>
                      <span className="text-gray-500">
                        {ev.currentTime ? `${Math.floor(ev.currentTime)}s` : ''}
                        {ev.progress ? ` · ${(ev.progress * 100).toFixed(1)}%` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar content */}
        {similar.length > 0 && (
          <Section
            title={`More like ${title}`}
            items={similar}
          />
        )}
      </div>
    </div>
  )
}
