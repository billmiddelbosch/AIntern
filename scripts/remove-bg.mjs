import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(__dirname, '../AItern-beeldmerk.jpeg')
const outDir = join(__dirname, '../src/assets/brand')

mkdirSync(outDir, { recursive: true })

// ── 1. Load image metadata ────────────────────────────────────────────────────
const image = sharp(src)
const { width, height } = await image.metadata()
console.log(`Source: ${width}×${height}px`)

// ── 2. Get raw RGBA pixels ────────────────────────────────────────────────────
const { data, info } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const pixels = Buffer.from(data)
const threshold = 240   // RGB threshold for "white enough"
const feather   = 15    // tolerance band for semi-transparent edge pixels

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i]
  const g = pixels[i + 1]
  const b = pixels[i + 2]

  const brightness = Math.min(r, g, b)   // darkest channel — keeps coloured pixels
  const whiteness  = (r + g + b) / 3

  if (whiteness >= threshold && brightness >= threshold - 10) {
    // Fully transparent in the hard zone
    pixels[i + 3] = 0
  } else if (whiteness >= threshold - feather) {
    // Semi-transparent in the feather zone for smooth edges
    const alpha = Math.round(((threshold - whiteness) / feather) * 255)
    pixels[i + 3] = Math.max(0, Math.min(255, alpha))
  }
  // else: keep pixel fully opaque
}

const transparentBuffer = await sharp(pixels, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png({ compressionLevel: 9, palette: false }).toBuffer()

// ── 3. Export variants ────────────────────────────────────────────────────────
const variants = [
  { name: 'mascot-full.png',   size: 512, desc: 'Hero / large use' },
  { name: 'mascot-nav.png',    size: 48,  desc: 'Navbar logo'      },
  { name: 'mascot-thumb.png',  size: 96,  desc: 'Favicon / small'  },
  { name: 'mascot-card.png',   size: 192, desc: 'Card / section'   },
]

for (const v of variants) {
  const outPath = join(outDir, v.name)
  await sharp(transparentBuffer)
    .resize(v.size, v.size, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outPath)

  const kb = Math.round(readFileSync(outPath).length / 1024)
  console.log(`✓ ${v.name.padEnd(22)} ${String(v.size + 'px').padEnd(7)} ${kb} KB   — ${v.desc}`)
}

console.log('\nAll files written to src/assets/brand/')
