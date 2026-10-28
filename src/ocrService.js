// In-browser number plate OCR for the Compliance page.
//
// Everything runs on the user's device: Tesseract (WebAssembly) reads the image and plateOcr.js finds and
// straightens the plate first. No image is uploaded anywhere. On first use the browser downloads the
// Tesseract worker, its WASM core and the English language data (about 5 MB, cached afterwards).

import { createWorker } from 'tesseract.js'
import { readPlate } from './plateOcr.js'

export const LOW_CONFIDENCE = 0.8
export const MAX_FILE_SIZE_MB = 20
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

let workerPromise = null
let progressListener = null

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: (m) => progressListener?.({ status: m.status, progress: m.progress }),
    }).catch((err) => {
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

// Start downloading the OCR engine early so the first scan is quick.
export function warmUpOcr() {
  getWorker().catch(() => {})
}

const flattenWords = (blocks) =>
  (blocks || []).flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words.map((w) => ({ text: w.text, confidence: w.confidence, bbox: w.bbox })))))

const createCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height })

// One scan at a time: the worker is shared, so progress events can be attributed to the running scan.
let queue = Promise.resolve()

// Reads the number plate in an image. Resolves to { value, confidence (0-1 or null), attempt, log }.
// `value` is an empty string when no plate text could be read.
export function scanNumberPlate(file, { signal, onProgress } = {}) {
  const run = async () => {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    progressListener = onProgress
    onProgress?.({ status: 'preparing image', progress: 0 })
    const bitmap = await createImageBitmap(file)
    try {
      const worker = await getWorker()
      // The whitelist is reset on every call so one pass's restriction cannot leak into the next
      const recognize = async (canvas, { psm, whitelist = '' }) => {
        await worker.setParameters({ tessedit_pageseg_mode: psm, tessedit_char_whitelist: whitelist })
        const { data } = await worker.recognize(canvas, {}, { blocks: true })
        return { text: data.text || '', words: flattenWords(data.blocks), confidence: data.confidence }
      }
      return await readPlate({ bitmap, recognize, createCanvas, signal, onProgress })
    } finally {
      progressListener = null
      bitmap.close()
    }
  }
  const result = queue.then(run, run)
  queue = result.catch(() => {})
  return result
}
