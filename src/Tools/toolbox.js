import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
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
import { testAction } from "../Testing/performanceTesting.js"
import { storedActions } from "../Testing/storedActions.js"
import { actionConfirmPastedPixels } from "../Actions/nonPointerActions.js"

/**
 * Switch active tool
 * @param {string|null} toolName
 * @param {Element|null} toolBtn
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
      //Uncomment to run performance test for selected tool if testing is enabled
      // if (state.captureTesting && storedActions[dom.toolBtn.id]) {
      //   testAction(dom.toolBtn.id)
      // }
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
      renderCursor(state, canvas, swatches)
    }
  }
}

/**
 * Toggle active mode
 * TODO: (Low Priority) add multi-touch mode for drawing with multiple fingers
 * TODO: (Middle Priority) add curve brush mode for freehand drawing splines
 * @param {string|null} modeName
 * @param {Element|null} modeBtn
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
      renderCursor(state, canvas, swatches)
    }
  }
}
