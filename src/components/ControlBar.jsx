import { motion, AnimatePresence } from 'framer-motion'

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-full text-lg text-white transition hover:text-[#c9a84c]'

export default function ControlBar({
  visible,
  pageCount,
  pageLabel,
  sliderValue,
  compact,
  canNext,
  canPrev,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onSlider,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  onPdf,
  isFullscreen,
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className={`pointer-events-auto fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center rounded-full border border-white/10 px-2 py-2 shadow-2xl md:px-4 ${
            compact ? 'gap-1' : 'gap-1 md:gap-2'
          }`}
          style={{
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {compact ? (
            <>
              <button type="button" className={iconBtn} onClick={onPrev} disabled={!canPrev} aria-label="Previous">
                ◀
              </button>
              <span className="min-w-[5.5rem] px-1 text-center text-xs text-white/85">
                {pageLabel || `Page ${sliderValue + 1} / ${pageCount}`}
              </span>
              <button type="button" className={iconBtn} onClick={onNext} disabled={!canNext} aria-label="Next">
                ▶
              </button>
              <button
                type="button"
                onClick={onPdf}
                className="ml-1 rounded-full bg-[#c9a84c] px-2.5 py-1.5 text-xs font-semibold text-black transition hover:bg-[#dfc06a]"
              >
                ⬇ PDF
              </button>
            </>
          ) : (
            <>
              <button type="button" className={iconBtn} onClick={onFirst} aria-label="First page">
                ⏮
              </button>
              <button type="button" className={iconBtn} onClick={onPrev} disabled={!canPrev} aria-label="Previous">
                ◀
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(0, pageCount - 1)}
                value={Math.min(sliderValue, Math.max(0, pageCount - 1))}
                onChange={(e) => onSlider(Number(e.target.value))}
                className="mx-1 h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/25 accent-[#c9a84c] md:mx-2 md:w-40"
                aria-label="Page slider"
              />
              <button type="button" className={iconBtn} onClick={onNext} disabled={!canNext} aria-label="Next">
                ▶
              </button>
              <button type="button" className={iconBtn} onClick={onLast} aria-label="Last page">
                ⏭
              </button>
              <span className="hidden max-w-[10rem] truncate whitespace-nowrap px-1 text-xs text-white/80 md:inline">
                {pageLabel}
              </span>
              <button type="button" className={iconBtn} onClick={onZoomOut} aria-label="Zoom out">
                🔍-
              </button>
              <button type="button" className={iconBtn} onClick={onZoomIn} aria-label="Zoom in">
                🔍+
              </button>
              <button type="button" className={iconBtn} onClick={onFullscreen} aria-label="Fullscreen">
                {isFullscreen ? '⇤' : '⛶'}
              </button>
              <button
                type="button"
                onClick={onPdf}
                className="ml-1 rounded-full bg-[#c9a84c] px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-[#dfc06a] md:ml-2 md:px-4"
              >
                ⬇ PDF
              </button>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
