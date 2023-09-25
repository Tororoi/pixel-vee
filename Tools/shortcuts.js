import { keys } from "../Context/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { handleUndo, handleRedo } from "./undoRedo.js"
import { tools, adjustEllipseSteps } from "./index.js"

/**
 * Activate Shortcut for any key. Separating this from the keyDown event allows shortcuts to be triggered manually, such as by a tutorial
 * @param {*} keyCode - eg. KeyC, Space, ArrowRight, etc.
 * @param {*} modeBtn - pass html elements since those are defined in index.js
 * @param {*} toolBtn - pass html elements since those are defined in index.js
 * TODO: refactor where elements are defined so they can be imported
 */
export function activateShortcut(keyCode, modeBtn, toolBtn) {
  switch (keyCode) {
    case "ArrowLeft":
      if (state.debugger) {
        canvas.render()
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
      if (toolBtn.id === "brush") {
        state.tool = tools["line"]
        state.tool.brushSize = tools["brush"].brushSize
        canvas.vectorGuiCVS.style.cursor = "none"
      } else if (toolBtn.id === "ellipse") {
        state.vectorProperties.forceCircle = true
        if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
          //while holding control point, readjust ellipse without having to move cursor.
          //TODO: update this functionality to have other radii go back to previous radii when releasing shift
          adjustEllipseSteps()
          vectorGui.render(state, canvas)
        }
      }
      break
    case "KeyS":
      swatches.randomizeColor("swatch btn")
      break
    case "KeyD":
      //reset old button
      modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      modeBtn = document.querySelector("#draw")
      modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "draw"
      break
    case "KeyE":
      //reset old button
      modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      modeBtn = document.querySelector("#erase")
      modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "erase"
      break
    case "KeyP":
      //reset old button
      modeBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      modeBtn = document.querySelector("#perfect")
      modeBtn.style.background = "rgb(255, 255, 255)"
      state.mode = "perfect"
      break
    case "KeyB":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#brush")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["brush"]
      canvas.vectorGuiCVS.style.cursor = "crosshair"
      break
    case "KeyR":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#replace")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["replace"]
      canvas.vectorGuiCVS.style.cursor = "crosshair"
      break
    case "KeyL":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#line")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["line"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyF":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#fill")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["fill"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyC":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#curve")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["quadCurve"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyJ":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#cubicCurve")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["cubicCurve"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    case "KeyO":
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //set new button
      toolBtn = document.querySelector("#ellipse")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools["ellipse"]
      canvas.vectorGuiCVS.style.cursor = "none"
      break
    default:
    //do nothing
  }
}
