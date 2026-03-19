import { useRef } from 'react'
import MovieCard from './MovieCard'

export default function Section({ title, items = [], viewAllLink }) {
  const scrollRef = useRef(null)

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  if (!items.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title text-base sm:text-lg">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <a href={viewAllLink}
              className="text-xs font-display uppercase tracking-wider transition-colors"
              style={{ color: '#1a9fff' }}>
              View All »
            </a>
          )}
          <button onClick={() => scroll(-1)}
            className="w-7 h-7 rounded flex items-center justify-center transition-all"
            style={{ background: 'rgba(26,127,212,0.15)', border: '1px solid rgba(26,127,212,0.2)' }}>
            <svg className="w-3.5 h-3.5" style={{ color: '#7ecfff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => scroll(1)}
            className="w-7 h-7 rounded flex items-center justify-center transition-all"
            style={{ background: 'rgba(26,127,212,0.15)', border: '1px solid rgba(26,127,212,0.2)' }}>
            <svg className="w-3.5 h-3.5" style={{ color: '#7ecfff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="glow-divider mb-2" />

      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map(item => (
          <div key={`${item.id}-${item.media_type || 'item'}`} className="shrink-0 w-32 sm:w-40">
            <MovieCard item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}
