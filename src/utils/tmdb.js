const ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN
const BASE_URL = 'https://api.themoviedb.org/3'
export const IMG_BASE = 'https://image.tmdb.org/t/p'

async function fetchTMDB(path, params = {}) {
  if (!ACCESS_TOKEN) {
    throw new Error('TMDB access token not configured. Add VITE_TMDB_ACCESS_TOKEN to your .env file.')
  }
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('language', 'en-US')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      accept: 'application/json',
    },
  })
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
  searchQuick: (query) => fetchTMDB('/search/multi', { query, page: 1 }),
  discoverMovies: (page = 1, genreId = null, sortBy = 'popularity.desc') =>
    fetchTMDB('/discover/movie', {
      page, sort_by: sortBy,
      ...(genreId ? { with_genres: genreId } : {}),
    }),
  discoverTV: (page = 1, genreId = null, sortBy = 'popularity.desc') =>
    fetchTMDB('/discover/tv', {
      page, sort_by: sortBy,
      ...(genreId ? { with_genres: genreId } : {}),
    }),
  genreMovies: () => fetchTMDB('/genre/movie/list'),
  genreTV: () => fetchTMDB('/genre/tv/list'),
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
