import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools, toolGroups } from '../Tools/index.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { renderCursor } from '../GUI/cursor.js'
import { actionDeselect } from '../Actions/nonPointer/selectionActions.js'
import { actionConfirmPastedPixels } from '../Actions/nonPointer/clipboardActions.js'
import { CURVE_TYPES } from '../utils/constants.js'
import { bump } from '../hooks/useAppState.js'

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

  state.tool.current = tools[targetId]
  state.tool.selectedName = targetId

  // Sync active tool within its group
  for (const [, group] of Object.entries(toolGroups)) {
    if (group.tools.includes(targetId)) {
      group.activeTool = targetId
      break
    }
  }

  renderCanvas(canvas.currentLayer)

  // Update cursor
  if (state.tool.current.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = 'none'
  } else {
    canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
  }

  // If the tool is not a vector tool, clear the selected vector indices
  if (
    !['fill', 'curve', 'ellipse', 'polygon', 'move'].includes(
      tools[targetId].name,
    )
  ) {
    if (state.vector.selectedIndices.size > 0) {
      actionDeselect()
    }
  }
  vectorGui.reset()
  state.reset()
  renderCursor()
  bump()
}

/**
 * Toggle active mode
 * @param {string|null} modeName - The mode name
 * @param {HTMLElement|null} modeBtn - The mode button
 */
export function toggleMode(modeName = null, modeBtn = null) {
  const targetModeBtn = modeBtn || document.querySelector(`#${modeName}`)
  if (targetModeBtn) {
    if (state.tool.current.modes[targetModeBtn.id] !== undefined) {
      if (targetModeBtn.classList.contains('selected')) {
        if (CURVE_TYPES.includes(targetModeBtn.id)) return
        state.tool.current.modes[targetModeBtn.id] = false
      } else {
        state.tool.current.modes[targetModeBtn.id] = true
        if (targetModeBtn.id === 'eraser' && state.tool.current.modes?.inject) {
          state.tool.current.modes.inject = false
        } else if (
          targetModeBtn.id === 'inject' &&
          state.tool.current.modes?.eraser
        ) {
          state.tool.current.modes.eraser = false
        }
        if (CURVE_TYPES.includes(targetModeBtn.id)) {
          CURVE_TYPES.forEach((t) => {
            if (t !== targetModeBtn.id) state.tool.current.modes[t] = false
          })
        }
      }
      if (state.tool.current.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = 'none'
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
      }
      renderCursor()
      bump()
    }
  }
}
