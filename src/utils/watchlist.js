const KEY = 'streamking_watchlist'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(items) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function getWatchlist() {
  return load()
}

export function isInWatchlist(mediaType, id) {
  return load().some(i => i.id === id && i.mediaType === mediaType)
}

export function addToWatchlist(item) {
  const list = load()
  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  if (list.some(i => i.id === item.id && i.mediaType === mediaType)) return
  save([{ ...item, mediaType, addedAt: Date.now() }, ...list])
}

export function removeFromWatchlist(mediaType, id) {
  save(load().filter(i => !(i.id === id && i.mediaType === mediaType)))
}

export function toggleWatchlist(item) {
  const mediaType = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
  if (isInWatchlist(mediaType, item.id)) {
    removeFromWatchlist(mediaType, item.id)
    return false
  } else {
    addToWatchlist(item)
    return true
  }
}
