import { useSyncExternalStore } from 'react'

let version = 0
const listeners = new Set()

export const bump = () => {
  version++
  listeners.forEach((l) => l())
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Subscribe to global app state changes.
 * Call bump() in action functions/render stubs to trigger re-renders.
 * Components read directly from existing state objects after calling this hook.
 * @returns {number} current version (opaque — used only to trigger re-render)
 */
export function useAppState() {
  return useSyncExternalStore(subscribe, () => version)
}
