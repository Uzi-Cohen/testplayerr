const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p'

async function fetchTMDB(path, params = {}) {
  if (!API_KEY) {
    throw new Error('TMDB API key not configured. Add VITE_TMDB_API_KEY to your .env file.')
  }
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('api_key', API_KEY)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

export const tmdb = {
  trending: (timeWindow = 'week') => fetchTMDB(`/trending/all/${timeWindow}`),
  popularMovies: (page = 1) => fetchTMDB('/movie/popular', { page }),
  topRatedMovies: (page = 1) => fetchTMDB('/movie/top_rated', { page }),
  nowPlayingMovies: (page = 1) => fetchTMDB('/movie/now_playing', { page }),
  popularTV: (page = 1) => fetchTMDB('/tv/popular', { page }),
  topRatedTV: (page = 1) => fetchTMDB('/tv/top_rated', { page }),
  airingTV: (page = 1) => fetchTMDB('/tv/on_the_air', { page }),
  movieDetails: (id) => fetchTMDB(`/movie/${id}`, { append_to_response: 'credits,videos' }),
  tvDetails: (id) => fetchTMDB(`/tv/${id}`, { append_to_response: 'credits,videos' }),
  tvSeason: (id, season) => fetchTMDB(`/tv/${id}/season/${season}`),
  search: (query, page = 1) => fetchTMDB('/search/multi', { query, page }),
  genres: {
    movies: () => fetchTMDB('/genre/movie/list'),
    tv: () => fetchTMDB('/genre/tv/list'),
  },
}

export function posterUrl(path, size = 'w500') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

export function backdropUrl(path, size = 'original') {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

export function formatRuntime(minutes) {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).getFullYear()
}
