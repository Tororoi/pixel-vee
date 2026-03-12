import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  // renderVectorsToDOM,
  renderBrushModesToDOM,
  renderBrushStampToDOM,
  renderToolOptionsToDOM,
} from "../DOM/render.js"
import { renderCursor } from "../GUI/cursor.js"
import {
  actionConfirmPastedPixels,
  actionDeselect,
} from "../Actions/nonPointerActions.js"

/**
 * Switch active tool
 * @param {string|null} toolName - The tool name
 * @param {HTMLElement|null} toolBtn - The tool button
 */
export function switchTool(toolName = null, toolBtn = null) {
  const targetToolBtn = toolBtn || document.querySelector(`#${toolName}`)
  if (targetToolBtn) {
    //failsafe for hacking tool ids
    if (tools[targetToolBtn?.id]) {
      if (canvas.currentLayer.inactiveTools.includes(targetToolBtn?.id)) {
        if (canvas.currentLayer.isPreview) {
          actionConfirmPastedPixels()
        } else {
          return
        }
      }
      //reset old button
      dom.toolBtn.classList.remove("selected")
      //get new button and select it
      dom.toolBtn = targetToolBtn
      dom.toolBtn.classList.add("selected")
      state.tool.current = tools[dom.toolBtn.id]
      renderCanvas(canvas.currentLayer)
      //update options
      renderBrushStampToDOM()
      dom.brushSlider.value = state.tool.current.brushSize
      dom.brushSlider.disabled = state.tool.current.brushDisabled
      //update cursor
      if (state.tool.current.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
      }
      //render menu options
      renderToolOptionsToDOM()
      //If the tool is not a vector tool, clear the selected vector indices
      if (
        ![
          "fill",
          "line",
          "quadCurve",
          "cubicCurve",
          "ellipse",
          "move",
        ].includes(tools[targetToolBtn.id].name)
      ) {
        if (state.vector.selectedIndices.size > 0) {
          actionDeselect()
        }
      }
      vectorGui.reset()
      state.reset()
      renderBrushModesToDOM()
      renderCursor()
    }
  }
}

/**
 * Toggle active mode
 * TODO: (Low Priority) add multi-touch mode for drawing with multiple fingers
 * TODO: (Medium Priority) add curve brush mode for freehand drawing splines
 * @param {string|null} modeName - The mode name
 * @param {HTMLElement|null} modeBtn - The mode button
 */
export function toggleMode(modeName = null, modeBtn = null) {
  const targetModeBtn = modeBtn || document.querySelector(`#${modeName}`)
  if (targetModeBtn) {
    if (state.tool.current.modes[targetModeBtn.id] !== undefined) {
      if (targetModeBtn.classList.contains("selected")) {
        state.tool.current.modes[targetModeBtn.id] = false
      } else {
        state.tool.current.modes[targetModeBtn.id] = true
        //eraser and inject modes cannot be selected at the same time
        if (targetModeBtn.id === "eraser" && state.tool.current.modes?.inject) {
          state.tool.current.modes.inject = false
        } else if (targetModeBtn.id === "inject" && state.tool.current.modes?.eraser) {
          state.tool.current.modes.eraser = false
        }
      }
      if (state.tool.current.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
      }
      renderBrushModesToDOM()
      renderCursor()
    }
  }
}
