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
      <div className="pt-16 flex justify-center items-center min-h-screen">
        <Spinner size={12} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-16 flex justify-center items-center min-h-screen">
        <div className="text-center space-y-3 max-w-md px-4">
          <p className="text-red-400 text-xl font-semibold">Configuration Required</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <div className="bg-[#181818] rounded-lg p-4 text-left text-sm font-mono">
            <p className="text-gray-500"># .env</p>
            <p className="text-green-400">VITE_TMDB_API_KEY=your_key_here</p>
          </div>
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="inline-block text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Get a free TMDB API key
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-14">
      <HeroSection item={hero} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-8">
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
          items={trending?.results?.slice(1).map(i => ({ ...i })) || []}
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
    </div>
  )
}
