import { useEffect, useState } from 'react'

export function useManifest() {
  const [pages, setPages] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/slides/manifest.json', { cache: 'no-store' })
        if (!res.ok) throw new Error('manifest not found')
        const data = await res.json()
        const list = Array.isArray(data.pages) ? data.pages : []
        if (alive) setPages(list)
      } catch (e) {
        if (alive) setError(e?.message || 'load error')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return { pages, error, loading }
}
