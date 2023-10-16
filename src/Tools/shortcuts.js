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
import { handleTools, handleModes } from "./events.js"

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
    case "KeyB":
      handleTools(null, "brush")
      break
    case "KeyC":
      if (keys.MetaLeft || keys.MetaRight) {
        // console.log("copy")
        //copy function should make an image from the currently selected area defined by
        //state.selectProperties and store it in state.copiedRaster.image and store x, y in
        //state.copiedRaster.x, state.copiedRaster.y, along with width and height.
        //Advanced method would be to save an image from imageData defined by maskSet.
        // Do not add to timeline
      } else {
        handleTools(null, "quadCurve")
      }
      break
    case "KeyD":
      if (keys.MetaLeft || keys.MetaRight) {
        //deselect
        if (state.selectProperties.px1) {
          state.addToTimeline({
            tool: tools.select,
            layer: canvas.currentLayer,
            properties: {
              deselect: true,
              selectProperties: { ...state.selectProperties },
              maskSet: state.maskSet,
            },
          })
          state.undoStack.push(state.action)
          state.action = null
          state.redoStack = []
          state.resetSelectProperties()
          vectorGui.render(state, canvas)
        }
      } else {
        handleModes(null, "draw")
      }
      break
    case "KeyE":
      handleModes(null, "erase")
      break
    case "KeyF":
      handleTools(null, "fill")
      break
    case "KeyI":
      handleModes(null, "inject")
      break
    case "KeyJ":
      handleTools(null, "cubicCurve")
      break
    case "KeyL":
      handleTools(null, "line")
      break
    case "KeyO":
      handleTools(null, "ellipse")
      break
    case "KeyP":
      handleModes(null, "perfect")
      break
    case "KeyR":
      handleTools(null, "replace")
      break
    case "KeyS":
      randomizeColor(swatches.primary.swatch)
      break
    case "KeyV":
      if (keys.MetaLeft || keys.MetaRight) {
        // console.log("paste")
        //paste function should create a new raster layer and draw the image from state.copiedRaster.image at state.copiedRaster.x, etc.
        //activate select tool for area pasted
        // add image, coordinates and new layer to timeline as "paste" action
      }
      break
    case "KeyX":
      if (keys.MetaLeft || keys.MetaRight) {
        // console.log("cut")
        //clear selected area, add image to state.copiedRaster, etc.
        //add to timeline as "eraser" tool for points in selection
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
    default:
    //do nothing
  }
}
