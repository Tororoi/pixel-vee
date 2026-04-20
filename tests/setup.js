// Polyfill Svelte 5 runes for Node test environment.
// $state() is compiled away by the Svelte compiler in real usage;
// here we just return the value as-is so .svelte.js stores import cleanly.
global.$state = (v) => v
global.$state.raw = (v) => v
global.$state.snapshot = (v) => v
global.$derived = (v) => (typeof v === 'function' ? v() : v)
global.$derived.by = (fn) => fn()
global.$effect = () => {}
global.$effect.pre = () => {}
global.$props = () => ({})
