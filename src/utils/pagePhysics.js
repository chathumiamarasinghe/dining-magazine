/** Cubic-bezier easing: sample Y at X=t along curve (0,0)->(1,1) with given control points. */
function cubicBezierY(t, x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleX = (u) => ((ax * u + bx) * u + cx) * u
  const sampleY = (u) => ((ay * u + by) * u + cy) * u

  let u = t
  for (let k = 0; k < 10; k += 1) {
    const x = sampleX(u) - t
    if (Math.abs(x) < 1e-4) break
    const dx = (3 * ax * u + 2 * bx) * u + cx
    u -= dx !== 0 ? x / dx : x
    u = Math.min(1, Math.max(0, u))
  }
  return sampleY(u)
}

export function easeCoverOpen(t) {
  return cubicBezierY(Math.min(1, Math.max(0, t)), 0.25, 0.46, 0.45, 0.94)
}

export function easeSpreadFlip(t) {
  return cubicBezierY(Math.min(1, Math.max(0, t)), 0.645, 0.045, 0.355, 1)
}

/** Fast start, slow dramatic finish — drag / legacy */
export function flipEase(t) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 4
}

export function flipEaseInverse(ey) {
  const y = Math.min(1, Math.max(0, ey))
  return 1 - (1 - y) ** (1 / 4)
}

export function flipShadowOpacity(linearProgress, maxOpacity = 0.4) {
  return Math.sin(linearProgress * Math.PI) * maxOpacity
}

export const FLIP_MS_COVER = 900
export const FLIP_MS_SPREAD = 750

/** Legacy export */
export const FLIP_MS = FLIP_MS_COVER
