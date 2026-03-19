const STORAGE_KEY = 'streamking_progress'
const HISTORY_KEY = 'streamking_history'

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 20)))
}

/**
 * Key format:
 *   movie: "movie_<id>"
 *   tv:    "tv_<id>_s<season>e<episode>"
 */
export function progressKey(mediaType, id, season, episode) {
  if (mediaType === 'tv') return `tv_${id}_s${season}e${episode}`
  return `movie_${id}`
}

export function saveProgress(mediaType, id, data) {
  const all = loadAll()
  const key = mediaType === 'tv'
    ? progressKey('tv', id, data.season, data.episode)
    : progressKey('movie', id)
  all[key] = {
    ...data,
    savedAt: Date.now(),
  }
  saveAll(all)

  // Update watch history
  const history = loadHistory()
  const existing = history.findIndex(h => h.id === id && h.mediaType === mediaType)
  const entry = { id, mediaType, ...data, savedAt: Date.now() }
  if (existing >= 0) history.splice(existing, 1)
  saveHistory([entry, ...history])
}

export function getProgress(mediaType, id, season, episode) {
  const all = loadAll()
  const key = progressKey(mediaType, id, season, episode)
  return all[key] || null
}

export function getWatchHistory() {
  return loadHistory()
}

export function clearProgress(mediaType, id, season, episode) {
  const all = loadAll()
  const key = progressKey(mediaType, id, season, episode)
  delete all[key]
  saveAll(all)
}
