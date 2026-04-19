import { useCallback, useEffect, useState } from 'react'

export function useFullscreen(containerRef) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enter = useCallback(async () => {
    const el = containerRef.current
    if (!el?.requestFullscreen) return
    try {
      await el.requestFullscreen()
    } catch {
      // ignore
    }
  }, [containerRef])

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // ignore
    }
  }, [])

  const toggle = useCallback(async () => {
    if (document.fullscreenElement) await exit()
    else await enter()
  }, [enter, exit])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  return { isFullscreen, enter, exit, toggle }
}
