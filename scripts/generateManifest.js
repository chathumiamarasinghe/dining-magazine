import { readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const slidesDir = join(__dirname, '..', 'public', 'slides')

mkdirSync(slidesDir, { recursive: true })

const files = readdirSync(slidesDir)
  .filter((f) => f.match(/\.(png|jpg|jpeg)$/i))
  .sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || 0, 10)
    const numB = parseInt(b.match(/\d+/)?.[0] || 0, 10)
    return numA - numB
  })

const outPath = join(slidesDir, 'manifest.json')
writeFileSync(outPath, JSON.stringify({ pages: files }, null, 2))
console.log(`Manifest generated: ${files.length} pages`)
