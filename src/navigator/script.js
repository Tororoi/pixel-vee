/**
 * Creates a new, empty navigator script object. The script carries canvas
 * dimensions so playback can validate or adapt to different canvas sizes at
 * load time. Passing null dimensions is intentional for scripts recorded
 * before canvas size was tracked.
 * @param {string} name - Human-readable label for the script.
 * @param {number|null} canvasWidth - Width of the canvas at record time.
 * @param {number|null} canvasHeight - Height of the canvas at record time.
 * @returns {{ version: string, name: string, canvasWidth: number|null,
 *   canvasHeight: number|null, actions: Array }} Blank script ready for
 *   recording.
 */
export function createScript(
  name = 'untitled',
  canvasWidth = null,
  canvasHeight = null,
) {
  return { version: '1.0', name, canvasWidth, canvasHeight, actions: [] }
}

/**
 * Parses and validates a navigator script from raw JSON or an already-parsed
 * object. Accepting both forms lets callers skip a redundant parse step when
 * the value is already an object (e.g. loaded via fetch's .json()). The
 * version and actions checks are the minimal contract; they catch truncated
 * files and plain JSON that happens to exist in the same directory.
 * @param {string|object} json - Raw JSON string or pre-parsed script object.
 * @returns {{ version: string, name: string, actions: Array }} Validated
 *   script object.
 * @throws {Error} If the script is missing required fields.
 */
export function loadScript(json) {
  // Avoid double-parsing when the caller already holds a parsed object.
  const script = typeof json === 'string' ? JSON.parse(json) : json
  if (!script.version || !Array.isArray(script.actions)) {
    throw new Error('Invalid navigator script format')
  }
  return script
}

/**
 * Serialises a script to JSON and triggers a browser download. The object URL
 * is revoked immediately after the click because the browser queues the
 * download synchronously — revoking beforehand would cancel it, but revoking
 * after the click (still in the same call stack) is safe and prevents the URL
 * from leaking in memory. The .nav.json suffix distinguishes these files from
 * generic JSON in the file picker.
 * @param {{ name: string, [key: string]: * }} script - Script to serialise.
 * @returns {void}
 */
export function saveScript(script) {
  const json = JSON.stringify(script, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${script.name}.nav.json`
  // Click is synchronous; the download is queued before this line returns.
  a.click()
  URL.revokeObjectURL(url)
}
