import MovieCard from './MovieCard'
import Spinner from './Spinner'

export default function ContentGrid({ items, loading, error, loadMore, hasMore, emptyMessage }) {
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--red)', fontFamily: 'Oswald,sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {error}
        </p>
      </div>
    )
  }

  if (loading && (!items || items.length === 0)) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner /></div>
  }

  if (!items || items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)', fontFamily: 'Oswald,sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.85rem' }}>
        {emptyMessage || 'No content found.'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
        gap: '10px',
      }}>
        {items.map(item => (
          <MovieCard key={`${item.id}-${item.media_type}`} item={item} />
        ))}
      </div>

      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            data-tv-focus="nav"
            tabIndex={0}
            className="tv-btn tv-btn--secondary"
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
