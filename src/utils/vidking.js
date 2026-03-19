const VIDKING_BASE = 'https://www.vidking.net/embed'

/**
 * Build a VidKing embed URL for a movie
 * @param {number|string} tmdbId
 * @param {object} opts
 */
export function movieUrl(tmdbId, opts = {}) {
  const url = new URL(`${VIDKING_BASE}/movie/${tmdbId}`)
  applyParams(url, opts)
  return url.toString()
}

/**
 * Build a VidKing embed URL for a TV episode
 * @param {number|string} tmdbId
 * @param {number} season
 * @param {number} episode
 * @param {object} opts
 */
export function tvUrl(tmdbId, season, episode, opts = {}) {
  const url = new URL(`${VIDKING_BASE}/tv/${tmdbId}/${season}/${episode}`)
  applyParams(url, { nextEpisode: true, episodeSelector: true, ...opts })
  return url.toString()
}

function applyParams(url, opts) {
  if (opts.color) url.searchParams.set('color', opts.color.replace('#', ''))
  if (opts.autoPlay) url.searchParams.set('autoPlay', 'true')
  if (opts.nextEpisode) url.searchParams.set('nextEpisode', 'true')
  if (opts.episodeSelector) url.searchParams.set('episodeSelector', 'true')
  if (opts.progress != null && opts.progress > 0) url.searchParams.set('progress', Math.floor(opts.progress))
}

export const PRESET_COLORS = [
  { name: 'Default Blue', value: '0061ff' },
  { name: 'Netflix Red', value: 'e50914' },
  { name: 'YouTube Red', value: 'ff0000' },
  { name: 'Twitch Purple', value: '9146ff' },
  { name: 'Discord Blue', value: '5865f2' },
  { name: 'Spotify Green', value: '1db954' },
  { name: 'Orange', value: 'ff6600' },
  { name: 'Pink', value: 'ff69b4' },
]
