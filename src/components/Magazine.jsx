import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import FlipEngine from './FlipEngine'
import CoverHint from './CoverHint'
import { createSpreadCanvasTexture } from '../utils/spreadTexture'

const BOOK_SPREAD_W = 900
const BOOK_H = 636
const SPINE_SPREAD = 18
const PAGE_HALF = (BOOK_SPREAD_W - SPINE_SPREAD) / 2

const COVER_W = 450
const COVER_H = 636
const SPINE_CLOSED = 12
const STACK_LAYER = 6
const STACK_MAX = 8
const CLOSED_W = SPINE_CLOSED + COVER_W + STACK_MAX * STACK_LAYER
const COMPOSITE_W = PAGE_HALF * 2
const COMPOSITE_H = BOOK_H

const grain =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'120\' height=\'120\' filter=\'url(%23n)\' opacity=\'0.35\'/%3E%3C/svg%3E")'

const linen =
  'repeating-linear-gradient(90deg, rgba(80,70,55,0.04) 0px, rgba(80,70,55,0.04) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(0deg, rgba(60,50,40,0.035) 0px, rgba(60,50,40,0.035) 1px, transparent 1px, transparent 4px)'

function pageSrc(pages, i) {
  if (i == null || i < 0 || i >= pages.length) return null
  return `/slides/${pages[i]}`
}

function PageFace({
  src,
  side,
  w,
  h,
  cornerLift,
  cornerLiftSide,
  shadowSide,
  rounded = 'outer',
  linenOverlay,
}) {
  const isRight = side === 'right'
  const allRound = rounded === 'all'
  const lift = cornerLift && cornerLiftSide === (isRight ? 'br' : 'bl')
  return (
    <div
      className="relative overflow-hidden bg-[#f4efe4]"
      style={{
        width: w,
        height: h,
        borderRadius: allRound ? 4 : undefined,
        borderTopLeftRadius: allRound ? undefined : isRight ? 0 : 4,
        borderBottomLeftRadius: allRound ? undefined : isRight ? 0 : 4,
        borderTopRightRadius: allRound ? undefined : isRight ? 4 : 0,
        borderBottomRightRadius: allRound ? undefined : isRight ? 4 : 0,
        boxShadow: isRight
          ? 'inset 8px 0 14px -8px rgba(0,0,0,0.18)'
          : 'inset -8px 0 14px -8px rgba(0,0,0,0.18)',
      }}
    >
      {src ? (
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #f5f0e6 0%, #e8dcc8 55%, #dfd2bc 100%)',
          }}
        />
      )}
      {linenOverlay ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: linen, opacity: 0.08, mixBlendMode: 'multiply' }}
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 border border-[rgba(0,0,0,0.08)] mix-blend-multiply"
        style={{
          backgroundImage: grain,
          opacity: 0.03,
        }}
      />
      {shadowSide ? (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: shadowSide.opacity,
            background: shadowSide.gradient,
          }}
        />
      ) : null}
      <AnimatePresence>
        {lift ? (
          <motion.div
            className="pointer-events-none absolute bottom-0 flex items-end justify-center overflow-visible"
            style={{
              width: w * 0.42,
              height: h * 0.36,
              ...(isRight ? { right: 0 } : { left: 0 }),
              clipPath: isRight ? 'polygon(100% 100%, 0% 100%, 100% 0%)' : 'polygon(0 100%, 100% 100%, 0 0%)',
            }}
            initial={{ y: 0, rotate: 0 }}
            animate={{ y: -20, rotate: isRight ? -8 : 8 }}
            exit={{ y: 0, rotate: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div
              className="absolute inset-0 opacity-45"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.38), transparent)',
              }}
            />
            <span
              className="relative z-[1] mb-1 text-lg text-[#c9a84c] drop-shadow-md"
              style={{ transform: isRight ? 'rotate(-12deg)' : 'rotate(12deg)' }}
            >
              {isRight ? '➜' : '⬅'}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function PageStack({ side, layers }) {
  const n = Math.min(STACK_MAX, Math.max(1, layers))
  const data = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        i,
        bg: `linear-gradient(90deg, #e8dcc8 0%, #d4c09a ${40 + i * 6}%)`,
      })),
    [n],
  )
  return (
    <div
      className={`pointer-events-none absolute top-2 bottom-2 flex ${side === 'right' ? 'right-0 translate-x-0.5' : 'left-0 -translate-x-0.5'}`}
      aria-hidden
    >
      {data.map(({ i, bg }) => (
        <span
          key={i}
          className="absolute top-0 bottom-0 rounded-sm opacity-90 shadow-sm"
          style={{
            width: STACK_LAYER,
            background: bg,
            [side === 'right' ? 'right' : 'left']: `${i * STACK_LAYER}px`,
            transform: `translateY(${i * 0.7}px)`,
          }}
        />
      ))}
    </div>
  )
}

export default function Magazine({ pages, engine, onBookHover, viewport, tabletScale }) {
  const bookRef = useRef(null)
  const [cornerLiftSide, setCornerLiftSide] = useState(null)
  const dragActive = useRef(false)
  const ptrStart = useRef({ x: 0, y: 0 })
  const touchStart = useRef(null)

  const [underTex, setUnderTex] = useState(null)

  const isMobile = viewport === 'mobile'

  const {
    bookPhase,
    spreadIdx,
    spreads,
    canNext,
    canPrev,
    goNext,
    goPrev,
    flipping,
    flipDirection,
    flipKind,
    hingeRight,
    flipProgress,
    flipLinearProgress,
    flipFrontIndex,
    flipBackIndex,
    shadowOpacity,
    compositeUnderSpread,
    compositeBackLeaf,
    startDrag,
    updateDrag,
    endDrag,
  } = engine

  const spreadPair = spreads[spreadIdx] ?? { L: 1, R: null }

  useEffect(() => {
    const spec =
      flipKind === 'cover-open'
        ? compositeUnderSpread
        : flipKind === 'back-leaf'
          ? compositeBackLeaf
          : null
    if (!flipping || !spec) {
      queueMicrotask(() => {
        setUnderTex((t) => {
          if (t) t.dispose()
          return null
        })
      })
      return
    }
    let alive = true
    createSpreadCanvasTexture(
      (i) => pageSrc(pages, i) || '',
      spec.left,
      spec.right,
      COMPOSITE_W,
      COMPOSITE_H,
    ).then(
      (tex) => {
        if (!alive) {
          tex.dispose()
          return
        }
        setUnderTex((old) => {
          if (old) old.dispose()
          return tex
        })
      },
    )
    return () => {
      alive = false
    }
  }, [flipping, flipKind, compositeUnderSpread, compositeBackLeaf, pages])

  const leftIdx = useMemo(() => {
    if (isMobile) return engine.mobileIndex
    if (bookPhase === 'front') return 0
    if (bookPhase === 'back') return pages.length - 1
    return spreadPair.L
  }, [isMobile, engine.mobileIndex, bookPhase, spreadPair.L, pages.length])

  const rightIdx = useMemo(() => {
    if (isMobile) return null
    if (bookPhase === 'front') return null
    if (bookPhase === 'back') return null
    return spreadPair.R
  }, [isMobile, bookPhase, spreadPair.R])

  const leftSrc = pageSrc(pages, leftIdx)
  const rightSrc = pageSrc(pages, rightIdx)

  const stackRightCount = useMemo(() => {
    if (isMobile) return 0
    if (bookPhase === 'front') return Math.min(STACK_MAX, Math.max(1, pages.length - 1))
    if (bookPhase === 'back') return 0
    const lastIdx = spreadPair.R ?? spreadPair.L
    return Math.min(STACK_MAX, Math.max(1, pages.length - 1 - lastIdx))
  }, [isMobile, bookPhase, pages.length, spreadPair.L, spreadPair.R])

  const stackLeftCount = useMemo(() => {
    if (isMobile) return 0
    if (bookPhase === 'front') return 0
    if (bookPhase === 'back') return Math.min(STACK_MAX, Math.max(1, pages.length - 1))
    return Math.min(STACK_MAX, Math.max(1, spreadPair.L))
  }, [isMobile, bookPhase, pages.length, spreadPair.L])

  const openProgress = bookPhase !== 'front' ? 1 : flipKind === 'cover-open' ? flipLinearProgress : 0

  const bookOuterW = useMemo(() => {
    if (isMobile) return Math.min(typeof window !== 'undefined' ? window.innerWidth - 24 : 360, 420)
    if (bookPhase === 'spread') return BOOK_SPREAD_W
    if (bookPhase === 'back') {
      if (flipping && flipKind === 'back-leaf') {
        return CLOSED_W + (BOOK_SPREAD_W - CLOSED_W) * (1 - flipLinearProgress)
      }
      return CLOSED_W
    }
    if (bookPhase === 'front') {
      return CLOSED_W + (BOOK_SPREAD_W - CLOSED_W) * openProgress
    }
    return BOOK_SPREAD_W
  }, [isMobile, bookPhase, flipping, flipKind, flipLinearProgress, openProgress])

  const mobilePageW = bookOuterW
  const mobilePageH = Math.round(mobilePageW * (297 / 210))

  const dimSpread = { w: PAGE_HALF, h: BOOK_H }
  const dimMobile = { w: mobilePageW, h: mobilePageH }

  const shadowRight =
    flipDirection === 'next' && flipping && !hingeRight
      ? {
          opacity: shadowOpacity,
          gradient:
            'radial-gradient(ellipse 100% 88% at 82% 50%, rgba(0,0,0,0.5), transparent 58%)',
        }
      : null

  const shadowLeft =
    flipDirection === 'prev' && flipping && !hingeRight
      ? {
          opacity: shadowOpacity,
          gradient:
            'radial-gradient(ellipse 100% 88% at 18% 50%, rgba(0,0,0,0.5), transparent 58%)',
        }
      : null

  const shadowCover =
    flipping && (flipKind === 'cover-open' || flipKind === 'back-leaf')
      ? {
          opacity: shadowOpacity,
          gradient:
            flipKind === 'cover-open'
              ? 'radial-gradient(ellipse 95% 90% at 88% 50%, rgba(0,0,0,0.45), transparent 55%)'
              : 'radial-gradient(ellipse 95% 90% at 12% 50%, rgba(0,0,0,0.45), transparent 55%)',
        }
      : null

  const inRect = (e, rect) => {
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return { x, y, rect }
  }

  const inCornerBr = (x, y, w, h) => x > w * 0.7 && y > h * 0.66
  const inCornerBl = (x, y, w, h) => x < w * 0.3 && y > h * 0.66

  const onPointerDown = useCallback(
    (e) => {
      if (!bookRef.current || flipping) return
      const rect = bookRef.current.getBoundingClientRect()
      const { x, y } = inRect(e, rect)
      ptrStart.current = { x: e.clientX, y: e.clientY }
      if (inCornerBr(x, y, rect.width, rect.height) && canNext) {
        dragActive.current = true
        startDrag('next', e.clientX, rect.width * 0.42)
        e.preventDefault()
        return
      }
      if (inCornerBl(x, y, rect.width, rect.height) && canPrev) {
        dragActive.current = true
        startDrag('prev', e.clientX, rect.width * 0.42)
        e.preventDefault()
      }
    },
    [flipping, canNext, canPrev, startDrag],
  )

  const onPointerMove = useCallback(
    (e) => {
      if (dragActive.current) {
        updateDrag(e.clientX)
        return
      }
      if (!bookRef.current) return
      const rect = bookRef.current.getBoundingClientRect()
      const { x, y } = inRect(e, rect)
      if (!flipping) {
        setCornerLiftSide(
          inCornerBr(x, y, rect.width, rect.height) && canNext
            ? 'br'
            : inCornerBl(x, y, rect.width, rect.height) && canPrev
              ? 'bl'
              : null,
        )
      }
    },
    [updateDrag, canNext, canPrev, flipping],
  )

  const onPointerUp = useCallback(
    (e) => {
      if (dragActive.current) {
        dragActive.current = false
        endDrag()
        return
      }
      if (flipping || !bookRef.current) return
      const rect = bookRef.current.getBoundingClientRect()
      const dx = e.clientX - ptrStart.current.x
      const dy = e.clientY - ptrStart.current.y
      if (Math.hypot(dx, dy) > 14) return
      const { x } = inRect(e, rect)
      if (isMobile) {
        if (x < rect.width * 0.32 && canPrev) goPrev()
        else if (x > rect.width * 0.68 && canNext) goNext()
      } else if (bookPhase === 'front') {
        if (x > rect.width * 0.48 && canNext) goNext()
      } else if (bookPhase === 'back') {
        if (x < rect.width * 0.52 && canPrev) goPrev()
      } else {
        if (x < rect.width * 0.5 && canPrev) goPrev()
        else if (x >= rect.width * 0.5 && canNext) goNext()
      }
    },
    [endDrag, flipping, isMobile, bookPhase, canPrev, canNext, goPrev, goNext],
  )

  const onPointerLeave = useCallback(() => {
    setCornerLiftSide(null)
  }, [])

  const onTouchStart = useCallback((e) => {
    if (!e.touches?.[0]) return
    touchStart.current = { x: e.touches[0].clientX, t: Date.now() }
  }, [])

  const onTouchEnd = useCallback(
    (e) => {
      if (!touchStart.current || !e.changedTouches?.[0]) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      if (dx < -48 && canNext) goNext()
      else if (dx > 48 && canPrev) goPrev()
      touchStart.current = null
    },
    [canNext, canPrev, goNext, goPrev],
  )

  const frontFlipSrc = pageSrc(pages, flipFrontIndex)
  const backFlipSrc = pageSrc(pages, flipBackIndex)

  const showSpreadLeft = !(flipping && flipDirection === 'prev' && bookPhase === 'spread')
  const showSpreadRight = !(flipping && flipDirection === 'next' && bookPhase === 'spread')
  const showCoverStatic = !(flipping && flipKind === 'cover-open')
  const showBackStatic = !(flipping && flipKind === 'back-leaf')
  const showMobileStatic = !flipping || isMobile

  const coverBreath =
    bookPhase === 'front' && !flipping ? { scale: [1, 1.005, 1] } : { scale: 1 }

  return (
    <div
      className="flex flex-col items-center"
      style={tabletScale ? { transform: 'scale(0.75)', transformOrigin: 'center top' } : undefined}
    >
      <motion.div
        ref={bookRef}
        className="relative mx-auto select-none"
        style={{
          width: bookOuterW,
          height: isMobile ? mobilePageH : bookPhase === 'front' || bookPhase === 'back' ? COVER_H : BOOK_H,
          perspective: 2400,
        }}
        animate={coverBreath}
        transition={{ duration: 3, repeat: bookPhase === 'front' && !flipping ? Infinity : 0, ease: 'easeInOut' }}
        onPointerEnter={() => onBookHover?.(true)}
        onPointerLeave={(e) => {
          onPointerLeave()
          if (!e.currentTarget.contains(e.relatedTarget)) onBookHover?.(false)
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragActive.current = false
          endDrag()
        }}
        onTouchStart={isMobile ? onTouchStart : undefined}
        onTouchEnd={isMobile ? onTouchEnd : undefined}
      >
        <div
          className="relative flex h-full w-full items-stretch justify-center"
          style={{
            filter:
              bookPhase === 'front' && !flipping
                ? 'drop-shadow(0 20px 60px rgba(0,0,0,0.55)) drop-shadow(0 8px 20px rgba(0,0,0,0.35)) drop-shadow(8px 0 0 #8B7355) drop-shadow(12px 2px 0 #6B5335)'
                : 'drop-shadow(0 22px 28px rgba(0,0,0,0.38))',
          }}
        >
          {!isMobile && bookPhase !== 'back' ? <PageStack side="left" layers={stackLeftCount} /> : null}
          {!isMobile && bookPhase !== 'front' ? <PageStack side="right" layers={stackRightCount} /> : null}

          <div
            className="relative z-[2] flex h-full overflow-visible rounded-sm bg-[#0f0d0b]"
            style={{
              width: '100%',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {isMobile ? (
              <div className="relative">
                <PageFace
                  src={showMobileStatic ? leftSrc : null}
                  side="right"
                  w={dimMobile.w}
                  h={dimMobile.h}
                  cornerLift={false}
                  cornerLiftSide={null}
                  shadowSide={
                    flipping
                      ? {
                          opacity: shadowOpacity,
                          gradient:
                            flipDirection === 'next'
                              ? 'radial-gradient(ellipse 90% 85% at 74% 50%, rgba(0,0,0,0.42), transparent 55%)'
                              : 'radial-gradient(ellipse 90% 85% at 26% 50%, rgba(0,0,0,0.42), transparent 55%)',
                        }
                      : null
                  }
                  rounded="all"
                />
                {flipping ? (
                  <FlipEngine
                    active
                    direction={flipDirection}
                    hingeRight={hingeRight}
                    frontSrc={frontFlipSrc}
                    backSrc={backFlipSrc}
                    backTexture={underTex instanceof THREE.Texture ? underTex : null}
                    progress={flipProgress}
                    widthPx={mobilePageW}
                    heightPx={mobilePageH}
                    className="absolute inset-0 z-[20]"
                    style={{ width: mobilePageW, height: mobilePageH }}
                  />
                ) : null}
              </div>
            ) : bookPhase === 'front' ? (
              <div className="relative flex h-full w-full">
                <div
                  className="shrink-0 self-stretch bg-gradient-to-b from-[#1a1510] to-[#0a0806]"
                  style={{ width: SPINE_CLOSED }}
                />
                <div className="relative" style={{ width: COVER_W, height: COVER_H }}>
                  <PageFace
                    src={showCoverStatic ? leftSrc : null}
                    side="right"
                    w={COVER_W}
                    h={COVER_H}
                    cornerLift={Boolean(cornerLiftSide)}
                    cornerLiftSide={cornerLiftSide}
                    shadowSide={shadowCover}
                    rounded="all"
                    linenOverlay
                  />
                  {flipping && flipKind === 'cover-open' ? (
                    <>
                      <div
                        className="pointer-events-none absolute inset-0 z-[5] flex overflow-hidden"
                        style={{ opacity: 0.08 + 0.92 * flipLinearProgress }}
                      >
                        {compositeUnderSpread ? (
                          <>
                            <img src={pageSrc(pages, compositeUnderSpread.left)} alt="" className="h-full w-1/2 object-cover" />
                            {compositeUnderSpread.right != null ? (
                              <img src={pageSrc(pages, compositeUnderSpread.right)} alt="" className="h-full w-1/2 object-cover" />
                            ) : (
                              <div className="h-full w-1/2 bg-[#f4efe4]" />
                            )}
                          </>
                        ) : null}
                      </div>
                      <FlipEngine
                        active
                        direction="next"
                        hingeRight={hingeRight}
                        frontSrc={frontFlipSrc}
                        backSrc={backFlipSrc}
                        backTexture={underTex instanceof THREE.Texture ? underTex : null}
                        progress={flipProgress}
                        widthPx={COVER_W}
                        heightPx={COVER_H}
                        className="absolute inset-0 z-[20]"
                        style={{ width: COVER_W, height: COVER_H }}
                      />
                    </>
                  ) : null}
                </div>
                <div className="relative h-full shrink-0" style={{ width: STACK_MAX * STACK_LAYER }}>
                  <PageStack side="right" layers={stackRightCount} />
                </div>
              </div>
            ) : bookPhase === 'back' ? (
              <div className="relative flex h-full w-full">
                <div className="relative h-full shrink-0" style={{ width: STACK_MAX * STACK_LAYER }}>
                  <PageStack side="left" layers={stackLeftCount} />
                </div>
                <div className="relative" style={{ width: COVER_W, height: COVER_H }}>
                  <PageFace
                    src={showBackStatic ? leftSrc : null}
                    side="left"
                    w={COVER_W}
                    h={COVER_H}
                    cornerLift={Boolean(cornerLiftSide)}
                    cornerLiftSide={cornerLiftSide}
                    shadowSide={shadowCover}
                    rounded="all"
                    linenOverlay
                  />
                  {flipping && flipKind === 'back-leaf' ? (
                    <FlipEngine
                      active
                      direction="prev"
                      hingeRight={hingeRight}
                      frontSrc={frontFlipSrc}
                      backSrc={backFlipSrc}
                      backTexture={underTex instanceof THREE.Texture ? underTex : null}
                      progress={flipProgress}
                      widthPx={COVER_W}
                      heightPx={COVER_H}
                      className="absolute inset-0 z-[20]"
                      style={{ width: COVER_W, height: COVER_H }}
                    />
                  ) : null}
                </div>
                <div
                  className="shrink-0 self-stretch bg-gradient-to-b from-[#1a1510] to-[#0a0806]"
                  style={{ width: SPINE_CLOSED }}
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <PageFace
                    src={showSpreadLeft ? leftSrc : null}
                    side="left"
                    w={dimSpread.w}
                    h={dimSpread.h}
                    cornerLift={Boolean(cornerLiftSide)}
                    cornerLiftSide={cornerLiftSide}
                    shadowSide={shadowLeft}
                  />
                  {flipping && flipDirection === 'prev' ? (
                    <FlipEngine
                      active
                      direction="prev"
                      hingeRight={false}
                      frontSrc={frontFlipSrc}
                      backSrc={backFlipSrc}
                      progress={flipProgress}
                      widthPx={PAGE_HALF}
                      heightPx={BOOK_H}
                      className="absolute inset-0 z-[20]"
                      style={{ width: PAGE_HALF, height: BOOK_H }}
                    />
                  ) : null}
                </div>
                <div
                  className="relative z-[5] shrink-0 self-stretch"
                  style={{
                    width: SPINE_SPREAD,
                    background: 'linear-gradient(90deg, #0a0806 0%, #2a1f18 45%, #0a0806 100%)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.55)',
                  }}
                />
                <div className="relative">
                  <PageFace
                    src={showSpreadRight ? rightSrc : null}
                    side="right"
                    w={dimSpread.w}
                    h={dimSpread.h}
                    cornerLift={Boolean(cornerLiftSide)}
                    cornerLiftSide={cornerLiftSide}
                    shadowSide={shadowRight}
                  />
                  {flipping && flipDirection === 'next' ? (
                    <FlipEngine
                      active
                      direction="next"
                      hingeRight={false}
                      frontSrc={frontFlipSrc}
                      backSrc={backFlipSrc}
                      progress={flipProgress}
                      widthPx={PAGE_HALF}
                      heightPx={BOOK_H}
                      className="absolute inset-0 z-[20]"
                      style={{ width: PAGE_HALF, height: BOOK_H }}
                    />
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {!isMobile ? (
        <CoverHint
          visible={(bookPhase === 'front' || bookPhase === 'back') && !flipping}
          mode={bookPhase === 'back' ? 'back' : 'cover'}
        />
      ) : null}

    </div>
  )
}
