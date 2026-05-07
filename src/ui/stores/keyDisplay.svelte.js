/**
 * Reactive store for the on-screen shortcut display. `show` is called
 * from `activateShortcut` whenever a registered shortcut fires, so the
 * combo (e.g. Cmd+S) is captured at the moment the action runs rather
 * than tracked by holding keydown/keyup state. `showId` is bumped on
 * every call so consumers can re-key their DOM and restart the fade
 * animation even when the same combo is repeated.
 */

const KEY_LABELS = {
  Space: 'Space',
  Enter: '⏎',
  NumpadEnter: '⏎',
  Backspace: '⌫',
  Tab: 'Tab',
  Escape: 'Esc',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Slash: '/',
  Backslash: '\\',
  Equal: '=',
  Minus: '-',
  Period: '.',
  Comma: ',',
  Semicolon: ';',
  Quote: "'",
  Backquote: '`',
  BracketLeft: '[',
  BracketRight: ']',
  AltLeft: '⌥',
  AltRight: '⌥',
  ShiftLeft: '⇧',
  ShiftRight: '⇧',
  MetaLeft: '⌘',
  MetaRight: '⌘',
  ControlLeft: 'Ctrl',
  ControlRight: 'Ctrl',
}

/**
 * Maps a KeyboardEvent.code to a short display label (e.g. "KeyA" → "A",
 * "Digit1" → "1"). Falls back to the raw code when nothing else matches.
 * @param {string} code - The KeyboardEvent.code value.
 * @returns {string} The display label for the key.
 */
function labelFor(code) {
  if (KEY_LABELS[code]) return KEY_LABELS[code]
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return code.slice(6)
  if (/^F\d+$/.test(code)) return code
  return code
}

export const keyDisplayStore = $state({
  labels: [],
  showId: 0,
  /**
   * Records a fired shortcut for display. Modifiers always render
   * before the main key. Dedupes by label so a hold-handler firing on
   * ShiftLeft (where shift is also true) collapses to a single ⇧
   * instead of "⇧ + ⇧".
   * @param {boolean} meta - Whether Cmd was held when the shortcut fired.
   * @param {boolean} shift - Whether Shift was held when the shortcut fired.
   * @param {string} code - The KeyboardEvent.code that triggered the shortcut.
   */
  show(meta, shift, code) {
    const out = []
    if (meta) out.push('⌘')
    if (shift) out.push('⇧')
    const label = labelFor(code)
    if (!out.includes(label)) out.push(label)
    this.labels = out
    this.showId += 1
  },
})
