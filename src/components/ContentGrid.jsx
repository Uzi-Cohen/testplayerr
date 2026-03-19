import MovieCard from './MovieCard'
import Spinner from './Spinner'

export default function ContentGrid({ items, loading, error, loadMore, hasMore, emptyMessage }) {
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-lg uppercase tracking-wider" style={{ color: '#e05050' }}>{error}</p>
        {error.includes('API key') && (
          <p className="text-sm mt-3" style={{ color: '#3a5a7a' }}>
            Add your TMDB API key to a <code className="px-1 rounded" style={{ background: '#0d1626', color: '#7ecfff' }}>.env</code> file as{' '}
            <code className="px-1 rounded" style={{ background: '#0d1626', color: '#7ecfff' }}>VITE_TMDB_API_KEY</code>
          </p>
        )}
      </div>
    )
  }

  if (loading && (!items || items.length === 0)) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20 font-display uppercase tracking-widest text-sm" style={{ color: '#2a4a6a' }}>
        {emptyMessage || 'No content found.'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
        {items.map(item => (
          <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-glow disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
