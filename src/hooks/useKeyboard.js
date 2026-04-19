import { useEffect } from 'react'

/**
 * @param {{
 *   onNext: () => void;
 *   onPrev: () => void;
 *   onToggleFullscreen: () => void;
 *   onToggleThumbs: () => void;
 *   onZoomIn: () => void;
 *   onZoomOut: () => void;
 *   onExitFullscreen: () => void;
 *   thumbsOpen: boolean;
 * }} p
 */
export function useKeyboard({
  onNext,
  onPrev,
  onToggleFullscreen,
  onToggleThumbs,
  onZoomIn,
  onZoomOut,
  onExitFullscreen,
  thumbsOpen,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          onExitFullscreen()
          return
        }
        if (thumbsOpen) onToggleThumbs()
        return
      }
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        onNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev()
      } else if (e.key === 'f' || e.key === 'F') {
        onToggleFullscreen()
      } else if (e.key === 't' || e.key === 'T') {
        onToggleThumbs()
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        onZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        onZoomOut()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    onNext,
    onPrev,
    onToggleFullscreen,
    onToggleThumbs,
    onZoomIn,
    onZoomOut,
    onExitFullscreen,
    thumbsOpen,
  ])
}
