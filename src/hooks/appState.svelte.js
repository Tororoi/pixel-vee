// Svelte 5 reactive version counter.
// Call bump() after mutating global state to trigger UI re-renders.
// Components read getVersion() in $derived expressions to subscribe.

let version = $state(0)

export const bump = () => {
  version++
}

// Reading this in a $derived expression creates a reactive dependency.
// Pattern: $derived(getVersion() >= 0 && someGlobalState.value)
export function getVersion() {
  return version
}
