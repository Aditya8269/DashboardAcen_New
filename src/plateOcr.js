// Number plate reading for photos where the plate is a small, possibly tilted part of a larger scene
// (for example a whole car). Tesseract is built for pages of straight text and cannot read a plate that is
// tilted or leaning, so it is given a clean line to read:
//
//   1. Locate by shape: find lines of character-like blobs at any tilt (plateGeometry.findTextLines). This does
//      not depend on OCR seeing anything, so it works on photos the engine cannot read as they are.
//   2. Straighten: measure the tilt and lean from the pixels of those characters alone and undo them, so
//      stripes, edges and glare around the plate cannot skew the estimate. Crop tightly around the text.
//   3. Read the crop as a single line, allowing only A-Z and 0-9, with several contrast treatments and crop
//      widths, then combine the readings by voting character by character.
//   4. Candidates are ranked by what they read as (mixed letters and digits, plate length), so badges and model
//      names found in step 1 lose to the plate. If shape finds nothing usable, whole-image OCR is the fallback.
//
// The text is returned as read, except that lookalike characters are settled by the plate layout when the reading
// fits a known one (plateFormats.js). The unchanged reading is always returned as `raw`.
// The browser objects are injected (`recognize`, `createCanvas`) so the pipeline can also run under test.

import { correctPlate } from './plateFormats.js'
import {
  adaptiveInk,
  estimateLeanFromMoments,
  estimateShear,
  estimateSkew,
  findTextLines,
  inkPoints,
  locatePlate,
  plateTextScore,
  rotatePoints,
  straightenTransform,
  toGray,
} from './plateGeometry.js'

const WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
// Long side, in pixels, of the downscaled frames used to find character lines. Two sizes so both a small
// plate in a big scene and a plate filling the frame have characters of a findable size.
const LOCATE_SIDES = [2000, 900]
const LOCATE_RADIUS = 14
const MAX_CANDIDATES = 4
// Characters are scaled to about this height before reading, which suits Tesseract
const TARGET_CHAR_PX = 70
const MAX_SIDE = 3000
const FRAME_LONG_SIDE = 3200
// Horizontal padding around the located characters, as multiples of character height. The wide crop picks up
// characters the locator missed at the ends of the line.
const PADS_X = [0.6, 2]
const PAD_Y = 0.4
const VARIANTS = ['gray', 'ink', 'inverted']
// Readings shorter than this are noise from an empty or wrong crop, not a plate
const MIN_CHARS = 4
// A candidate reading at least this plate-like, confirmed by two identical readings, ends the search
const GOOD_SCORE = 40

const cleanText = (text) => text.toUpperCase().replace(/[^A-Z0-9]/g, '')

// Combines several readings of the same plate. Readings of the most common length vote on each character
// position, weighted by the engine's own confidence, so a character that one pass got wrong is outvoted by the
// others. The returned confidence is how much the readings agree, not the engine's score: with a character
// whitelist on, Tesseract reports near-zero confidence even for correct text, but independent readings (different
// contrast treatments and crop widths) agreeing character for character is a good sign. A lone reading has
// nothing to agree with and is capped at 0.5.
export function voteCharacters(readings) {
  const weightByLength = new Map()
  readings.forEach((r) => weightByLength.set(r.value.length, (weightByLength.get(r.value.length) || 0) + 0.1 + r.confidence))
  const length = [...weightByLength.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const same = readings.filter((r) => r.value.length === length)
  let value = ''
  let agreement = 0
  for (let i = 0; i < length; i++) {
    const votes = new Map()
    let total = 0
    same.forEach((r) => {
      const weight = 0.1 + r.confidence
      votes.set(r.value[i], (votes.get(r.value[i]) || 0) + weight)
      total += weight
    })
    const [char, weight] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]
    value += char
    agreement += weight / total
  }
  const consensus = (agreement / length) * (same.length / readings.length)
  return { value, confidence: same.length === 1 ? Math.min(0.5, consensus) : consensus, readings: same.length }
}

const abortError = () => new DOMException('Aborted', 'AbortError')

function drawRegion(bitmap, region, scale, createCanvas) {
  const canvas = createCanvas(Math.max(1, Math.round(region.w * scale)), Math.max(1, Math.round(region.h * scale)))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, region.x, region.y, region.w, region.h, 0, 0, canvas.width, canvas.height)
  return canvas
}

function readGray(canvas) {
  const { width, height } = canvas
  const gray = toGray(canvas.getContext('2d').getImageData(0, 0, width, height).data, width * height)
  return { gray, width, height }
}

function writeGray(gray, width, height, createCanvas) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(width, height)
  for (let i = 0, j = 0; j < gray.length; i += 4, j++) {
    img.data[i] = img.data[i + 1] = img.data[i + 2] = gray[j]
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

function cropCanvas(src, x0, y0, x1, y1, createCanvas) {
  const x = Math.max(0, Math.floor(x0))
  const y = Math.max(0, Math.floor(y0))
  const w = Math.max(1, Math.min(src.width, Math.ceil(x1)) - x)
  const h = Math.max(1, Math.min(src.height, Math.ceil(y1)) - y)
  const canvas = createCanvas(w, h)
  canvas.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h)
  return canvas
}

function clampRegion(x0, y0, x1, y1, bitmap) {
  const x = Math.max(0, Math.floor(x0))
  const y = Math.max(0, Math.floor(y0))
  return { x, y, w: Math.max(1, Math.min(bitmap.width, Math.ceil(x1)) - x), h: Math.max(1, Math.min(bitmap.height, Math.ceil(y1)) - y) }
}

const overlap = (a, b) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  if (w <= 0 || h <= 0) return 0
  const inter = w * h
  return inter / ((a.x1 - a.x0) * (a.y1 - a.y0) + (b.x1 - b.x0) * (b.y1 - b.y0) - inter)
}

// Candidate plate lines found from the shapes of the characters, best first, in original image coordinates.
// Dark text on a light plate and light text on a dark plate are both tried.
function locateByShape(bitmap, createCanvas) {
  const longSide = Math.max(bitmap.width, bitmap.height)
  const whole = { x: 0, y: 0, w: bitmap.width, h: bitmap.height }
  const found = []
  for (const side of new Set(LOCATE_SIDES.map((s) => Math.min(s, longSide)))) {
    const scale = side / longSide
    const { gray, width, height } = readGray(drawRegion(bitmap, whole, scale, createCanvas))
    const inverted = gray.map((v) => 255 - v)
    for (const [polarity, g] of [['dark text', gray], ['light text', inverted]]) {
      const ink = adaptiveInk(g, width, height, { radius: LOCATE_RADIUS, ratio: 0.88 })
      for (const line of findTextLines(ink, width, height)) {
        found.push({
          score: line.score,
          polarity,
          angle: line.angle,
          count: line.count,
          charH: line.charHeight / scale,
          box: { x0: line.x0 / scale, y0: line.y0 / scale, x1: (line.x1 + 1) / scale, y1: (line.y1 + 1) / scale },
          cx: line.cx / scale,
          cy: line.cy / scale,
          // Distance between neighbouring character pixels, in original image pixels
          spacing: 1 / scale,
          moments: line.moments,
          xs: line.xs.map((v) => v / scale),
          ys: line.ys.map((v) => v / scale),
        })
      }
    }
  }
  found.sort((a, b) => b.score - a.score)
  const kept = []
  found.forEach((c) => {
    if (kept.every((k) => overlap(k.box, c.box) < 0.4)) kept.push(c)
  })
  return kept
}

// Rotates and unshears the region so the text is level and upright. When the candidate carries the pixels of
// its characters, the angles come from those alone and the output is cropped around them.
function straighten(base, region, scale, cand, createCanvas) {
  const bw = base.width
  const bh = base.height
  let points = null
  let skew
  let shear
  if (cand.xs) {
    points = {
      xs: Float32Array.from(cand.xs, (v) => (cand.cx + v - region.x) * scale - bw / 2),
      ys: Float32Array.from(cand.ys, (v) => (cand.cy + v - region.y) * scale - bh / 2),
    }
    skew = estimateSkew(points, bw, bh, { center: cand.angle, range: 8, bin: Math.max(1, cand.spacing * scale) })
    shear = estimateLeanFromMoments(cand.moments, skew)
  } else {
    // No character pixels known (text found by OCR): estimate from all the ink in the region
    const { gray } = readGray(base)
    const all = inkPoints(adaptiveInk(gray, bw, bh), bw, bh)
    skew = estimateSkew(all, bw, bh)
    shear = estimateShear(rotatePoints(all, skew), bw, bh)
  }
  const m = straightenTransform(bw, bh, skew, shear)
  const out = createCanvas(m.width, m.height)
  const ctx = out.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, m.width, m.height)
  ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f)
  ctx.drawImage(base, -bw / 2, -bh / 2)
  ctx.setTransform(1, 0, 0, 1, 0, 0)

  let text = null
  if (points) {
    text = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
    for (let i = 0; i < points.xs.length; i++) {
      const x = m.a * points.xs[i] + m.c * points.ys[i] + m.e
      const y = m.b * points.xs[i] + m.d * points.ys[i] + m.f
      if (x < text.x0) text.x0 = x
      if (x > text.x1) text.x1 = x
      if (y < text.y0) text.y0 = y
      if (y > text.y1) text.y1 = y
    }
  }
  return { out, skew, shear, text }
}

// gray: as is. ink: adaptive threshold with dark text on white whatever the plate colours were.
// inverted: the grey image negated, for light text on dark plates. `textH` sizes the threshold window.
function variantCanvas(grayCanvas, kind, textH, createCanvas) {
  if (kind === 'gray') return grayCanvas
  const { gray, width, height } = readGray(grayCanvas)
  if (kind === 'inverted') return writeGray(gray.map((v) => 255 - v), width, height, createCanvas)
  const ink = adaptiveInk(gray, width, height, { radius: Math.max(10, Math.round(textH * 0.6)) })
  let inked = 0
  for (let i = 0; i < ink.length; i++) inked += ink[i]
  const textIsInk = inked <= ink.length / 2
  return writeGray(Uint8Array.from(ink, (v) => ((v === 1) === textIsInk ? 0 : 255)), width, height, createCanvas)
}

const meanConfidence = (words, fallback) => {
  const confs = words.filter((w) => w.text.trim()).map((w) => w.confidence)
  return confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : fallback
}

// Straightens one candidate and reads it with every crop width and contrast treatment.
async function readCandidate(cand, { bitmap, recognize, createCanvas, check, log }) {
  const padPx = cand.charH * 1.5
  const region = clampRegion(cand.box.x0 - padPx, cand.box.y0 - padPx, cand.box.x1 + padPx, cand.box.y1 + padPx, bitmap)
  const scale = Math.min(8, Math.max(0.5, TARGET_CHAR_PX / cand.charH), MAX_SIDE / Math.max(region.w, region.h))
  const base = drawRegion(bitmap, region, scale, createCanvas)
  const { out, skew, shear, text } = straighten(base, region, scale, cand, createCanvas)
  log.push(`    straightened: tilt ${skew.toFixed(1)} (found ${cand.angle == null ? 'by estimate' : `${cand.angle.toFixed(1)} from the characters`}), lean ${shear.toFixed(1)}`)

  const readings = []
  const textH = text ? text.y1 - text.y0 : out.height * 0.4
  const pads = text ? PADS_X : [0]
  for (const pad of pads) {
    const crop = text
      ? cropCanvas(out, text.x0 - pad * textH, text.y0 - PAD_Y * textH, text.x1 + pad * textH, text.y1 + PAD_Y * textH, createCanvas)
      : out
    const flat = readGray(crop)
    const grayCanvas = writeGray(flat.gray, flat.width, flat.height, createCanvas)
    for (const kind of VARIANTS) {
      check()
      const r = await recognize(variantCanvas(grayCanvas, kind, textH, createCanvas), { psm: '7', whitelist: WHITELIST })
      const value = cleanText(r.text)
      log.push(`    crop ${pad}, ${kind}: ${value || '(nothing)'}`)
      if (value.length >= MIN_CHARS) readings.push({ value, confidence: meanConfidence(r.words, r.confidence) / 100 })
    }
    // Stop widening once two independent readings agree on something that reads like a plate
    if (readings.some((a) => plateTextScore(a.value) >= GOOD_SCORE && readings.filter((b) => b.value === a.value).length >= 2)) break
  }
  return { readings, skew, shear }
}

export async function readPlate({ bitmap, recognize, createCanvas, signal, onProgress }) {
  const log = []
  const check = () => {
    if (signal?.aborted) throw abortError()
  }
  const ctx = { bitmap, recognize, createCanvas, check, log }
  let best = null

  // Reads one candidate. Resolves true when the result is good enough to stop searching.
  const attempt = async (cand, label) => {
    check()
    onProgress?.({ status: 'reading', progress: 0, attempt: label })
    log.push(`[${label}]`)
    const { readings, skew, shear } = await readCandidate(cand, ctx)
    if (!readings.length) {
      log.push('  nothing readable')
      return false
    }
    const voted = voteCharacters(readings)
    const score = plateTextScore(voted.value)
    const agree = readings.filter((r) => r.value === voted.value).length
    log.push(`  => ${voted.value} (plate-likeness ${score}, ${agree} of ${readings.length} readings identical, tilt ${skew.toFixed(1)}, lean ${shear.toFixed(1)})`)
    if (!best || score > best.score || (score === best.score && voted.confidence > best.confidence)) {
      best = { value: voted.value, confidence: voted.confidence, score, agree, label }
    }
    return score >= GOOD_SCORE && agree >= 2
  }

  // 1. Locate by the shape of the characters, then read the most promising candidates
  onProgress?.({ status: 'locating', progress: 0 })
  const shapes = locateByShape(bitmap, createCanvas).slice(0, MAX_CANDIDATES)
  log.push(shapes.length
    ? `[located by shape]\n${shapes.map((s, i) => `  ${i + 1}. ${s.polarity}, ${s.count} characters, tilt ${s.angle.toFixed(1)}, at ${Math.round(s.cx)},${Math.round(s.cy)}`).join('\n')}`
    : '[located by shape] no lines of character-like shapes found')
  for (let i = 0; i < shapes.length; i++) {
    if (await attempt(shapes[i], `candidate ${i + 1} (${shapes[i].polarity})`)) break
  }

  // 2. Fallback: let whole-image OCR find text fragments, then read the region they sit in
  if (!best || best.score < GOOD_SCORE) {
    onProgress?.({ status: 'locating', progress: 0 })
    const longSide = Math.max(bitmap.width, bitmap.height)
    const scale = Math.min(2, FRAME_LONG_SIDE / longSide)
    const frame = drawRegion(bitmap, { x: 0, y: 0, w: bitmap.width, h: bitmap.height }, scale, createCanvas)
    const first = await recognize(frame, { psm: '11' })
    check()
    log.push(`[whole image OCR]\n${first.text.trim() || '(nothing)'}`)
    const found = locatePlate(first.words, frame.height)
    if (found) {
      const cand = {
        charH: found.charHeight / scale,
        box: { x0: found.x0 / scale, y0: found.y0 / scale, x1: found.x1 / scale, y1: found.y1 / scale },
      }
      await attempt(cand, 'text found by whole-image OCR')
    }
  }

  if (!best) return { value: '', raw: '', changes: [], format: null, confidence: null, attempt: 'none', log: log.join('\n') }

  // Lookalike characters (O/0, I/1, ...) are settled by the plate layout. `raw` is always kept as read.
  const fixed = correctPlate(best.value)
  log.push(fixed.changes.length
    ? `[layout] ${fixed.format}: ${fixed.changes.map((c) => `${c.from} -> ${c.to} at position ${c.index + 1}`).join(', ')}`
    : `[layout] ${fixed.format ? `fits ${fixed.format}, no change needed` : 'fits no known layout, left as read'}`)
  log.push(`[result] ${fixed.value}${fixed.changes.length ? ` (read as ${best.value})` : ''}`)
  return {
    value: fixed.value,
    raw: best.value,
    changes: fixed.changes,
    format: fixed.format,
    confidence: best.confidence,
    attempt: `${best.label}, ${best.agree} identical readings`,
    log: log.join('\n'),
  }
}
