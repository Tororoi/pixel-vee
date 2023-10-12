import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { handleUndo, handleRedo } from "./undoRedo.js"
import { tools, adjustEllipseSteps } from "./index.js"
import { renderCanvas } from "../Canvas/render.js"
import { randomizeColor } from "../Swatch/events.js"

/**
 * Activate Shortcut for any key. Separating this from the keyDown event allows shortcuts to be triggered manually, such as by a tutorial
 * @param {*} keyCode - eg. KeyC, Space, ArrowRight, etc.
 */
export function activateShortcut(keyCode) {
  switch (keyCode) {
    case "ArrowLeft":
      if (state.debugger) {
        renderCanvas(null, true, true)
        state.debugObject.maxSteps -= 1
        state.debugFn(state.debugObject)
      }
      break
    case "ArrowRight":
      if (state.debugger) {
        state.debugObject.maxSteps += 1
        state.debugFn(state.debugObject)
      }
      break
    case "KeyZ":
      if (keys.MetaLeft || keys.MetaRight) {
        if (keys.ShiftLeft || keys.ShiftRight) {
          //shift+meta+z
          handleRedo()
        } else {
          handleUndo()
        }
      }
      break
    case "MetaLeft":
    case "MetaRight":
      //command key
      break
    case "Space":
      state.tool = tools["grab"]
      canvas.vectorGuiCVS.style.cursor = "move"
      break
    case "AltLeft":
    case "AltRight":
      //option key
      state.tool = tools["eyedropper"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "ShiftLeft":
    case "ShiftRight":
      if (dom.toolBtn.id === "brush") {
        state.tool.options.line = true
        state.lineStartX = state.cursorX
        state.lineStartY = state.cursorY
      } else if (dom.toolBtn.id === "ellipse") {
        state.vectorProperties.forceCircle = true
        if (
          vectorGui.selectedPoint.xKey &&
          state.clickCounter === 0 &&
          vectorGui.selectedPoint.xKey !== "px1"
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          //TODO: update this functionality to have other radii go back to previous radii when releasing shift
          adjustEllipseSteps()
          vectorGui.render(state, canvas)
        }
      }
      break
    case "KeyS":
      randomizeColor(swatches.primary.swatch)
      break
    case "KeyD":
      //reset old button
      dom.modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.modeBtn = document.querySelector("#draw")
      dom.modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "draw"
      break
    case "KeyE":
      //reset old button
      dom.modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.modeBtn = document.querySelector("#erase")
      dom.modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "erase"
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyP":
      //reset old button
      dom.modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.modeBtn = document.querySelector("#perfect")
      dom.modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "perfect"
      break
    case "KeyI":
      //reset old button
      dom.modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.modeBtn = document.querySelector("#inject")
      dom.modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "inject"
      break
    case "KeyB":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#brush")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["brush"]
      if (dom.modeBtn.id === "erase") {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = "crosshair"
      }
      break
    case "KeyR":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#replace")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["replace"]
      if (dom.modeBtn.id === "erase") {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = "crosshair"
      }
      break
    case "KeyL":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#line")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["line"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyF":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#fill")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["fill"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyC":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#curve")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["quadCurve"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyJ":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#cubicCurve")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["cubicCurve"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyO":
      //reset old button
      dom.toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      dom.toolBtn = document.querySelector("#ellipse")
      dom.toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["ellipse"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    default:
    //do nothing
  }
}
