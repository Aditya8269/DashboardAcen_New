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
  if (!best || best.cost === 0 || tied) return { value: text, changes: [], format: best && best.cost === 0 ? best.format : null }
  return { value: best.value, changes: best.changes, format: best.format }
}
