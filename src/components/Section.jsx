import { useRef } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard'

export default function Section({ title, items = [], viewAllLink }) {
  const scrollRef = useRef(null)

  // When a card inside this row gets focus, scroll it into view horizontally
  const handleRowFocus = (e) => {
    const el = e.target
    const row = scrollRef.current
    if (!row) return
    const eRect = el.getBoundingClientRect()
    const rRect = row.getBoundingClientRect()
    if (eRect.right > rRect.right - 16) {
      row.scrollBy({ left: eRect.right - rRect.right + 96, behavior: 'smooth' })
    } else if (eRect.left < rRect.left + 16) {
      row.scrollBy({ left: eRect.left - rRect.left - 96, behavior: 'smooth' })
    }
  }

  if (!items.length) return null

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="section-title text-sm">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            data-tv-focus="nav"
            tabIndex={0}
            className="text-xs font-display uppercase tracking-widest transition-colors"
            style={{ color: '#3a5a7a', letterSpacing: '0.12em' }}
          >
            See All »
          </Link>
        )}
      </div>

      <div className="glow-divider" />

      {/* Scrollable row — tv-row-scroll enables auto-scroll on D-pad focus */}
      <div
        ref={scrollRef}
        onFocus={handleRowFocus}
        className="tv-row-scroll flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(item => (
          <div key={`${item.id}-${item.media_type || 'item'}`} className="shrink-0 w-36 sm:w-44 md:w-48">
            <MovieCard item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
