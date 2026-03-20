/**
 * useTVNav — reliable row-based D-pad navigation for TV remote controls.
 *
 * Usage:
 *   const rows = [items0, items1, items2, ...]   // each is an array of TMDB items
 *   const { activeRow, activeCol, isNavActive } = useTVNav(rows, { navItemCount: 4 })
 *
 * - Up/Down moves between rows (activeRow -1 = navbar focused)
 * - Left/Right moves within the current row, clamped to row length
 * - Enter navigates to /watch/<type>/<id> for the focused item
 * - Escape / Back navigates to -1 in history
 * - Column position is remembered per-row when jumping between rows
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const KEYCODE_MAP = {
  37: 'ArrowLeft',  38: 'ArrowUp',
  39: 'ArrowRight', 40: 'ArrowDown',
  13: 'Enter',      27: 'Escape',
  10009: 'Escape',  461: 'Escape',   // Samsung / LG back
  8: 'Escape',                        // Android back (keyCode 8 in some WebViews)
}

export function useTVNav(rows, { navItemCount = 4, onNavSelect } = {}) {
  // row = -1  → navbar focused
  // row >= 0  → content row focused
  const [activeRow, setActiveRow] = useState(0)
  const [activeCol, setActiveCol] = useState(0)
  const savedCols = useRef({})   // persists col per row across row switches
  const navigate = useNavigate()

  // Keep refs current to avoid stale closures in the event listener
  const rowRef   = useRef(0)
  const colRef   = useRef(0)
  const rowsRef  = useRef(rows)

  useEffect(() => { rowRef.current  = activeRow }, [activeRow])
  useEffect(() => { colRef.current  = activeCol }, [activeCol])
  useEffect(() => { rowsRef.current = rows      }, [rows])

  // Clamp activeRow if rows shrink (e.g. during loading)
  useEffect(() => {
    if (rows.length > 0 && activeRow >= rows.length) {
      setActiveRow(rows.length - 1)
    }
  }, [rows.length]) // eslint-disable-line

  const setPosition = useCallback((newRow, newCol) => {
    const r = rowsRef.current
    const clampedRow = Math.max(-1, Math.min(r.length - 1, newRow))
    const rowItems   = clampedRow >= 0 ? (r[clampedRow] || []) : Array(navItemCount).fill(null)
    const clampedCol = Math.max(0, Math.min(rowItems.length - 1, newCol))
    setActiveRow(clampedRow)
    setActiveCol(clampedCol)
    rowRef.current  = clampedRow
    colRef.current  = clampedCol
  }, [navItemCount])

  useEffect(() => {
    const handler = (e) => {
      const key = e.key || KEYCODE_MAP[e.keyCode]
      if (!key) return

      // Let the user type in inputs without interference
      const focused = document.activeElement
      if (focused?.tagName === 'INPUT' || focused?.tagName === 'TEXTAREA') {
        if (key === 'Escape') focused.blur()
        return
      }

      const r    = rowRef.current
      const c    = colRef.current
      const rows = rowsRef.current

      switch (key) {
        case 'ArrowUp': {
          e.preventDefault()
          savedCols.current[r] = c
          const newRow = r - 1
          setPosition(newRow, savedCols.current[newRow] ?? 0)
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          if (r >= rows.length - 1) break
          savedCols.current[r] = c
          const newRow = r + 1
          setPosition(newRow, savedCols.current[newRow] ?? 0)
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          setPosition(r, c - 1)
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          setPosition(r, c + 1)
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (r === -1) {
            // Navbar row — let caller handle it
            onNavSelect?.(c)
          } else if (rows[r]) {
            const item = rows[r][c]
            if (item) {
              const mt = item.media_type || (item.first_air_date !== undefined ? 'tv' : 'movie')
              navigate(`/watch/${mt}/${item.id}`)
            }
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          navigate(-1)
          break
        }
        default: break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, setPosition, onNavSelect])

  return {
    activeRow,
    activeCol,
    isNavActive: activeRow === -1,
  }
}
