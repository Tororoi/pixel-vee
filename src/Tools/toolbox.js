import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools, toolGroups } from '../Tools/index.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { renderCursor } from '../GUI/cursor.js'
import { actionDeselect } from '../Actions/nonPointer/selectionActions.js'
import { actionConfirmPastedPixels } from '../Actions/nonPointer/clipboardActions.js'
import { CURVE_TYPES } from '../utils/constants.js'

/**
 * Switch active tool
 * @param {string|null} toolName - The tool name
 * @param {HTMLElement|null} toolBtn - Unused — kept for call-site compatibility
 */
export function switchTool(toolName = null, toolBtn = null) {
  const targetId = toolBtn?.id ?? toolName
  if (!targetId) return
  if (!tools[targetId]) return

  if (canvas.currentLayer?.inactiveTools?.includes(targetId)) {
    if (canvas.currentLayer.isPreview) {
      actionConfirmPastedPixels()
    } else {
      return
    }
  }

  if (globalState.tool.current?.name !== targetId) {
    globalState.tool.current = tools[targetId]
  }
  globalState.tool.selectedName = targetId

  // Sync active tool within its group
  for (const [, group] of Object.entries(toolGroups)) {
    if (group.tools.includes(targetId)) {
      group.activeTool = targetId
      break
    }
  }

  renderCanvas(canvas.currentLayer)

  // Update cursor
  if (globalState.tool.current.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = 'none'
  } else {
    canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
  }

  // If the tool is not a vector tool, clear the selected vector indices
  if (
    !['fill', 'curve', 'ellipse', 'polygon', 'move'].includes(
      tools[targetId].name,
    )
  ) {
    if (globalState.vector.selectedIndices.size > 0) {
      actionDeselect()
    }
  }
  vectorGui.reset()
  globalState.reset()
  renderCursor()
}

/**
 * Toggle active mode
 * @param {string|null} modeName - The mode name
 * @param {HTMLElement|null} modeBtn - The mode button
 */
export function toggleMode(modeName = null, modeBtn = null) {
  const targetId = modeBtn?.id ?? modeName
  if (!targetId) return
  const modes = globalState.tool.current?.modes
  if (!modes || modes[targetId] === undefined) return

  // Also write directly to the underlying tool object so the value persists
  // when the tool is re-selected (Svelte 5's proxy may not write through)
  const toolName = globalState.tool.selectedName
  const directModes = tools[toolName]?.modes

  /**
   * @param {string} key - Mode key
   * @param {*} value - Mode value
   * @returns {void}
   */
  function setMode(key, value) {
    modes[key] = value
    if (directModes) directModes[key] = value
  }

  if (modes[targetId]) {
    if (CURVE_TYPES.includes(targetId)) return
    setMode(targetId, false)
  } else {
    setMode(targetId, true)
    if (targetId === 'eraser' && modes.inject) {
      setMode('inject', false)
    } else if (targetId === 'inject' && modes.eraser) {
      setMode('eraser', false)
    }
    if (CURVE_TYPES.includes(targetId)) {
      CURVE_TYPES.forEach((t) => {
        if (t !== targetId) setMode(t, false)
      })
    }
  }
  if (modes.eraser) {
    canvas.vectorGuiCVS.style.cursor = 'none'
  } else {
    canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
  }
  renderCursor()
}
