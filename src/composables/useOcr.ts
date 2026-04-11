import { ref } from 'vue'
import { createWorker } from 'tesseract.js'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp']

/**
 * Browser-side OCR composable.
 * Recognises numbers from an image file and returns the most likely numeric value.
 */
export function useOcr() {
  const isRecognizing = ref(false)
  const ocrError = ref<string | null>(null)

  /**
   * Extract a numeric value from an image file using Tesseract OCR.
   * Returns the largest numeric value found, or null if none recognised.
   */
  async function recognizeNumber(file: File): Promise<number | null> {
    if (!ALLOWED_TYPES.includes(file.type)) {
      ocrError.value = 'Unsupported file type. Use PNG, JPEG, WebP, GIF, or BMP.'
      return null
    }
    if (file.size > MAX_SIZE_BYTES) {
      ocrError.value = 'Image exceeds 10 MB limit.'
      return null
    }

    isRecognizing.value = true
    ocrError.value = null

    const worker = await createWorker('eng', 1, {
      logger: () => {}, // suppress progress logs
    })
    const imageUrl = URL.createObjectURL(file)

    try {
      // Configure for numeric-heavy recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,% ',
      })

      const { data } = await worker.recognize(imageUrl)
      const text = data.text.trim()

      // Extract all numbers (including decimals and comma-decimals like "1.234,56")
      const matches = text.match(/\d[\d.,]*/g)
      if (!matches || matches.length === 0) return null

      // Parse each match: normalise European notation (1.234,56 → 1234.56)
      const values = matches
        .map((m) => {
          const normalised = m.replace(/\.(?=\d{3})/g, '').replace(',', '.')
          return parseFloat(normalised)
        })
        .filter((n) => !isNaN(n) && n >= 0)

      if (values.length === 0) return null

      // Return the largest value — most screenshots show a headline metric prominently
      return Math.max(...values)
    } catch {
      ocrError.value = 'Could not read the image. Try a clearer screenshot.'
      return null
    } finally {
      URL.revokeObjectURL(imageUrl)
      await worker.terminate()
      isRecognizing.value = false
    }
  }

  return { isRecognizing, ocrError, recognizeNumber }
}
