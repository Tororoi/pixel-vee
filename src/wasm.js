import init, * as wasmExports from '../wasm/pkg/pixel_vee_wasm.js'

let wasm = null

export async function initWasm() {
  if (wasm) return wasm
  await init()
  wasm = wasmExports
  return wasm
}

export function getWasm() {
  return wasm
}
