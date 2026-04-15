// Svelte 5 reactive version counter.
// Call bump() after mutating global state to trigger UI re-renders.
// Components read getVersion() in $derived expressions to subscribe.

let version = $state(0)

export const bump = () => {
  version++
}

/**
 * Read this in a $derived expression to create a reactive dependency.
 * Pattern: $derived(getVersion() >= 0 && someGlobalState.value)
 * @returns {number} Current version counter
 */
export function getVersion() {
  return version
}

// Reactive cross-component state for the dither picker's active vector target.
// Replaces the el._vectorTarget DOM property pattern.
let _ditherVectorTarget = $state.raw(null)
export const getDitherVectorTarget = () => _ditherVectorTarget
export const setDitherVectorTarget = (v) => {
  _ditherVectorTarget = v
}
