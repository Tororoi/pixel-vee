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

  globalState.tool.current = tools[targetId]
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
  const targetModeBtn = modeBtn || document.querySelector(`#${modeName}`)
  if (targetModeBtn) {
    if (globalState.tool.current.modes[targetModeBtn.id] !== undefined) {
      if (targetModeBtn.classList.contains('selected')) {
        if (CURVE_TYPES.includes(targetModeBtn.id)) return
        globalState.tool.current.modes[targetModeBtn.id] = false
      } else {
        globalState.tool.current.modes[targetModeBtn.id] = true
        if (
          targetModeBtn.id === 'eraser' &&
          globalState.tool.current.modes?.inject
        ) {
          globalState.tool.current.modes.inject = false
        } else if (
          targetModeBtn.id === 'inject' &&
          globalState.tool.current.modes?.eraser
        ) {
          globalState.tool.current.modes.eraser = false
        }
        if (CURVE_TYPES.includes(targetModeBtn.id)) {
          CURVE_TYPES.forEach((t) => {
            if (t !== targetModeBtn.id)
              globalState.tool.current.modes[t] = false
          })
        }
      }
      if (globalState.tool.current.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = 'none'
      } else {
        canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
      }
      renderCursor()
    }
  }
}
