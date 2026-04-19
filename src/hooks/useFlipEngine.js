import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSpreads } from '../utils/bookModel'
import {
  FLIP_MS_COVER,
  FLIP_MS_SPREAD,
  easeCoverOpen,
  easeSpreadFlip,
  flipEase,
  flipShadowOpacity,
} from '../utils/pagePhysics'

/**
 * @param {number} pageCount
 * @param {'mobile' | 'tablet' | 'desktop'} viewport
 */
export function useFlipEngine(pageCount, viewport) {
  const isMobile = viewport === 'mobile'

  const spreads = useMemo(() => buildSpreads(pageCount), [pageCount])

  const [phase, setPhase] = useState('front')
  const [spreadIdx, setSpreadIdx] = useState(0)
  const [mobileIndex, setMobileIndex] = useState(0)

  const [flip, setFlip] = useState(null)
  const rafRef = useRef(null)
  const [liveProgress, setLiveProgress] = useState(0)
  const [liveLinear, setLiveLinear] = useState(0)

  const dragRef = useRef({
    active: false,
    kind: null,
    dir: null,
    startX: 0,
    width: 1,
    progress: 0,
    samples: [],
    lastT: 0,
    lastX: 0,
  })

  const currentSpread = spreads[spreadIdx] ?? { L: 1, R: null }

  const spreadLeft = isMobile ? mobileIndex : phase === 'spread' ? currentSpread.L : phase === 'front' ? 0 : pageCount - 1

  const spreadRight = isMobile
    ? mobileIndex
    : phase === 'spread'
      ? currentSpread.R
      : phase === 'front'
        ? null
        : pageCount - 1

  const canNext = useMemo(() => {
    if (pageCount <= 0) return false
    if (isMobile) return mobileIndex < pageCount - 1
    if (phase === 'front') return pageCount > 1
    if (phase === 'back') return false
    if (phase === 'spread') {
      if (spreadIdx < spreads.length - 1) return true
      return pageCount > 1
    }
    return false
  }, [pageCount, isMobile, mobileIndex, phase, spreadIdx, spreads.length])

  const canPrev = useMemo(() => {
    if (pageCount <= 0) return false
    if (isMobile) return mobileIndex > 0
    if (phase === 'front') return false
    if (phase === 'back') return true
    if (phase === 'spread') return true
    return false
  }, [pageCount, isMobile, mobileIndex, phase])

  const cancelAnim = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      cancelAnim()
      setFlip(null)
      setLiveProgress(0)
      setLiveLinear(0)
    })
  }, [viewport, cancelAnim])

  const flipDuration = useCallback((kind) => {
    if (kind === 'cover-open' || kind === 'cover-close' || kind === 'back-leaf') return FLIP_MS_COVER
    return FLIP_MS_SPREAD
  }, [])

  const easeForKind = useCallback((kind, linear) => {
    if (kind === 'cover-open' || kind === 'cover-close' || kind === 'back-leaf') return easeCoverOpen(linear)
    if (kind === 'forward' || kind === 'backward' || kind?.startsWith('mobile')) return easeSpreadFlip(linear)
    return flipEase(linear)
  }, [])

  const finishFlip = useCallback(
    (kind, dir) => {
      setFlip(null)
      setLiveProgress(0)
      setLiveLinear(0)

      if (isMobile) {
        if (dir === 'next') setMobileIndex((i) => Math.min(i + 1, pageCount - 1))
        else setMobileIndex((i) => Math.max(i - 1, 0))
        return
      }

      if (kind === 'cover-open') {
        if (spreads.length > 0) {
          setPhase('spread')
          setSpreadIdx(0)
        } else {
          setPhase('back')
        }
        return
      }
      if (kind === 'cover-close') {
        setPhase('front')
        return
      }
      if (kind === 'back-leaf') {
        setPhase('spread')
        setSpreadIdx(Math.max(0, spreads.length - 1))
        return
      }
      if (kind === 'forward') {
        if (phase === 'spread') {
          if (spreadIdx < spreads.length - 1) setSpreadIdx((s) => s + 1)
          else setPhase('back')
        }
        return
      }
      if (kind === 'backward') {
        if (phase === 'spread') {
          if (spreadIdx > 0) setSpreadIdx((s) => s - 1)
        }
        return
      }
    },
    [isMobile, pageCount, phase, spreadIdx, spreads.length],
  )

  const runFlipAnimation = useCallback(
    (kind, dir, fromProgress = 0) => {
      cancelAnim()
      const dur = flipDuration(kind)
      const start = performance.now() - fromProgress * dur
      const tick = (now) => {
        const linear = Math.min(1, Math.max(0, (now - start) / dur))
        const eased = easeForKind(kind, linear)
        setLiveLinear(linear)
        setLiveProgress(eased)
        if (linear < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = null
          finishFlip(kind, dir)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [cancelAnim, easeForKind, finishFlip, flipDuration],
  )

  const goNext = useCallback(() => {
    if (!canNext || flip) return
    if (isMobile) {
      setFlip({ kind: 'mobile-next', dir: 'next' })
      setLiveProgress(0)
      setLiveLinear(0)
      runFlipAnimation('mobile-next', 'next', 0)
      return
    }
    if (phase === 'front') {
      setFlip({ kind: 'cover-open', dir: 'next' })
      setLiveProgress(0)
      setLiveLinear(0)
      runFlipAnimation('cover-open', 'next', 0)
      return
    }
    if (phase === 'spread') {
      setFlip({ kind: 'forward', dir: 'next' })
      setLiveProgress(0)
      setLiveLinear(0)
      runFlipAnimation('forward', 'next', 0)
      return
    }
  }, [canNext, flip, isMobile, phase, runFlipAnimation])

  const goPrev = useCallback(() => {
    if (!canPrev || flip) return
    if (isMobile) {
      setFlip({ kind: 'mobile-prev', dir: 'prev' })
      setLiveProgress(0)
      setLiveLinear(0)
      runFlipAnimation('mobile-prev', 'prev', 0)
      return
    }
    if (phase === 'back') {
      setFlip({ kind: 'back-leaf', dir: 'prev' })
      setLiveProgress(0)
      setLiveLinear(0)
      runFlipAnimation('back-leaf', 'prev', 0)
      return
    }
    if (phase === 'spread') {
      if (spreadIdx === 0) {
        setFlip({ kind: 'cover-close', dir: 'prev' })
        setLiveProgress(0)
        setLiveLinear(0)
        runFlipAnimation('cover-close', 'prev', 0)
      } else {
        setFlip({ kind: 'backward', dir: 'prev' })
        setLiveProgress(0)
        setLiveLinear(0)
        runFlipAnimation('backward', 'prev', 0)
      }
    }
  }, [canPrev, flip, isMobile, phase, spreadIdx, runFlipAnimation])

  const goFirst = useCallback(() => {
    if (flip) return
    if (isMobile) setMobileIndex(0)
    else {
      setPhase('front')
      setSpreadIdx(0)
    }
  }, [flip, isMobile])

  const goLast = useCallback(() => {
    if (flip) return
    if (pageCount <= 0) return
    if (isMobile) setMobileIndex(pageCount - 1)
    else setPhase('back')
  }, [flip, isMobile, pageCount])

  const sliderValue = useMemo(() => {
    if (isMobile) return mobileIndex
    if (phase === 'front') return 0
    if (phase === 'back') return Math.max(0, pageCount - 1)
    return currentSpread.L
  }, [isMobile, mobileIndex, phase, pageCount, currentSpread.L])

  const goToPageIndex = useCallback(
    (idx) => {
      if (flip) return
      const n = Math.max(0, Math.min(idx, pageCount - 1))
      if (isMobile) {
        setMobileIndex(n)
        return
      }
      if (n === 0) {
        setPhase('front')
        return
      }
      if (n === pageCount - 1) {
        setPhase('back')
        return
      }
      const si = spreads.findIndex((s) => s.L === n || s.R === n)
      if (si >= 0) {
        setPhase('spread')
        setSpreadIdx(si)
      }
    },
    [flip, isMobile, pageCount, spreads],
  )

  const pageLabel = useMemo(() => {
    if (pageCount <= 0) return ''
    if (isMobile) return `Page ${mobileIndex + 1} / ${pageCount}`
    if (phase === 'front') return 'Cover'
    if (phase === 'back') return 'Back Cover'
    const L = currentSpread.L
    const R = currentSpread.R
    const a = L + 1
    const b = R != null ? R + 1 : a
    return R != null ? `Pages ${a}–${b}` : `Page ${a}`
  }, [pageCount, isMobile, mobileIndex, phase, currentSpread.L, currentSpread.R])

  const shadowOpacity = flip ? flipShadowOpacity(liveLinear, 0.4) : 0

  const flipKind = flip?.kind ?? null
  const flipDirection = flip?.dir ?? null

  /** Right-edge hinge for mesh (cover opening + back-cover return). */
  const hingeRight = flipKind === 'cover-open' || flipKind === 'back-leaf'

  const flipFrontIndex = useMemo(() => {
    if (!flip) return null
    if (isMobile) return mobileIndex
    if (flip.kind === 'cover-open') return 0
    if (flip.kind === 'cover-close') return spreads[0]?.L ?? null
    if (flip.kind === 'back-leaf') return pageCount > 0 ? pageCount - 1 : null
    if (flip.kind === 'forward') {
      const sp = spreads[spreadIdx]
      if (!sp) return null
      if (sp.R != null) return sp.R
      return sp.L
    }
    if (flip.kind === 'backward') {
      const sp = spreads[spreadIdx]
      return sp?.L ?? null
    }
    return null
  }, [flip, isMobile, mobileIndex, pageCount, spreadIdx, spreads])

  const flipBackIndex = useMemo(() => {
    if (!flip) return null
    if (isMobile) {
      if (flip.dir === 'next') return Math.min(mobileIndex + 1, pageCount - 1)
      return Math.max(mobileIndex - 1, 0)
    }
    if (flip.kind === 'cover-open' || flip.kind === 'back-leaf') return null
    if (flip.kind === 'cover-close') return 0
    if (flip.kind === 'forward') {
      const sp = spreads[spreadIdx]
      if (!sp) return null
      if (sp.R != null) {
        if (spreadIdx < spreads.length - 1) return spreads[spreadIdx + 1].L
        return pageCount - 1
      }
      return pageCount - 1
    }
    if (flip.kind === 'backward') {
      const sp = spreads[spreadIdx - 1]
      if (!sp) return 0
      return sp.R ?? sp.L
    }
    return null
  }, [flip, isMobile, mobileIndex, pageCount, spreadIdx, spreads])

  const compositeUnderSpread = useMemo(() => {
    if (!flip || flip.kind !== 'cover-open') return null
    const s0 = spreads[0]
    if (!s0) return null
    return { left: s0.L, right: s0.R }
  }, [flip, spreads])

  const compositeBackLeaf = useMemo(() => {
    if (!flip || flip.kind !== 'back-leaf') return null
    const sl = spreads[spreads.length - 1]
    if (!sl) return null
    return { left: sl.L, right: sl.R }
  }, [flip, spreads])

  const startDrag = useCallback(
    (dir, clientX, widthPx) => {
      if (flip) return
      if (dir === 'next' && !canNext) return
      if (dir === 'prev' && !canPrev) return
      const kind = isMobile
        ? dir === 'next'
          ? 'mobile-next'
          : 'mobile-prev'
        : phase === 'front' && dir === 'next'
          ? 'cover-open'
          : phase === 'back' && dir === 'prev'
          ? 'back-leaf'
          : phase === 'spread' && spreadIdx === 0 && dir === 'prev'
            ? 'cover-close'
            : phase === 'spread' && dir === 'next'
              ? 'forward'
              : phase === 'spread' && dir === 'prev'
                ? 'backward'
                : 'forward'
      dragRef.current = {
        active: true,
        kind,
        dir,
        startX: clientX,
        width: Math.max(1, widthPx),
        progress: 0,
        samples: [{ t: performance.now(), x: clientX }],
        lastT: performance.now(),
        lastX: clientX,
      }
      setFlip({ kind, dir })
      setLiveProgress(0)
      setLiveLinear(0)
    },
    [flip, canNext, canPrev, isMobile, phase, spreadIdx],
  )

  const updateDrag = useCallback((clientX) => {
    const d = dragRef.current
    if (!d.active || !d.dir) return
    const now = performance.now()
    const delta = d.dir === 'next' ? d.startX - clientX : clientX - d.startX
    const p = Math.min(1, Math.max(0, delta / d.width))
    d.progress = p
    d.samples.push({ t: now, x: clientX })
    if (d.samples.length > 8) d.samples.shift()
    d.lastT = now
    d.lastX = clientX
    setLiveLinear(p)
    const easeFn = easeForKind(d.kind, p)
    setLiveProgress(easeFn)
  }, [easeForKind])

  const endDrag = useCallback(() => {
    const d = dragRef.current
    if (!d.active) return
    d.active = false
    const p = d.progress
    const { kind, dir } = d
    if (!kind || !dir) return

    let vel = 0
    if (d.samples.length >= 2) {
      const a = d.samples[d.samples.length - 2]
      const b = d.samples[d.samples.length - 1]
      const dt = Math.max(1, b.t - a.t)
      vel = (b.x - a.x) / dt
    }
    const velTowardFlip = dir === 'next' ? -vel : vel
    const complete = p > 0.5 || velTowardFlip > 0.35

    if (complete) {
      const dur = flipDuration(kind)
      const from = p
      cancelAnim()
      const start = performance.now() - from * dur
      const tick = (now) => {
        const linear = Math.min(1, Math.max(0, (now - start) / dur))
        const eased = easeForKind(kind, linear)
        setLiveLinear(linear)
        setLiveProgress(eased)
        if (linear < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          rafRef.current = null
          finishFlip(kind, dir)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnim()
      setFlip(null)
      setLiveProgress(0)
      setLiveLinear(0)
    }
  }, [cancelAnim, easeForKind, finishFlip, flipDuration])

  const activePageIndex = isMobile ? mobileIndex : sliderValue

  return {
    viewport,
    isMobile,
    bookPhase: phase,
    spreadIdx,
    spreads,
    spreadLeft,
    spreadRight,
    mobileIndex,
    activePageIndex,
    pageLabel,
    sliderValue,
    canNext,
    canPrev,
    goNext,
    goPrev,
    goFirst,
    goLast,
    goToPageIndex,
    flipping: Boolean(flip),
    flipKind,
    flipDirection,
    hingeRight,
    flipProgress: liveProgress,
    flipLinearProgress: liveLinear,
    flipFrontIndex,
    flipBackIndex,
    compositeUnderSpread,
    compositeBackLeaf,
    shadowOpacity,
    startDrag,
    updateDrag,
    endDrag,
    cancelAnim,
  }
}
