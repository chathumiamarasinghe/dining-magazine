/** Interior spreads after cover (0-based indices). Last slide index N-1 is back cover (never in spread). */
export function buildSpreads(n) {
  const spreads = []
  if (n < 2) return spreads
  const interiorLast = n - 2
  let i = 1
  while (i <= interiorLast) {
    const L = i
    const R = i + 1 <= interiorLast ? i + 1 : null
    spreads.push({ L, R })
    i += 2
  }
  return spreads
}

export function findSpreadIndexForPage(spreads, pageIndex) {
  if (pageIndex <= 0) return null
  const idx = spreads.findIndex((s) => s.L === pageIndex || s.R === pageIndex)
  return idx >= 0 ? idx : null
}
