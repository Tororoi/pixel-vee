import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools, toolGroups } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  // renderVectorsToDOM,
  renderBrushModesToDOM,
  renderBrushStampToDOM,
  renderToolOptionsToDOM,
  renderStampOptionsToDOM,
  renderDitherOptionsToDOM,
  updateDitherPickerColors,
} from "../DOM/render.js"
import { renderCursor } from "../GUI/cursor.js"
import { actionDeselect } from "../Actions/nonPointer/selectionActions.js"
import { actionConfirmPastedPixels } from "../Actions/nonPointer/clipboardActions.js"

/**
 * Sync each tool group button to its default active tool on page load
 */
export function initToolGroups() {
  for (const [groupName, group] of Object.entries(toolGroups)) {
    const groupBtn = document.querySelector(`.tool-group-btn[data-group="${groupName}"]`)
    const activeToolBtn = document.querySelector(`#${group.activeTool}`)
    if (groupBtn && activeToolBtn) {
      group.tools.forEach((t) => groupBtn.classList.remove(t))
      groupBtn.classList.add(group.activeTool)
      groupBtn.dataset.tooltip = activeToolBtn.dataset.tooltip
      groupBtn.setAttribute("aria-label", activeToolBtn.getAttribute("aria-label"))
    }
  }
}

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
      //remove selected from old tool's group button if applicable
      for (const [groupName, group] of Object.entries(toolGroups)) {
        if (group.tools.includes(dom.toolBtn.id)) {
          document
            .querySelector(`.tool-group-btn[data-group="${groupName}"]`)
            ?.classList.remove("selected")
          break
        }
      }
      //get new button and select it
      dom.toolBtn = targetToolBtn
      dom.toolBtn.classList.add("selected")
      state.tool.current = tools[dom.toolBtn.id]
      //sync group state if new tool belongs to a group
      for (const [groupName, group] of Object.entries(toolGroups)) {
        if (group.tools.includes(dom.toolBtn.id)) {
          group.activeTool = dom.toolBtn.id
          const groupBtn = document.querySelector(
            `.tool-group-btn[data-group="${groupName}"]`
          )
          if (groupBtn) {
            group.tools.forEach((t) => groupBtn.classList.remove(t))
            groupBtn.classList.add(dom.toolBtn.id)
            groupBtn.classList.add("selected")
            groupBtn.dataset.tooltip = dom.toolBtn.dataset.tooltip
            groupBtn.setAttribute("aria-label", dom.toolBtn.getAttribute("aria-label"))
          }
          break
        }
      }
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
          "vector",
          "ellipse",
          "polygon",
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
      renderStampOptionsToDOM()
      renderDitherOptionsToDOM()
      renderCursor()
    }
  }
}

const CURVE_TYPES = ['line', 'quadCurve', 'cubicCurve']

/**
 * Update a selected vector's curve type and compute any missing control points.
 * When upgrading to a type that needs more points, missing px3/py3 or px4/py4 are
 * calculated as the midpoint of p1 and p2.
 * @param {string} newType - 'line' | 'quadCurve' | 'cubicCurve'
 */
function updateSelectedVectorCurveType(newType) {
  if (state.vector.currentIndex === null) return
  const vector = state.vector.all[state.vector.currentIndex]
  if (!vector || !CURVE_TYPES.includes(vector.vectorProperties.type)) return
  const vp = vector.vectorProperties
  vp.type = newType
  if (newType === 'quadCurve' || newType === 'cubicCurve') {
    if (vp.px3 == null || vp.py3 == null) {
      vp.px3 = Math.round((vp.px1 + vp.px2) / 2)
      vp.py3 = Math.round((vp.py1 + vp.py2) / 2)
    }
  }
  if (newType === 'cubicCurve') {
    if (vp.px4 == null || vp.py4 == null) {
      vp.px4 = Math.round((vp.px1 + vp.px2) / 2)
      vp.py4 = Math.round((vp.py1 + vp.py2) / 2)
    }
  }
  renderCanvas(canvas.currentLayer)
  vectorGui.render()
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
        // Curve type modes cannot be deselected — one must always be active
        if (CURVE_TYPES.includes(targetModeBtn.id)) return
        state.tool.current.modes[targetModeBtn.id] = false
      } else {
        state.tool.current.modes[targetModeBtn.id] = true
        //eraser and inject modes cannot be selected at the same time
        if (targetModeBtn.id === "eraser" && state.tool.current.modes?.inject) {
          state.tool.current.modes.inject = false
        } else if (targetModeBtn.id === "inject" && state.tool.current.modes?.eraser) {
          state.tool.current.modes.eraser = false
        }
        //line, quadCurve, cubicCurve modes are mutually exclusive
        if (CURVE_TYPES.includes(targetModeBtn.id)) {
          CURVE_TYPES.forEach((t) => {
            if (t !== targetModeBtn.id) state.tool.current.modes[t] = false
          })
          updateSelectedVectorCurveType(targetModeBtn.id)
          renderToolOptionsToDOM()
        }
      }
      if (state.tool.current.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
      }
      renderBrushModesToDOM()
      renderCursor()
      updateDitherPickerColors()
    }
  }
}
