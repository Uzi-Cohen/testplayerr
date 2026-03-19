import MovieCard from './MovieCard'
import Spinner from './Spinner'

export default function ContentGrid({ items, loading, error, loadMore, hasMore, emptyMessage }) {
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg">{error}</p>
        {error.includes('API key') && (
          <p className="text-gray-500 mt-2 text-sm">
            Add your TMDB API key to a <code className="bg-white/10 px-1 rounded">.env</code> file as{' '}
            <code className="bg-white/10 px-1 rounded">VITE_TMDB_API_KEY</code>
          </p>
        )}
      </div>
    )
  }

  if (loading && (!items || items.length === 0)) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        {emptyMessage || 'No content found.'}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map(item => (
          <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="btn-primary bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
