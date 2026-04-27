import init, * as wasmExports from '../wasm/pkg/pixel_vee_wasm.js'

let wasm = null

/**
 * Initializes the WebAssembly module and caches the exports.
 * @returns {Promise<object>} Resolved wasm exports object.
 */
export async function initWasm() {
  if (wasm) return wasm
  await init()
  wasm = wasmExports
  return wasm
}

/**
 * Returns the cached wasm exports, or null if not yet initialized.
 * @returns {object|null} Wasm exports object.
 */
export function getWasm() {
  return wasm
}
