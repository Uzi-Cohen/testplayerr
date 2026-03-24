import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTMDB } from '../hooks/useTMDB'
import { useTVNav } from '../hooks/useTVNav'
import { tmdb } from '../utils/tmdb'
import { getWatchHistory } from '../utils/progress'
import { getWatchlist } from '../utils/watchlist'
import Navbar, { NAV_ITEMS } from '../components/Navbar'
import Section from '../components/Section'
import Spinner from '../components/Spinner'
import { backdropUrl, posterUrl } from '../utils/tmdb'

const tag = (data, mt) => data?.results?.slice(0, 20).map(i => ({ ...i, media_type: mt })) || []

export default function Home() {
  const navigate = useNavigate()

  // ── Data fetches ──
  const { data: trending, loading, error } = useTMDB(() => tmdb.trending('week'), [])
  const { data: popularMovies }  = useTMDB(() => tmdb.popularMovies(), [])
  const { data: popularTV }      = useTMDB(() => tmdb.popularTV(), [])
  const { data: nowPlaying }     = useTMDB(() => tmdb.nowPlayingMovies(), [])
  const { data: topRated }       = useTMDB(() => tmdb.topRatedMovies(), [])
  const { data: actionMovies }   = useTMDB(() => tmdb.discoverMovies(1, 28,   'popularity.desc'), [])
  const { data: comedyMovies }   = useTMDB(() => tmdb.discoverMovies(1, 35,   'popularity.desc'), [])
  const { data: horrorMovies }   = useTMDB(() => tmdb.discoverMovies(1, 27,   'popularity.desc'), [])
  const { data: scifiMovies }    = useTMDB(() => tmdb.discoverMovies(1, 878,  'popularity.desc'), [])
  const { data: thrillerMovies } = useTMDB(() => tmdb.discoverMovies(1, 53,   'popularity.desc'), [])
  const { data: dramaTV }        = useTMDB(() => tmdb.discoverTV(1, 18,    'popularity.desc'), [])
  const { data: scifiTV }        = useTMDB(() => tmdb.discoverTV(1, 10765, 'popularity.desc'), [])
  const { data: topRatedTV }     = useTMDB(() => tmdb.topRatedTV(), [])
  const { data: airingTV }       = useTMDB(() => tmdb.airingTV(), [])

  const history  = getWatchHistory()
  const watchlist = getWatchlist()
  const hero = trending?.results?.[0]

  // ── Surprise Me: pick a random item from trending ──
  const handleSurpriseMe = useCallback(() => {
    const pool = trending?.results
    if (!pool?.length) return
    const item = pool[Math.floor(Math.random() * pool.length)]
    const mt   = item.media_type || 'movie'
    navigate(`/watch/${mt}/${item.id}`)
  }, [trending, navigate])

  // ── Mood rows derived from genre fetches ──
  const darkAndIntense = useMemo(() => {
    const h = tag(horrorMovies, 'movie')
    const t = tag(thrillerMovies, 'movie')
    const combined = [...h, ...t].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i)
    return combined.slice(0, 20)
  }, [horrorMovies, thrillerMovies])

  // ── Build the ordered row definitions ──
  const rowDefs = useMemo(() => {
    const defs = []
    if (watchlist.length > 0)    defs.push({ id: 'mylist',    title: '♥ My List',                 items: watchlist.map(h => ({ ...h, media_type: h.mediaType })), viewAllLink: '/watchlist' })
    if (history.length > 0)      defs.push({ id: 'continue',  title: 'Continue Watching',          items: history.map(h => ({ ...h, media_type: h.mediaType })) })
    if (trending?.results)       defs.push({ id: 'trending',  title: 'Trending This Week',         items: trending.results.slice(1, 21) })
    if (nowPlaying?.results)     defs.push({ id: 'now',       title: 'Now Playing in Theaters',    items: tag(nowPlaying, 'movie'),     viewAllLink: '/movies' })
    if (topRated?.results)       defs.push({ id: 'top-movies',title: 'Top Rated Movies',           items: tag(topRated, 'movie'),       viewAllLink: '/movies' })
    if (popularMovies?.results)  defs.push({ id: 'pop-movies',title: 'Popular Movies',             items: tag(popularMovies, 'movie'),  viewAllLink: '/movies' })
    if (actionMovies?.results)   defs.push({ id: 'action',    title: '⚡ Action & Adventure',      items: tag(actionMovies, 'movie') })
    if (comedyMovies?.results)   defs.push({ id: 'easy',      title: '😄 Easy Watch — Comedy',    items: tag(comedyMovies, 'movie') })
    if (scifiMovies?.results)    defs.push({ id: 'scifi',     title: '🚀 Sci-Fi',                 items: tag(scifiMovies, 'movie') })
    if (darkAndIntense.length)   defs.push({ id: 'dark',      title: '🔥 Dark & Intense',         items: darkAndIntense })
    if (popularTV?.results)      defs.push({ id: 'pop-tv',    title: 'Popular TV Shows',           items: tag(popularTV, 'tv'),         viewAllLink: '/tv' })
    if (airingTV?.results)       defs.push({ id: 'airing',    title: 'Airing Now',                 items: tag(airingTV, 'tv'),          viewAllLink: '/tv' })
    if (topRatedTV?.results)     defs.push({ id: 'top-tv',    title: 'Top Rated Series',           items: tag(topRatedTV, 'tv'),        viewAllLink: '/tv' })
    if (dramaTV?.results)        defs.push({ id: 'drama-tv',  title: 'Drama Series',               items: tag(dramaTV, 'tv') })
    if (scifiTV?.results)        defs.push({ id: 'scifi-tv',  title: 'Sci-Fi & Fantasy Series',   items: tag(scifiTV, 'tv') })
    return defs
  }, [trending, popularMovies, popularTV, nowPlaying, topRated, actionMovies,
      comedyMovies, horrorMovies, scifiMovies, thrillerMovies, dramaTV, scifiTV,
      topRatedTV, airingTV, history, watchlist, darkAndIntense])

  // ── Row-based D-pad navigation ──
  const rowArrays = useMemo(() => rowDefs.map(r => r.items), [rowDefs])

  const { activeRow, activeCol, isNavActive } = useTVNav(rowArrays, {
    navItemCount: NAV_ITEMS.length,
    onNavSelect: (col) => navigate(NAV_ITEMS[col]?.path || '/'),
  })

  // ── Error / Loading screens ──
  if (loading) {
    return (
      <div className="tv-loading">
        <Spinner />
        <p className="tv-loading__text">Loading StreamKing…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tv-error">
        <p className="tv-error__title">Configuration Required</p>
        <p className="tv-error__msg">{error}</p>
        <div className="tv-error__code">
          <span className="dim"># .env</span>
          <span>VITE_TMDB_ACCESS_TOKEN=your_token_here</span>
        </div>
        <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="tv-error__link">
          Get a free TMDB API Read Access Token →
        </a>
      </div>
    )
  }

  const heroBackdrop = hero ? backdropUrl(hero.backdrop_path, 'w1280') : null
  const heroPoster   = hero ? posterUrl(hero.poster_path, 'w342') : null
  const heroTitle    = hero?.title || hero?.name || ''
  const heroType     = hero?.media_type || 'movie'

  return (
    <div className="tv-home">
      {/* ── Navbar ── */}
      <Navbar navFocused={isNavActive} navCol={activeCol} onSurpriseMe={handleSurpriseMe} />

      {/* ── Hero ── */}
      {hero && (
        <div className="tv-hero">
          {heroBackdrop && <img src={heroBackdrop} alt="" className="tv-hero__bg" />}
          <div className="tv-hero__vignette" />
          <div className="tv-hero__content">
            {heroPoster && <img src={heroPoster} alt={heroTitle} className="tv-hero__poster" />}
            <div className="tv-hero__info">
              <div className="tv-hero__badges">
                <span className="tv-hero__badge tv-hero__badge--featured">★ Featured</span>
                <span className={`tv-hero__badge tv-hero__badge--type ${heroType === 'tv' ? 'tv-hero__badge--tv' : ''}`}>
                  {heroType === 'tv' ? 'TV Series' : 'Film'}
                </span>
              </div>
              <h1 className="tv-hero__title">{heroTitle}</h1>
              {hero.overview && <p className="tv-hero__overview">{hero.overview}</p>}
              <div className="tv-hero__actions">
                <button className="tv-btn tv-btn--primary" onClick={() => navigate(`/watch/${heroType}/${hero.id}`)}>
                  ▶  Watch Now
                </button>
                <button className="tv-btn tv-btn--secondary" onClick={() => navigate(`/watch/${heroType}/${hero.id}`)}>
                  ℹ  More Info
                </button>
                <button className="tv-btn tv-btn--ghost" onClick={handleSurpriseMe}>
                  🎲 Surprise Me
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Content rows ── */}
      <div className="tv-rows">
        {rowDefs.map((row, i) => (
          <Section
            key={row.id}
            title={row.title}
            items={row.items}
            viewAllLink={row.viewAllLink}
            isActive={activeRow === i}
            focusedIndex={activeRow === i ? activeCol : 0}
          />
        ))}
      </div>

      <footer className="tv-footer">
        © {new Date().getFullYear()} StreamKing · Powered by VidKing Player
      </footer>
    </div>
  )
}
