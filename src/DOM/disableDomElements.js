import { bump } from '../hooks/useAppState.js'

// All enable/disable states are now derived in React components via useAppState().
// These stubs keep callers working while components are being built.

/**
 * Notify React of a paste-active state change.
 */
export function disableActionsForPaste() {
  bump()
}

/**
 * Notify React of a paste-cleared state change.
 */
export function enableActionsForNoPaste() {
  bump()
}

/**
 * Notify React that a selection is no longer active.
 */
export function disableActionsForNoSelection() {
  bump()
}

/**
 * Notify React that a selection is now active.
 */
export function enableActionsForSelection() {
  bump()
}

/**
 * Notify React that the clipboard is empty.
 */
export function disableActionsForNoClipboard() {
  bump()
}

/**
 * Notify React that the clipboard now has content.
 */
export function enableActionsForClipboard() {
  bump()
}
