import { useEffect } from 'react'

function getCenter(el) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function scrollFocusedIntoView(el) {
  // Horizontal scroll within the nearest tv-row-scroll container
  const rowScroll = el.closest('.tv-row-scroll')
  if (rowScroll) {
    const eRect = el.getBoundingClientRect()
    const rRect = rowScroll.getBoundingClientRect()
    if (eRect.right > rRect.right - 16) {
      rowScroll.scrollBy({ left: eRect.right - rRect.right + 96, behavior: 'smooth' })
    } else if (eRect.left < rRect.left + 16) {
      rowScroll.scrollBy({ left: eRect.left - rRect.left - 96, behavior: 'smooth' })
    }
  }
  // Vertical: keep the element visible with headroom for the navbar
  const rect = el.getBoundingClientRect()
  const vh = window.innerHeight
  if (rect.top < 90) {
    window.scrollBy({ top: rect.top - 140, behavior: 'smooth' })
  } else if (rect.bottom > vh - 60) {
    window.scrollBy({ top: rect.bottom - vh + 110, behavior: 'smooth' })
  }
}

function moveFocus(direction) {
  const focused = document.activeElement

  // Nothing focused yet — activate the first focusable card
  if (!focused || !focused.matches('[data-tv-focus]')) {
    const first = document.querySelector('[data-tv-focus]')
    if (first) { first.focus({ preventScroll: true }); scrollFocusedIntoView(first) }
    return
  }

  const all = Array.from(document.querySelectorAll('[data-tv-focus]'))
  const fc = getCenter(focused)
  let best = null, bestScore = Infinity

  for (const el of all) {
    if (el === focused) continue
    const tc = getCenter(el)
    const dx = tc.x - fc.x
    const dy = tc.y - fc.y

    // Filter: only elements in the pressed direction
    if (direction === 'right' && dx < 10) continue
    if (direction === 'left'  && dx > -10) continue
    if (direction === 'down'  && dy < 10) continue
    if (direction === 'up'    && dy > -10) continue

    // Score: primary axis distance + heavy penalty for perpendicular drift
    const primary = Math.abs(direction === 'right' || direction === 'left' ? dx : dy)
    const perp    = Math.abs(direction === 'right' || direction === 'left' ? dy : dx)
    const score   = primary + perp * 3

    if (score < bestScore) { bestScore = score; best = el }
  }

  if (best) {
    best.focus({ preventScroll: true })
    scrollFocusedIntoView(best)
  }
}

export function useSpatialNav() {
  useEffect(() => {
    const handleKey = (e) => {
      const dirMap = {
        ArrowLeft: 'left', ArrowRight: 'right',
        ArrowUp: 'up',     ArrowDown: 'down',
      }
      const dir = dirMap[e.key]
      if (!dir) return

      // Don't hijack arrow keys while typing
      const focused = document.activeElement
      if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return

      e.preventDefault()
      moveFocus(dir)
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])
}
