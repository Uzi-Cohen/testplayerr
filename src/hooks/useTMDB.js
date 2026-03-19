import { useState, useEffect, useRef } from 'react'

export function useTMDB(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchFn()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

/**
 * Paginated fetch that resets whenever resetKey changes.
 * fetchFnRef is read via ref so changing the function doesn't cause extra renders.
 */
export function usePaginatedTMDB(fetchFn, resetKey = '') {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchRef = useRef(fetchFn)
  useEffect(() => { fetchRef.current = fetchFn })

  const load = async (p) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRef.current(p)
      setItems(prev => p === 1 ? result.results : [...prev, ...result.results])
      setTotalPages(result.total_pages)
      setPage(p)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Reset and reload whenever the key changes
  useEffect(() => {
    setItems([])
    setPage(1)
    load(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const loadMore = () => { if (page < totalPages && !loading) load(page + 1) }

  return { items, loading, error, loadMore, hasMore: page < totalPages }
}
