import { useEffect, useRef, useState } from 'react'

export function useControlBarVisibility(bookHover, forceVisible) {
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    const apply = () => {
      if (forceVisible) {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setVisible(true)
        return
      }
      if (bookHover) {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setVisible(true)
        hideTimer.current = setTimeout(() => setVisible(false), 3000)
      } else {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => setVisible(false), 400)
      }
    }
    queueMicrotask(apply)
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [bookHover, forceVisible])

  return visible
}
