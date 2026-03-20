import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard'

/**
 * Section — horizontal row of MovieCards.
 * Supports both:
 *  - Row-based nav: pass isActive + focusedIndex (from useTVNav)
 *  - Spatial nav:   cards have data-tv-focus for useSpatialNav fallback
 */
export default function Section({ title, items = [], viewAllLink, isActive = false, focusedIndex = 0 }) {
  const scrollRef = useRef(null)

  // Scroll focused card into view whenever focusedIndex changes while this row is active
  useEffect(() => {
    if (!isActive || !scrollRef.current) return
    const cards = scrollRef.current.querySelectorAll('.tv-card')
    const card  = cards[Math.min(focusedIndex, cards.length - 1)]
    if (!card) return

    const row     = scrollRef.current
    const cRect   = card.getBoundingClientRect()
    const rRect   = row.getBoundingClientRect()

    if (cRect.right > rRect.right - 20) {
      row.scrollBy({ left: cRect.right - rRect.right + 120, behavior: 'smooth' })
    } else if (cRect.left < rRect.left + 20) {
      row.scrollBy({ left: cRect.left - rRect.left - 120, behavior: 'smooth' })
    }
  }, [isActive, focusedIndex])

  // Also scroll the row itself into the vertical viewport when it becomes active
  useEffect(() => {
    if (!isActive || !scrollRef.current) return
    const rowEl = scrollRef.current.closest('.tv-section')
    if (!rowEl) return
    const rect = rowEl.getBoundingClientRect()
    const vh   = window.innerHeight
    if (rect.top < 80) {
      window.scrollBy({ top: rect.top - 120, behavior: 'smooth' })
    } else if (rect.bottom > vh - 60) {
      window.scrollBy({ top: rect.bottom - vh + 120, behavior: 'smooth' })
    }
  }, [isActive])

  if (!items.length) return null

  return (
    <div className={`tv-section ${isActive ? 'tv-section--active' : ''}`}>
      <div className="tv-section__header">
        <h2 className="tv-section__title">{title}</h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="tv-section__see-all" data-tv-focus="nav" tabIndex={0}>
            See All »
          </Link>
        )}
      </div>

      <div ref={scrollRef} className="tv-section__scroll tv-row-scroll">
        {items.map((item, i) => (
          <div key={`${item.id}-${item.media_type || 'x'}`} className="tv-section__card-wrap">
            <MovieCard item={item} isActive={isActive && i === Math.min(focusedIndex, items.length - 1)} />
          </div>
        ))}
      </div>
    </div>
  )
}
