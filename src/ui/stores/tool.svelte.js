/**
 * Reactive store holding the active tool's identity and transient
 * gesture state. `current` is the live tool object resolved from
 * the registry; the coordinate fields (`lineStartX`, `grabStartX`,
 * etc.) accumulate during in-progress pointer interactions and are
 * reset between gestures. `touch` reflects current input modality
 * and is intentionally excluded from snapshot/restore because it
 * describes the device environment, not a user-selected tool state.
 */
export const toolStore = $state({
  current: null,
  selectedName: 'brush',
  clickCounter: 0,
  lineStartX: null,
  lineStartY: null,
  grabStartX: null,
  grabStartY: null,
  startScale: null,
  touch: false,
})

/**
 * Captures a plain-object snapshot of the tool store for later
 * restoration. The returned value is intentionally non-reactive —
 * it is a detached copy that callers can hold across async
 * boundaries (e.g. navigator mode transitions) without
 * inadvertently subscribing to Svelte state. `touch` is omitted
 * because restoring input modality after a round-trip could
 * incorrectly flip the pointer model if the device context changed.
 * @returns {{ current: object|null, selectedName: string,
 *   clickCounter: number, lineStartX: number|null,
 *   lineStartY: number|null, grabStartX: number|null,
 *   grabStartY: number|null, startScale: number|null }}
 *   Plain snapshot of restorable tool state.
 */
export function snapshotTool() {
  return {
    current: toolStore.current,
    selectedName: toolStore.selectedName,
    clickCounter: toolStore.clickCounter,
    lineStartX: toolStore.lineStartX,
    lineStartY: toolStore.lineStartY,
    grabStartX: toolStore.grabStartX,
    grabStartY: toolStore.grabStartY,
    startScale: toolStore.startScale,
  }
}

/**
 * Merges a previously captured snapshot back into the tool store,
 * restoring tool identity and in-progress gesture coordinates.
 * `Object.assign` is used instead of a full replacement so that
 * fields absent from the snapshot — specifically `touch`, which is
 * never snapshotted — retain their current live values and are not
 * inadvertently zeroed out during a navigator restore.
 * @param {ReturnType<typeof snapshotTool>} snap - The snapshot
 *   previously returned by `snapshotTool`.
 */
export function restoreTool(snap) {
  Object.assign(toolStore, snap)
}
