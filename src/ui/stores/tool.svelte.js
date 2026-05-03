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

export function restoreTool(snap) {
  Object.assign(toolStore, snap)
}
