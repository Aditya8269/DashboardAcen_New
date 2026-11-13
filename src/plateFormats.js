// Resolves lookalike characters in a plate reading (O/0, I/1, S/5, B/8, Z/2, G/6) from the plate layout.
//
// The OCR cannot tell these apart by shape in many plate fonts, but the layout can: if a slot must hold a digit
// and the engine read the letter O, it is a 0. The correction is conservative. The reading is left exactly as read
// when it fits no layout, when two different fixes are equally good, or when it would need more than MAX_CHANGES
// changes, so a plate in an unknown format passes through untouched and a correct reading is never altered.
//
// To support another country or series, add a layout to PLATE_FORMATS. A part is either
//   { kind: 'L' | 'D', min, max }   a run of letters or of digits, min to max characters long
//   { text: 'BH' }                  fixed characters

export const PLATE_FORMATS = [
  {
    // KA01AB1234, MH12DE1433, DL8CAF5030: state, district, series letters, number
    name: 'Indian standard',
    parts: [{ kind: 'L', min: 2, max: 2 }, { kind: 'D', min: 1, max: 2 }, { kind: 'L', min: 1, max: 3 }, { kind: 'D', min: 4, max: 4 }],
  },
  {
    // 22BH1234AA: year, BH, number, series letters
    name: 'Indian BH series',
    parts: [{ kind: 'D', min: 2, max: 2 }, { text: 'BH' }, { kind: 'D', min: 4, max: 4 }, { kind: 'L', min: 1, max: 2 }],
  },
]

// Letters that are really digits, and digits that are really letters, when the font makes them look alike
const LETTER_TO_DIGIT = { O: '0', Q: '0', D: '0', I: '1', L: '1', Z: '2', S: '5', G: '6', B: '8' }
const DIGIT_TO_LETTER = { 0: 'O', 1: 'I', 2: 'Z', 5: 'S', 6: 'G', 8: 'B' }
const MAX_CHANGES = 3

// Letters the OCR commonly mixes with one another (not involving digit swaps)
const LETTER_CONFUSION = {
  W: ['U', 'V'], U: ['W', 'V'], V: ['W', 'U'],
  B: ['D'],      D: ['B'],
  C: ['S'],      S: ['C'],
  E: ['F'],      F: ['E'],
  M: ['N'],      N: ['M'],
  X: ['Y'],      Y: ['X'],
}

// Valid two-letter Indian state/UT vehicle registration codes
const INDIAN_STATE_CODES = new Set([
  'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN',
  'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
  'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ',
  'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB',
])

// Attempts to correct the two-letter state code at `offset` in `text` using the letter confusion groups.
// Returns { value, changes } if a valid code is found by substitution, or null when no fix is needed or possible.
function fixStateCode(text, offset) {
  const c0 = text[offset]
  const c1 = text[offset + 1]
  if (INDIAN_STATE_CODES.has(c0 + c1)) return null

  const alts0 = [c0, ...(LETTER_CONFUSION[c0] || [])]
  const alts1 = [c1, ...(LETTER_CONFUSION[c1] || [])]

  let best = null
  let bestCost = Infinity

  for (const a0 of alts0) {
    for (const a1 of alts1) {
      if (a0 === c0 && a1 === c1) continue
      const cost = (a0 !== c0 ? 1 : 0) + (a1 !== c1 ? 1 : 0)
      if (cost < bestCost && INDIAN_STATE_CODES.has(a0 + a1)) {
        bestCost = cost
        best = { a0, a1 }
      }
    }
  }

  if (!best) return null
  const changes = []
  if (best.a0 !== c0) changes.push({ index: offset,     from: c0, to: best.a0 })
  if (best.a1 !== c1) changes.push({ index: offset + 1, from: c1, to: best.a1 })
  return {
    value: text.slice(0, offset) + best.a0 + best.a1 + text.slice(offset + 2),
    changes,
  }
}

const isDigit = (c) => c >= '0' && c <= '9'
const isLetter = (c) => c >= 'A' && c <= 'Z'

// Every way `text` can be laid out over `parts`, with the cost (characters changed) of each
function fits(parts, text) {
  const found = []
  const walk = (partIndex, pos, cost, chars, changes) => {
    if (cost > MAX_CHANGES) return
    if (partIndex === parts.length) {
      if (pos === text.length) found.push({ cost, value: chars.join(''), changes })
      return
    }
    const part = parts[partIndex]
    const lo = part.text ? part.text.length : part.min
    const hi = part.text ? part.text.length : part.max
    for (let n = lo; n <= hi && pos + n <= text.length; n++) {
      let segCost = 0
      let ok = true
      const seg = []
      const segChanges = []
      for (let i = 0; i < n && ok; i++) {
        const got = text[pos + i]
        const want = part.text ? part.text[i] : null
        const letterSlot = want ? isLetter(want) : part.kind === 'L'
        const right = want ? got === want : letterSlot ? isLetter(got) : isDigit(got)
        let fixed = got
        if (!right) {
          fixed = letterSlot ? DIGIT_TO_LETTER[got] : LETTER_TO_DIGIT[got]
          if (!fixed || (want && fixed !== want)) ok = false
          else {
            segCost++
            segChanges.push({ index: pos + i, from: got, to: fixed })
          }
        }
        seg.push(fixed)
      }
      if (ok) walk(partIndex + 1, pos + n, cost + segCost, chars.concat(seg), changes.concat(segChanges))
    }
  }
  walk(0, 0, 0, [], [])
  return found
}

// Returns { value, changes, format }. `changes` lists each character replaced ({ index, from, to}, index counted
// from 0) and `format` names the layout that decided it. With no change, `value` is `text` exactly as given.
export function correctPlate(text, formats = PLATE_FORMATS) {
  let best = null
  let tied = false
  for (const format of formats) {
    for (const fit of fits(format.parts, text)) {
      if (!best || fit.cost < best.cost) {
        best = { ...fit, format: format.name }
        tied = false
      } else if (fit.cost === best.cost && fit.value !== best.value) {
        tied = true
      }
    }
  }
  if (!best || tied) return { value: text, changes: [], format: best && best.cost === 0 ? best.format : null }
  const result = best.cost === 0
    ? { value: text, changes: [], format: best.format }
    : { value: best.value, changes: best.changes, format: best.format }

  // For Indian standard plates the first two characters are always a state code — a fixed vocabulary
  // that lets us resolve letter/letter confusions (W/U/V, B/D, C/S, E/F, M/N, X/Y) that the
  // digit/letter logic above cannot see.
  if (result.format === 'Indian standard' && result.value.length >= 2) {
    const stateFix = fixStateCode(result.value, 0)
    if (stateFix) {
      return {
        value: stateFix.value,
        changes: [...result.changes, ...stateFix.changes],
        format: result.format,
      }
    }
  }

  return result
}
