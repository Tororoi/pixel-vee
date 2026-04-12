import { bump } from '../hooks/useAppState.js'

// All enable/disable states are now derived in React components via useAppState().
// These stubs keep callers working while components are being built.

export function disableActionsForPaste() {
  bump()
}

export function enableActionsForNoPaste() {
  bump()
}

export function disableActionsForNoSelection() {
  bump()
}

export function enableActionsForSelection() {
  bump()
}

export function disableActionsForNoClipboard() {
  bump()
}

export function enableActionsForClipboard() {
  bump()
}
