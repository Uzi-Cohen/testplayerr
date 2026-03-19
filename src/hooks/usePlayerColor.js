import { useState } from 'react'

const DEFAULT_COLOR = '0061ff'
const STORAGE_KEY = 'streamking_color'

export function usePlayerColor() {
  const [color, setColorState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_COLOR
  })

  const setColor = (hex) => {
    const clean = hex.replace('#', '')
    setColorState(clean)
    localStorage.setItem(STORAGE_KEY, clean)
  }

  return { color, setColor }
}
