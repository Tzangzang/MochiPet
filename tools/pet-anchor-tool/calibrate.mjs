import sharp from "sharp"
import { readdirSync } from "node:fs"
import { join } from "node:path"

const DIR = "public/pets/catalog"
const SIZE = 256

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function components(mask, w, h, minArea) {
  const seen = new Uint8Array(w * h)
  const out = []
  const stack = []
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || seen[i]) continue
    stack.length = 0
    stack.push(i)
    seen[i] = 1
    let area = 0
    let sx = 0
    let sy = 0
    let minX = w
    let maxX = 0
    let minY = h
    let maxY = 0
    while (stack.length) {
      const p = stack.pop()
      const x = p % w
      const y = (p - x) / w
      area++
      sx += x
      sy += y
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      const nb = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]
      for (const q of nb) {
        if (q >= 0 && mask[q] && !seen[q]) {
          seen[q] = 1
          stack.push(q)
        }
      }
    }
    if (area >= minArea) {
      out.push({ area, cx: sx / area, cy: sy / area, minX, maxX, minY, maxY })
    }
  }
  return out
}

async function analyze(file) {
  const { data } = await sharp(join(DIR, file))
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const w = SIZE
  const h = SIZE
  const alpha = new Uint8Array(w * h)
  const dark = new Uint8Array(w * h)
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  let sumX = 0
  let sumY = 0
  let count = 0

  for (let i = 0; i < w * h; i++) {
    const a = data[i * 4 + 3]
    if (a < 128) continue
    alpha[i] = 1
    const x = i % w
    const y = (i - x) / w
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    sumX += x
    sumY += y
    count++
    if (luminance(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) < 95) dark[i] = 1
  }

  const bw = maxX - minX
  const bh = maxY - minY
  const bodyCx = sumX / count
  const bodyCy = sumY / count

  const eyeBand = new Uint8Array(w * h)
  const bandTop = minY + bh * 0.22
  const bandBottom = minY + bh * 0.72
  for (let i = 0; i < w * h; i++) {
    if (!dark[i]) continue
    const y = Math.floor(i / w)
    if (y >= bandTop && y <= bandBottom) eyeBand[i] = 1
  }

  const bboxArea = bw * bh
  const comps = components(eyeBand, w, h, Math.max(6, Math.round(bboxArea * 0.0012)))
  const cands = comps
    .map((c) => {
      const cw = c.maxX - c.minX + 1
      const ch = c.maxY - c.minY + 1
      return { ...c, cw, ch, fill: c.area / (cw * ch), ar: cw / ch }
    })
    .filter(
      (c) =>
        c.area <= bboxArea * 0.014 &&
        c.ar > 0.45 &&
        c.ar < 2.2 &&
        c.fill > 0.55 &&
        c.cw < bw * 0.2 &&
        c.ch < bh * 0.2,
    )

  let best = null
  for (let i = 0; i < cands.length; i++) {
    for (let j = i + 1; j < cands.length; j++) {
      const a = cands[i]
      const b = cands[j]
      const dy = Math.abs(a.cy - b.cy)
      const dx = Math.abs(a.cx - b.cx)
      if (dy > bh * 0.035) continue
      if (dx < bw * 0.1 || dx > bw * 0.34) continue
      const ratio = Math.min(a.area, b.area) / Math.max(a.area, b.area)
      if (ratio < 0.6) continue
      const circ = (a.fill + b.fill) / 2
      const score = (a.area + b.area) * ratio * circ - dy * 8
      if (!best || score > best.score) best = { a, b, score, dx, dy }
    }
  }

  const norm = (v) => Number((v / SIZE).toFixed(3))

  let face = null
  if (best) {
    const cx = (best.a.cx + best.b.cx) / 2
    const cy = (best.a.cy + best.b.cy) / 2
    const halfGap = best.dx / 2
    face = {
      x: norm(cx),
      y: norm(cy),
      width: Number((halfGap / SIZE / 0.24).toFixed(3)),
    }
  }

  const x0 = minX / SIZE
  const y0 = minY / SIZE
  const x1 = maxX / SIZE
  const y1 = maxY / SIZE
  const nbw = x1 - x0
  const nbh = y1 - y0

  let footSum = 0
  let footCount = 0
  const footTop = maxY - bh * 0.08
  for (let i = 0; i < w * h; i++) {
    if (!alpha[i]) continue
    const y = Math.floor(i / w)
    if (y < footTop) continue
    footSum += i % w
    footCount++
  }

  const r3 = (v) => Number(v.toFixed(3))

  return {
    code: file.replace(/\.webp$/, ""),
    bbox: { x0: norm(minX), y0: norm(minY), x1: norm(maxX), y1: norm(maxY) },
    centroid: { x: norm(bodyCx), y: norm(bodyCy) },
    face,
    seed: {
      head: { x: r3(x0 + nbw / 2), y: r3(y0 + nbh * 0.12) },
      belly: { x: norm(bodyCx), y: norm(bodyCy) },
      feet: { x: r3(footCount ? footSum / footCount / SIZE : x0 + nbw / 2), y: r3(y1 - 0.015) },
      eyeLine: r3(y0 + nbh * 0.4),
      centerX: r3(x0 + nbw / 2),
    },
  }
}

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".webp"))
  .sort()

const results = []
for (const f of files) {
  results.push(await analyze(f))
}
process.stdout.write(JSON.stringify(results, null, 1))
