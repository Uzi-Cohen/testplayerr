import { useTMDB } from '../hooks/useTMDB'
import { tmdb } from '../utils/tmdb'
import { getWatchHistory } from '../utils/progress'
import HeroSection from '../components/HeroSection'
import Section from '../components/Section'
import Spinner from '../components/Spinner'

// TMDB genre IDs for movies
const GENRE_ACTION   = 28
const GENRE_COMEDY   = 35
const GENRE_HORROR   = 27
const GENRE_SCIFI    = 878
const GENRE_THRILLER = 53
const GENRE_CRIME    = 80
// TMDB genre IDs for TV
const GENRE_TV_DRAMA  = 18
const GENRE_TV_SCIFI  = 10765
const GENRE_TV_CRIME  = 80

export default function Home() {
  const { data: trending, loading, error } = useTMDB(() => tmdb.trending('week'), [])
  const { data: popularMovies }  = useTMDB(() => tmdb.popularMovies(), [])
  const { data: popularTV }      = useTMDB(() => tmdb.popularTV(), [])
  const { data: nowPlaying }     = useTMDB(() => tmdb.nowPlayingMovies(), [])
  const { data: topRated }       = useTMDB(() => tmdb.topRatedMovies(), [])
  const { data: actionMovies }   = useTMDB(() => tmdb.discoverMovies(1, GENRE_ACTION,   'popularity.desc'), [])
  const { data: comedyMovies }   = useTMDB(() => tmdb.discoverMovies(1, GENRE_COMEDY,   'popularity.desc'), [])
  const { data: horrorMovies }   = useTMDB(() => tmdb.discoverMovies(1, GENRE_HORROR,   'popularity.desc'), [])
  const { data: scifiMovies }    = useTMDB(() => tmdb.discoverMovies(1, GENRE_SCIFI,    'popularity.desc'), [])
  const { data: thrillerMovies } = useTMDB(() => tmdb.discoverMovies(1, GENRE_THRILLER, 'popularity.desc'), [])
  const { data: crimeMovies }    = useTMDB(() => tmdb.discoverMovies(1, GENRE_CRIME,    'popularity.desc'), [])
  const { data: dramaTV }        = useTMDB(() => tmdb.discoverTV(1, GENRE_TV_DRAMA,  'popularity.desc'), [])
  const { data: scifiTV }        = useTMDB(() => tmdb.discoverTV(1, GENRE_TV_SCIFI,  'popularity.desc'), [])
  const { data: crimeTV }        = useTMDB(() => tmdb.discoverTV(1, GENRE_TV_CRIME,  'popularity.desc'), [])
  const { data: topRatedTV }     = useTMDB(() => tmdb.topRatedTV(), [])
  const { data: airingTV }       = useTMDB(() => tmdb.airingTV(), [])

  const history = getWatchHistory()
  const hero = trending?.results?.[0]

  const tag = (items, mediaType) =>
    items?.results?.slice(0, 20).map(i => ({ ...i, media_type: mediaType })) || []

  if (loading) {
    return (
      <div className="pt-14 flex justify-center items-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-14 flex justify-center items-center min-h-screen">
        <div className="text-center space-y-4 max-w-md px-4">
          <p className="font-display text-2xl uppercase tracking-wider" style={{ color: '#e05050' }}>
            Configuration Required
          </p>
          <p className="text-sm" style={{ color: '#3a5a7a' }}>{error}</p>
          <div className="rounded p-4 text-left text-sm font-mono" style={{
            background: '#0d1626',
            border: '1px solid rgba(26,127,212,0.2)',
          }}>
            <p style={{ color: '#3a5a7a' }}># .env</p>
            <p style={{ color: '#7ecfff' }}>VITE_TMDB_ACCESS_TOKEN=your_token_here</p>
          </div>
          <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer"
            className="inline-block text-sm underline" style={{ color: '#1a9fff' }}>
            Get a free TMDB API Read Access Token →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <HeroSection item={hero} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 space-y-10">

        {/* ── Continue Watching ── */}
        {history.length > 0 && (
          <Section
            title="Continue Watching"
            items={history.map(h => ({
              id: h.id,
              media_type: h.mediaType,
              title: h.title,
              name: h.name,
              poster_path: h.poster_path,
              vote_average: h.vote_average,
              release_date: h.release_date,
              first_air_date: h.first_air_date,
            }))}
          />
        )}

        {/* ── Trending ── */}
        <Section
          title="Trending This Week"
          items={trending?.results?.slice(1, 21) || []}
        />

        {/* ── Now Playing ── */}
        <Section
          title="Now Playing in Theaters"
          items={tag(nowPlaying, 'movie')}
          viewAllLink="/movies"
        />

        {/* ── Top Rated Movies ── */}
        <Section
          title="Top Rated Movies"
          items={tag(topRated, 'movie')}
          viewAllLink="/movies"
        />

        {/* ── Popular Movies ── */}
        <Section
          title="Popular Movies"
          items={tag(popularMovies, 'movie')}
          viewAllLink="/movies"
        />

        {/* ── Action & Adventure ── */}
        <Section
          title="Action & Adventure"
          items={tag(actionMovies, 'movie')}
        />

        {/* ── Comedy ── */}
        <Section
          title="Comedy"
          items={tag(comedyMovies, 'movie')}
        />

        {/* ── Sci-Fi ── */}
        <Section
          title="Sci-Fi"
          items={tag(scifiMovies, 'movie')}
        />

        {/* ── Horror ── */}
        <Section
          title="Horror"
          items={tag(horrorMovies, 'movie')}
        />

        {/* ── Thriller ── */}
        <Section
          title="Thriller"
          items={tag(thrillerMovies, 'movie')}
        />

        {/* ── Crime ── */}
        <Section
          title="Crime"
          items={tag(crimeMovies, 'movie')}
        />

        {/* ── Popular TV Shows ── */}
        <Section
          title="Popular TV Shows"
          items={tag(popularTV, 'tv')}
          viewAllLink="/tv"
        />

        {/* ── Airing Now ── */}
        <Section
          title="Airing Now"
          items={tag(airingTV, 'tv')}
          viewAllLink="/tv"
        />

        {/* ── Top Rated Series ── */}
        <Section
          title="Top Rated Series"
          items={tag(topRatedTV, 'tv')}
          viewAllLink="/tv"
        />

        {/* ── Drama Series ── */}
        <Section
          title="Drama Series"
          items={tag(dramaTV, 'tv')}
        />

        {/* ── Sci-Fi & Fantasy Series ── */}
        <Section
          title="Sci-Fi & Fantasy Series"
          items={tag(scifiTV, 'tv')}
        />

        {/* ── Crime Series ── */}
        <Section
          title="Crime Series"
          items={tag(crimeTV, 'tv')}
        />
      </div>

      {/* Footer */}
      <footer className="border-t mt-10 py-6 text-center"
        style={{ borderColor: 'rgba(26,127,212,0.15)' }}>
        <p className="font-display text-xs uppercase tracking-widest" style={{ color: '#1a3050' }}>
          © {new Date().getFullYear()} StreamKing · Powered by VidKing Player
        </p>
      </footer>
    </div>
  )
}
