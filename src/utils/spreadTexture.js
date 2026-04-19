import * as THREE from 'three'

/**
 * Build a single texture with left page on left half, right page on right half (or full-bleed left if right null).
 * @param {(path: string) => string} toUrl
 */
export function createSpreadCanvasTexture(toUrl, leftIndex, rightIndex, pixelW, pixelH) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = pixelW
    canvas.height = pixelH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('no canvas'))
      return
    }

    const load = (idx) =>
      new Promise((res, rej) => {
        if (idx == null) {
          res(null)
          return
        }
        const im = new Image()
        im.crossOrigin = 'anonymous'
        im.onload = () => res(im)
        im.onerror = () => rej(new Error('img'))
        im.src = toUrl(idx)
      })

    Promise.all([load(leftIndex), load(rightIndex)])
      .then(([imL, imR]) => {
        ctx.fillStyle = '#f4efe4'
        ctx.fillRect(0, 0, pixelW, pixelH)
        const hw = pixelW / 2
        if (imL) ctx.drawImage(imL, 0, 0, hw, pixelH, 0, 0, hw, pixelH)
        if (imR) ctx.drawImage(imR, 0, 0, hw, pixelH, hw, 0, hw, pixelH)
        const tex = new THREE.CanvasTexture(canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        tex.anisotropy = 8
        resolve(tex)
      })
      .catch(reject)
  })
}
