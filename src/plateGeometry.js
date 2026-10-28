// Pure image geometry for number plate reading. Works on plain arrays so it can run (and be tested)
// anywhere. Coordinates are image coordinates: x to the right, y downward, angles in degrees.

const RAD = Math.PI / 180

export function toGray(rgba, pixelCount) {
  const gray = new Uint8Array(pixelCount)
  for (let i = 0, j = 0; j < pixelCount; i += 4, j++) gray[j] = rgba[i] * 0.299 + rgba[i + 1] * 0.587 + rgba[i + 2] * 0.114
  return gray
}

// Local (Bradley) adaptive threshold. A pixel is "ink" when it is clearly darker than the average of its
// neighbourhood, so shadows, glare gradients and coloured backgrounds do not wash out the text the way one
// global threshold would. The window must be several times wider than a stroke. Uses an integral image,
// so the cost is linear in the number of pixels. Returns 1 for ink, 0 for background.
export function adaptiveInk(gray, w, h, { radius = Math.max(8, Math.round(Math.min(w, h) / 8)), ratio = 0.85 } = {}) {
  const stride = w + 1
  const integral = new Float64Array(stride * (h + 1))
  for (let y = 0; y < h; y++) {
    let row = 0
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x]
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row
    }
  }
  const ink = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius)
    const y1 = Math.min(h - 1, y + radius)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius)
      const x1 = Math.min(w - 1, x + radius)
      const count = (x1 - x0 + 1) * (y1 - y0 + 1)
      const sum = integral[(y1 + 1) * stride + x1 + 1] - integral[y0 * stride + x1 + 1] - integral[(y1 + 1) * stride + x0] + integral[y0 * stride + x0]
      if (gray[y * w + x] * count < sum * ratio) ink[y * w + x] = 1
    }
  }
  return ink
}

// Ink pixels as centred coordinates, thinned to at most `limit` points. If most of the image is "ink"
// the plate is light text on a dark background, so the minority (the text) is used instead.
export function inkPoints(ink, w, h, limit = 50000) {
  let count = 0
  for (let i = 0; i < ink.length; i++) count += ink[i]
  const flip = count > ink.length / 2
  const total = flip ? ink.length - count : count
  const stride = Math.max(1, Math.ceil(total / limit))
  const xs = []
  const ys = []
  let seen = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((ink[y * w + x] === 1) !== flip && seen++ % stride === 0) {
        xs.push(x - w / 2)
        ys.push(y - h / 2)
      }
    }
  }
  return { xs: Float32Array.from(xs), ys: Float32Array.from(ys) }
}

// Rotating by -t makes a baseline that runs at angle t level: x' = x cos t + y sin t, y' = -x sin t + y cos t.
export function rotatePoints({ xs, ys }, deg) {
  const c = Math.cos(deg * RAD)
  const s = Math.sin(deg * RAD)
  const nx = new Float32Array(xs.length)
  const ny = new Float32Array(xs.length)
  for (let i = 0; i < xs.length; i++) {
    nx[i] = xs[i] * c + ys[i] * s
    ny[i] = -xs[i] * s + ys[i] * c
  }
  return { xs: nx, ys: ny }
}

// Finds the parameter (angle) that makes the points pile up into the fewest, sharpest rows or columns,
// i.e. maximises the sum of squared histogram counts. `project` maps (x, y, angle) to a bin coordinate.
function sharpestAngle(size, project, centre, range, step, refine) {
  const hist = new Int32Array(size * 2 + 3)
  const offset = size + 1
  const score = (deg) => {
    hist.fill(0)
    project(deg, hist, offset)
    let sum = 0
    for (let i = 0; i < hist.length; i++) sum += hist[i] * hist[i]
    // Tiny preference for the smaller correction when two angles tie
    return sum * (1 - 1e-5 * Math.abs(deg))
  }
  let best = centre
  let bestScore = -1
  for (let deg = centre - range; deg <= centre + range + 1e-9; deg += step) {
    const sc = score(deg)
    if (sc > bestScore) { bestScore = sc; best = deg }
  }
  const coarse = best
  for (let deg = coarse - step; deg <= coarse + step + 1e-9; deg += refine) {
    const sc = score(deg)
    if (sc > bestScore) { bestScore = sc; best = deg }
  }
  return best
}

// Angle (degrees, clockwise-positive in image coordinates) at which the text baseline runs. The search covers
// `center` plus or minus `range`, so a caller that already has a rough angle can narrow it.
// `bin` is the histogram bin width in the points' units. Points that sit on a coarse pixel lattice (an image that
// was scaled up) must use a bin at least as wide as the lattice spacing, otherwise they line up in rows at 0 and 90
// degrees and the estimate snaps there.
export function estimateSkew({ xs, ys }, w, h, { center = 0, range = 30, step = 1, refine = 0.25, bin = 1 } = {}) {
  if (xs.length < 20) return center
  return sharpestAngle(Math.ceil((w + h) / bin), (deg, hist, off) => {
    const c = Math.cos(deg * RAD)
    const s = Math.sin(deg * RAD)
    for (let i = 0; i < xs.length; i++) hist[Math.round((ys[i] * c - xs[i] * s) / bin) + off]++
  }, center, range, step, refine)
}

// Lean of the vertical strokes, as the angle k where x grows by tan(k) per unit of y. Characters photographed
// from the side lean like this even after the baseline is level. Call on points that are already deskewed.
export function estimateShear({ xs, ys }, w, h, { center = 0, range = 25, step = 1, refine = 0.25 } = {}) {
  if (xs.length < 20) return center
  return sharpestAngle(w + h, (deg, hist, off) => {
    const k = Math.tan(deg * RAD)
    for (let i = 0; i < xs.length; i++) hist[Math.round(xs[i] - ys[i] * k) + off]++
  }, center, range, step, refine)
}

// Lean of the characters from the second moments of each character blob (see findTextLines). A shear x += k*y adds
// k*var(y) to cov(x, y) of a glyph that was symmetric to begin with, so cov/var(y) is tan(lean). Taking the median
// over the characters shrugs off glyphs that are not symmetric (7, Z, N), which a pixel-histogram estimate does not.
// `skew` is the baseline tilt in degrees; the moments are rotated into the level frame first.
export function estimateLeanFromMoments(moments, skew) {
  const t = skew * RAD
  const c = Math.cos(t)
  const s = Math.sin(t)
  const slopes = moments
    .filter((m) => m.n >= 20)
    .map((m) => {
      const vyy = s * s * m.vxx - 2 * c * s * m.vxy + c * c * m.vyy
      const cxy = -c * s * m.vxx + (c * c - s * s) * m.vxy + c * s * m.vyy
      return vyy > 1e-6 ? cxy / vyy : 0
    })
  if (!slopes.length) return 0
  return Math.max(-35, Math.min(35, Math.atan(median(slopes)) / RAD))
}

// Canvas matrix for "rotate by -skew, then unshear by `shear`", about the image centre, plus the output size and
// translation that keep the whole transformed image visible with `pad` pixels around it.
export function straightenTransform(w, h, skew, shear, pad = 28) {
  const t = skew * RAD
  const k = Math.tan(shear * RAD)
  const c0 = Math.cos(t)
  const s0 = Math.sin(t)
  const a = c0 + k * s0
  const b = -s0
  const c = s0 - k * c0
  const d = c0
  const xs = []
  const ys = []
  for (const sx of [-w / 2, w / 2]) {
    for (const sy of [-h / 2, h / 2]) {
      xs.push(a * sx + c * sy)
      ys.push(b * sx + d * sy)
    }
  }
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    a, b, c, d,
    e: -minX + pad,
    f: -minY + pad,
    width: Math.ceil(Math.max(...xs) - minX) + pad * 2,
    height: Math.ceil(Math.max(...ys) - minY) + pad * 2,
  }
}

// Connected blobs of ink (8-connected). `labels` holds 0 for background and 1..n for each blob; `stats[id]` is
// the blob's bounding box and pixel count.
export function labelComponents(ink, w, h) {
  const labels = new Int32Array(w * h)
  const stats = [null]
  const stack = new Int32Array(w * h)
  let n = 0
  for (let start = 0; start < ink.length; start++) {
    if (!ink[start] || labels[start]) continue
    n++
    let x0 = w
    let y0 = h
    let x1 = -1
    let y1 = -1
    let area = 0
    let top = 0
    stack[top++] = start
    labels[start] = n
    while (top) {
      const p = stack[--top]
      const px = p % w
      const py = (p - px) / w
      area++
      if (px < x0) x0 = px
      if (px > x1) x1 = px
      if (py < y0) y0 = py
      if (py > y1) y1 = py
      for (let ny = Math.max(0, py - 1); ny <= Math.min(h - 1, py + 1); ny++) {
        for (let nx = Math.max(0, px - 1); nx <= Math.min(w - 1, px + 1); nx++) {
          const q = ny * w + nx
          if (ink[q] && !labels[q]) { labels[q] = n; stack[top++] = q }
        }
      }
    }
    stats.push({ x0, y0, x1, y1, area })
  }
  return { labels, stats }
}

const median = (values) => values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)]

// Finds lines of character-like blobs at any tilt, without reading them. A character is a blob of plausible
// size and proportions; two characters are neighbours when they are about the same height, close together and
// level enough that they could sit on one baseline (up to 40 degrees of tilt). Connected neighbours form a
// line, and lines of a plausible length that are straight and even in height are returned best first, with the
// ink pixels of their characters (centred on the line's box) so tilt and lean can be measured from the text alone.
export function findTextLines(ink, w, h, { minChars = 4, maxCandidates = 6, maxPoints = 20000 } = {}) {
  const { labels, stats } = labelComponents(ink, w, h)

  let chars = []
  for (let id = 1; id < stats.length; id++) {
    const s = stats[id]
    const cw = s.x1 - s.x0 + 1
    const ch = s.y1 - s.y0 + 1
    // Up to 2.2x as wide as tall, so two bold characters that touch (common once the plate is tilted) still count
    if (ch < 8 || ch > h * 0.3 || cw < 2 || cw > ch * 2.2 || s.area / (cw * ch) < 0.15) continue
    chars.push({ id, cx: (s.x0 + s.x1) / 2, cy: (s.y0 + s.y1) / 2, h: ch, area: s.area })
  }
  if (chars.length > 4000) chars = chars.sort((a, b) => b.area - a.area).slice(0, 4000)
  chars.sort((a, b) => a.cx - b.cx)

  const maxH = chars.reduce((m, c) => Math.max(m, c.h), 0)
  const parent = chars.map((_, i) => i)
  const find = (i) => {
    while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i] }
    return i
  }
  for (let i = 0; i < chars.length; i++) {
    const a = chars[i]
    for (let j = i + 1; j < chars.length; j++) {
      const b = chars[j]
      const dx = b.cx - a.cx
      if (dx > 2 * maxH) break
      const tall = Math.max(a.h, b.h)
      if (Math.min(a.h, b.h) / tall < 0.6) continue
      const dy = b.cy - a.cy
      if (Math.hypot(dx, dy) > 2.4 * tall || Math.abs(Math.atan2(dy, dx)) > 40 * RAD) continue
      parent[find(i)] = find(j)
    }
  }

  const groups = new Map()
  chars.forEach((c, i) => {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root).push(c)
  })

  const lines = []
  for (const members of groups.values()) {
    const n = members.length
    if (n < minChars) continue
    // Plates are a handful of characters. Far longer lines are usually model names or slogans.
    const countScore = n >= 5 && n <= 12 ? 50 : n === 4 || n === 13 || n === 14 ? 20 : 0
    if (!countScore) continue

    const mx = members.reduce((s, m) => s + m.cx, 0) / n
    const my = members.reduce((s, m) => s + m.cy, 0) / n
    let sxx = 0
    let syy = 0
    let sxy = 0
    members.forEach((m) => {
      sxx += (m.cx - mx) ** 2
      syy += (m.cy - my) ** 2
      sxy += (m.cx - mx) * (m.cy - my)
    })
    const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy)
    const charH = median(members.map((m) => m.h))
    const offLine = Math.max(...members.map((m) => Math.abs(-(m.cx - mx) * Math.sin(angle) + (m.cy - my) * Math.cos(angle)))) / charH
    if (offLine > 0.7) continue
    const meanH = members.reduce((s, m) => s + m.h, 0) / n
    const spread = Math.sqrt(members.reduce((s, m) => s + (m.h - meanH) ** 2, 0) / n) / meanH

    const boxes = members.map((m) => stats[m.id])
    const x0 = Math.min(...boxes.map((b) => b.x0))
    const y0 = Math.min(...boxes.map((b) => b.y0))
    const x1 = Math.max(...boxes.map((b) => b.x1))
    const y1 = Math.max(...boxes.map((b) => b.y1))
    lines.push({
      score: countScore + 20 * Math.max(0, 1 - spread / 0.4) + 20 * Math.max(0, 1 - offLine / 0.7),
      count: n,
      angle: angle / RAD,
      charHeight: charH,
      x0, y0, x1, y1,
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
      ids: members.map((m) => m.id),
    })
  }
  lines.sort((a, b) => b.score - a.score)
  const best = lines.slice(0, maxCandidates)

  // One pass over the label image collects, for each kept line, the ink pixels of its characters and the second
  // moments of each character
  const owner = new Map()
  best.forEach((line, k) => {
    line.total = line.ids.reduce((s, id) => s + stats[id].area, 0)
    line.stride = Math.max(1, Math.ceil(line.total / maxPoints))
    line.seen = 0
    line.px = []
    line.py = []
    line.acc = line.ids.map(() => ({ n: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0 }))
    line.ids.forEach((id, m) => owner.set(id, { k, m }))
  })
  for (let p = 0; p < labels.length; p++) {
    if (!labels[p]) continue
    const slot = owner.get(labels[p])
    if (slot === undefined) continue
    const line = best[slot.k]
    const x = p % w
    const y = (p - x) / w
    const a = line.acc[slot.m]
    a.n++
    a.sx += x
    a.sy += y
    a.sxx += x * x
    a.syy += y * y
    a.sxy += x * y
    if (line.seen++ % line.stride === 0) {
      line.px.push(x - line.cx)
      line.py.push(y - line.cy)
    }
  }
  return best.map((line) => ({
    moments: line.acc.map((a) => ({
      n: a.n,
      vxx: a.sxx / a.n - (a.sx / a.n) ** 2,
      vyy: a.syy / a.n - (a.sy / a.n) ** 2,
      vxy: a.sxy / a.n - (a.sx / a.n) * (a.sy / a.n),
    })),
    score: line.score,
    count: line.count,
    angle: line.angle,
    charHeight: line.charHeight,
    x0: line.x0,
    y0: line.y0,
    x1: line.x1,
    y1: line.y1,
    cx: line.cx,
    cy: line.cy,
    xs: Float32Array.from(line.px),
    ys: Float32Array.from(line.py),
  }))
}

// How much a piece of text looks like (part of) a number plate. Plates mix letters and digits and are a handful of
// characters long, while badges and model names are usually letters only or much longer. This only ranks readings
// and picks the plate out of a busy scene. It does not check the text against any country's plate format.
export function plateTextScore(text) {
  const clean = text.replace(/\s/g, '')
  if (clean.length < 4 || !/[A-Z]/.test(clean) || !/\d/.test(clean)) return 0
  const longestDigitRun = Math.max(...clean.match(/\d+/g).map((d) => d.length))
  return 10 + (clean.length >= 5 && clean.length <= 12 ? 30 : 0) + Math.min(longestDigitRun, 4) * 5
}

// Looks through full-frame OCR words for the cluster of nearby, similarly sized fragments that best reads
// like a plate ("KA01", "AB", "1234" ...). Returns its bounding box and text, or null.
export function locatePlate(words, imgH) {
  const items = []
  for (const w of words) {
    const text = (w.text || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    const b = w.bbox
    if (!text || !b) continue
    const h = b.y1 - b.y0
    if (w.confidence < 15 || h < imgH * 0.008 || h > imgH * 0.4) continue
    items.push({ text, b, h, cy: (b.y0 + b.y1) / 2, confidence: w.confidence })
  }

  const parent = items.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const A = items[i]
      const B = items[j]
      const ratio = A.h / B.h
      if (ratio < 0.5 || ratio > 2) continue
      const H = Math.max(A.h, B.h)
      const dx = Math.max(0, Math.max(A.b.x0, B.b.x0) - Math.min(A.b.x1, B.b.x1))
      const dy = Math.max(0, Math.max(A.b.y0, B.b.y0) - Math.min(A.b.y1, B.b.y1))
      if (dx <= 1.5 * H && dy <= 0.8 * H) parent[find(i)] = find(j)
    }
  }

  const clusters = new Map()
  items.forEach((it, i) => {
    const root = find(i)
    if (!clusters.has(root)) clusters.set(root, [])
    clusters.get(root).push(it)
  })

  let best = null
  for (const members of clusters.values()) {
    const heights = members.map((m) => m.h).sort((x, y) => x - y)
    const medianH = heights[Math.floor(heights.length / 2)]
    const cys = members.map((m) => m.cy)
    const oneRow = Math.max(...cys) - Math.min(...cys) < medianH
    const ordered = members.slice().sort((p, q) => {
      if (!oneRow) {
        const rowP = Math.round(p.cy / (medianH * 0.6))
        const rowQ = Math.round(q.cy / (medianH * 0.6))
        if (rowP !== rowQ) return rowP - rowQ
      }
      return p.b.x0 - q.b.x0
    })
    const text = ordered.map((m) => m.text).join(' ')
    const score = plateTextScore(text)
    if (score < 30 || (best && score <= best.score)) continue
    best = {
      score,
      text,
      x0: Math.min(...members.map((m) => m.b.x0)),
      y0: Math.min(...members.map((m) => m.b.y0)),
      x1: Math.max(...members.map((m) => m.b.x1)),
      y1: Math.max(...members.map((m) => m.b.y1)),
      charHeight: medianH,
      confidence: members.reduce((sum, m) => sum + m.confidence, 0) / members.length,
    }
  }
  return best
}
