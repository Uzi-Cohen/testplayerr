import { useTMDB } from '../hooks/useTMDB'
import { tmdb } from '../utils/tmdb'
import { getWatchHistory } from '../utils/progress'
import HeroSection from '../components/HeroSection'
import Section from '../components/Section'
import Spinner from '../components/Spinner'

export default function Home() {
  const { data: trending, loading, error } = useTMDB(() => tmdb.trending('week'), [])
  const { data: popularMovies } = useTMDB(() => tmdb.popularMovies(), [])
  const { data: popularTV } = useTMDB(() => tmdb.popularTV(), [])
  const { data: nowPlaying } = useTMDB(() => tmdb.nowPlayingMovies(), [])

  const history = getWatchHistory()
  const hero = trending?.results?.[0]

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
            <p style={{ color: '#7ecfff' }}>VITE_TMDB_API_KEY=your_key_here</p>
          </div>
          <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer"
            className="inline-block text-sm underline" style={{ color: '#1a9fff' }}>
            Get a free TMDB API key →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <HeroSection item={hero} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-8 space-y-10">
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

        <Section
          title="Trending This Week"
          items={trending?.results?.slice(1) || []}
        />

        <Section
          title="Now Playing in Theaters"
          items={nowPlaying?.results?.map(i => ({ ...i, media_type: 'movie' })) || []}
          viewAllLink="/movies"
        />

        <Section
          title="Popular Movies"
          items={popularMovies?.results?.map(i => ({ ...i, media_type: 'movie' })) || []}
          viewAllLink="/movies"
        />

        <Section
          title="Popular TV Shows"
          items={popularTV?.results?.map(i => ({ ...i, media_type: 'tv' })) || []}
          viewAllLink="/tv"
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
