import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderVectorsToDOM,
  renderBrushModesToDOM,
  renderBrushStampToDOM,
  renderToolOptionsToDOM,
} from "../DOM/render.js"
import { renderCursor } from "../GUI/cursor.js"
import { actionConfirmPastedPixels } from "../Actions/nonPointerActions.js"

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
      state.tool = tools[dom.toolBtn.id]
      renderCanvas(canvas.currentLayer)
      //update options
      renderBrushStampToDOM()
      dom.brushSlider.value = state.tool.brushSize
      dom.brushSlider.disabled = state.tool.brushDisabled
      //update cursor
      if (state.tool.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.cursor
      }
      //render menu options
      renderToolOptionsToDOM()
      vectorGui.reset()
      state.reset()
      renderVectorsToDOM()
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
    if (state.tool.modes[targetModeBtn.id] !== undefined) {
      if (targetModeBtn.classList.contains("selected")) {
        state.tool.modes[targetModeBtn.id] = false
      } else {
        state.tool.modes[targetModeBtn.id] = true
        //eraser and inject modes cannot be selected at the same time
        if (targetModeBtn.id === "eraser" && state.tool.modes?.inject) {
          state.tool.modes.inject = false
        } else if (targetModeBtn.id === "inject" && state.tool.modes?.eraser) {
          state.tool.modes.eraser = false
        }
      }
      if (state.tool.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.cursor
      }
      renderBrushModesToDOM()
      renderCursor()
    }
  }
}
