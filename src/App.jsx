import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import FullscreenWrapper from './components/FullscreenWrapper'
import LoadingScreen from './components/LoadingScreen'
import { GAME_PAGE_TOKEN } from './constants/pageTokens'
import { useManifest } from './hooks/useManifest'

export default function App() {
  const { pages, loading: manifestLoading, error } = useManifest()
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 })
  const [imagesReady, setImagesReady] = useState(false)
  const displayPages = useMemo(
    () => (pages.length > 0 ? [...pages, GAME_PAGE_TOKEN] : pages),
    [pages],
  )

  useEffect(() => {
    if (manifestLoading) return
    if (!pages.length) {
      queueMicrotask(() => {
        setImagesReady(true)
        setLoadProgress({ loaded: 0, total: 0 })
      })
      return
    }
    let cancelled = false
    const total = pages.length
    queueMicrotask(() => {
      setLoadProgress({ loaded: 0, total })
      setImagesReady(false)
    })
    ;(async () => {
      for (let i = 0; i < pages.length; i += 1) {
        const name = pages[i]
        await new Promise((resolve) => {
          const im = new Image()
          im.onload = () => resolve()
          im.onerror = () => resolve()
          im.src = `/slides/${name}`
        })
        if (cancelled) return
        setLoadProgress({ loaded: i + 1, total })
      }
      if (!cancelled) setImagesReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [pages, manifestLoading])

  const showLoader = manifestLoading || !imagesReady

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      <AnimatePresence>
        {showLoader ? (
          <LoadingScreen key="load" loaded={loadProgress.loaded} total={loadProgress.total} />
        ) : null}
      </AnimatePresence>

      {!showLoader && pages.length > 0 ? <FullscreenWrapper pages={displayPages} /> : null}

      {!showLoader && pages.length === 0 ? (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-white/80">
          <h1 className="text-2xl text-[#c9a84c]">No slides found</h1>
          <p className="mt-4 max-w-md text-sm">
            Add PNG or JPEG files to <code className="text-white">public/slides/</code> (for example{' '}
            <code className="text-white">slide-1.png</code>), then run{' '}
            <code className="text-white">npm run dev</code> to regenerate{' '}
            <code className="text-white">manifest.json</code>.
          </p>
          {error ? <p className="mt-3 text-xs text-red-300/90">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
