import { useCallback, useRef, useState, useEffect } from 'react'
import Magazine from './Magazine'
import ControlBar from './ControlBar'
import { useControlBarVisibility } from '../hooks/useControlBarVisibility'
import ThumbnailPanel from './ThumbnailPanel'
import PdfModal from './PdfModal'
import { useFlipEngine } from '../hooks/useFlipEngine'
import { useFullscreen } from '../hooks/useFullscreen'
import { useKeyboard } from '../hooks/useKeyboard'
import { exportMagazinePdf } from '../utils/pdfExport'

function useViewport() {
  const [viewport, setViewport] = useState('desktop')
  useEffect(() => {
    const mqMobile = window.matchMedia('(max-width: 639px)')
    const mqTablet = window.matchMedia('(max-width: 1024px)')
    const fn = () => {
      if (mqMobile.matches) setViewport('mobile')
      else if (mqTablet.matches) setViewport('tablet')
      else setViewport('desktop')
    }
    fn()
    mqMobile.addEventListener('change', fn)
    mqTablet.addEventListener('change', fn)
    return () => {
      mqMobile.removeEventListener('change', fn)
      mqTablet.removeEventListener('change', fn)
    }
  }, [])
  return viewport
}

export default function FullscreenWrapper({ pages }) {
  const rootRef = useRef(null)
  const { isFullscreen, toggle, exit } = useFullscreen(rootRef)
  const viewport = useViewport()
  const [thumbsOpen, setThumbsOpen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [bookHover, setBookHover] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfCur, setPdfCur] = useState(0)

  const engine = useFlipEngine(pages.length, viewport)
  const barVisible = useControlBarVisibility(bookHover, isFullscreen)

  const onZoomIn = useCallback(() => setZoom((z) => Math.min(150, z + 8)), [])
  const onZoomOut = useCallback(() => setZoom((z) => Math.max(80, z - 8)), [])

  const runPdf = useCallback(async () => {
    setPdfOpen(true)
    setPdfCur(0)
    try {
      await exportMagazinePdf({
        pages,
        onProgress: (cur) => setPdfCur(cur),
      })
    } catch {
      // silent
    } finally {
      setPdfOpen(false)
    }
  }, [pages])

  useKeyboard({
    onNext: engine.goNext,
    onPrev: engine.goPrev,
    onToggleFullscreen: toggle,
    onToggleThumbs: () => setThumbsOpen((v) => !v),
    onZoomIn,
    onZoomOut,
    onExitFullscreen: exit,
    thumbsOpen,
  })

  const thumbActive = useCallback(
    (idx) => {
      if (engine.isMobile) return idx === engine.mobileIndex
      if (engine.bookPhase === 'front') return idx === 0
      if (engine.bookPhase === 'back') return idx === pages.length - 1
      return (
        idx === engine.spreadLeft || (engine.spreadRight != null && idx === engine.spreadRight)
      )
    },
    [
      engine.isMobile,
      engine.mobileIndex,
      engine.bookPhase,
      engine.spreadLeft,
      engine.spreadRight,
      pages.length,
    ],
  )

  const tabletScale = viewport === 'tablet' && !engine.isMobile

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white"
      style={{
        backgroundImage: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(35,32,28,0.55) 0%, transparent 62%)',
      }}
    >
      <ThumbnailPanel
        open={thumbsOpen}
        pages={pages}
        activePredicate={thumbActive}
        onSelect={(idx) => {
          engine.goToPageIndex(idx)
          setThumbsOpen(false)
        }}
        onClose={() => setThumbsOpen(false)}
      />

      <button
        type="button"
        className="fixed left-3 top-1/2 z-[100] -translate-y-1/2 rounded-full border border-white/15 bg-black/50 px-2.5 py-2 text-lg text-white shadow-lg backdrop-blur-md transition hover:border-[#c9a84c] hover:text-[#c9a84c]"
        onClick={() => setThumbsOpen((v) => !v)}
        aria-label="Toggle thumbnails"
      >
        📄
      </button>

      <div
        className="flex min-h-screen flex-col items-center justify-center px-3 pb-28 pt-10 md:px-8 md:pb-32"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
          transition: 'transform 0.35s ease',
        }}
      >
        <Magazine
          pages={pages}
          engine={engine}
          onBookHover={setBookHover}
          viewport={viewport}
          tabletScale={tabletScale}
        />
      </div>

      <ControlBar
        visible={barVisible}
        pageCount={pages.length}
        pageLabel={engine.pageLabel}
        sliderValue={engine.sliderValue}
        compact={engine.isMobile}
        canNext={engine.canNext}
        canPrev={engine.canPrev}
        onFirst={engine.goFirst}
        onPrev={engine.goPrev}
        onNext={engine.goNext}
        onLast={engine.goLast}
        onSlider={engine.goToPageIndex}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFullscreen={toggle}
        onPdf={runPdf}
        isFullscreen={isFullscreen}
      />

      <PdfModal open={pdfOpen} current={pdfCur} total={pages.length} />
    </div>
  )
}
