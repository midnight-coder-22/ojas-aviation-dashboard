import { useState, useEffect } from 'react'

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isFullscreen])

  return {
    isFullscreen,
    enterFullscreen: () => setIsFullscreen(true),
    exitFullscreen:  () => setIsFullscreen(false),
  }
}