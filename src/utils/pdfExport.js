import { jsPDF } from 'jspdf'
import { GAME_PAGE_TOKEN } from '../constants/pageTokens'

/**
 * @param {{ pages: string[]; onProgress?: (i: number, n: number) => void }} opts
 * @returns {Promise<void>}
 */
export async function exportMagazinePdf({ pages, onProgress }) {
  const imagePages = pages.filter((name) => name !== GAME_PAGE_TOKEN)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,
  })

  const w = 210
  const h = 297

  for (let i = 0; i < imagePages.length; i += 1) {
    const src = `/slides/${imagePages[i]}`
    onProgress?.(i + 1, imagePages.length)
    await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          if (i > 0) pdf.addPage()
          const lower = imagePages[i].toLowerCase()
          const fmt = lower.endsWith('.png') ? 'PNG' : 'JPEG'
          pdf.addImage(img, fmt, 0, 0, w, h, undefined, 'NONE')
          resolve()
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => reject(new Error(`Failed to load ${src}`))
      img.src = src
    })
  }

  pdf.save('dining-etiquette-magazine.pdf')
}
