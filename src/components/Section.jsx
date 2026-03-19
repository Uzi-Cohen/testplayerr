import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard'

export default function Section({ title, items = [], viewAllLink }) {
  const scrollRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const STEP = 340

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 8)
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * STEP, behavior: 'smooth' })
    setTimeout(updateArrows, 350)
  }

  if (!items.length) return null

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="section-title text-sm">{title}</h2>
        {viewAllLink && (
          <Link to={viewAllLink}
            className="text-xs font-display uppercase tracking-widest transition-colors"
            style={{ color: '#3a5a7a', letterSpacing: '0.12em' }}>
            See All »
          </Link>
        )}
      </div>

      {/* Divider */}
      <div className="glow-divider" />

      {/* Scroll row with side arrows */}
      <div className="relative group/row">

        {/* Left fade + arrow */}
        <div
          className="absolute left-0 top-0 bottom-2 z-10 flex items-center justify-start pl-1 transition-all duration-200"
          style={{
            width: '60px',
            background: 'linear-gradient(90deg, rgba(6,8,14,0.95) 0%, rgba(6,8,14,0.6) 60%, transparent 100%)',
            opacity: showLeft ? 1 : 0,
            pointerEvents: showLeft ? 'auto' : 'none',
          }}
        >
          <button
            onClick={() => scroll(-1)}
            className="w-9 h-9 rounded flex items-center justify-center transition-all duration-150 active:scale-90"
            style={{
              background: 'linear-gradient(180deg, #1a2a3a, #0d1826)',
              border: '1px solid rgba(180,40,40,0.45)',
              boxShadow: '0 0 12px rgba(180,40,40,0.2)',
            }}
          >
            <svg className="w-4 h-4" style={{ color: '#cc4040' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Right fade + arrow */}
        <div
          className="absolute right-0 top-0 bottom-2 z-10 flex items-center justify-end pr-1 transition-all duration-200"
          style={{
            width: '60px',
            background: 'linear-gradient(270deg, rgba(6,8,14,0.95) 0%, rgba(6,8,14,0.6) 60%, transparent 100%)',
            opacity: showRight ? 1 : 0,
            pointerEvents: showRight ? 'auto' : 'none',
          }}
        >
          <button
            onClick={() => scroll(1)}
            className="w-9 h-9 rounded flex items-center justify-center transition-all duration-150 active:scale-90"
            style={{
              background: 'linear-gradient(180deg, #1a2a3a, #0d1826)',
              border: '1px solid rgba(180,40,40,0.45)',
              boxShadow: '0 0 12px rgba(180,40,40,0.2)',
            }}
          >
            <svg className="w-4 h-4" style={{ color: '#cc4040' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map(item => (
            <div key={`${item.id}-${item.media_type || 'item'}`} className="shrink-0 w-32 sm:w-40">
              <MovieCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
