import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo.js"
import { tools } from "../Tools/index.js"
import { adjustEllipseSteps } from "../Tools/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderPaletteToolsToDOM, renderPaletteToDOM } from "../DOM/render.js"
import { randomizeColor } from "../Swatch/events.js"
import { handleTools, handleModes, updateStamp } from "../Tools/events.js"
import { renderCursor } from "../GUI/raster.js"

/**
 * Activate Shortcut for any key. Separating this from the keyDown event allows shortcuts to be triggered manually, such as by a tutorial
 * @param {String} keyCode
 */
export function activateShortcut(keyCode) {
  switch (keyCode) {
    case "ArrowLeft":
      if (state.debugger) {
        renderCanvas(null, null, true, true)
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
      if (!state.clicked) {
        state.tool = tools["grab"]
        canvas.vectorGuiCVS.style.cursor = "grab"
        updateStamp()
        renderCanvas(canvas.currentLayer)
        renderCursor(state, canvas, swatches)
      }
      break
    case "AltLeft":
    case "AltRight":
      //option key
      if (!state.clicked) {
        state.tool = tools["eyedropper"]
        canvas.vectorGuiCVS.style.cursor = "none"
        updateStamp()
        renderCanvas(canvas.currentLayer)
        renderCursor(state, canvas, swatches)
      }
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
    case "KeyA":
      //
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
    case "KeyG":
      //
      break
    case "KeyH":
      //
      break
    case "KeyI":
      handleModes(null, "inject")
      break
    case "KeyJ":
      handleTools(null, "cubicCurve")
      break
    case "KeyK":
      swatches.paletteMode = "edit"
      renderPaletteToolsToDOM()
      renderPaletteToDOM()
      break
    case "KeyL":
      handleTools(null, "line")
      break
    case "KeyM":
      handleTools(null, "replace")
      break
    case "KeyN":
      //
      break
    case "KeyO":
      handleTools(null, "ellipse")
      break
    case "KeyP":
      handleModes(null, "perfect")
      break
    case "KeyQ":
      //
      break
    case "KeyR":
      randomizeColor(swatches.primary.swatch)
      renderPaletteToDOM()
      break
    case "KeyS":
      //
      break
    case "KeyT":
      //
      break
    case "KeyU":
      //
      break
    case "KeyV":
      if (keys.MetaLeft || keys.MetaRight) {
        // console.log("paste")
        //paste function should create a new raster layer and draw the image from state.copiedRaster.image at state.copiedRaster.x, etc.
        //activate select tool for area pasted
        // add image, coordinates and new layer to timeline as "paste" action
      }
      break
    case "KeyW":
      //
      break
    case "KeyX":
      if (keys.MetaLeft || keys.MetaRight) {
        // console.log("cut")
        //clear selected area, add image to state.copiedRaster, etc.
        //add to timeline as "eraser" tool for points in selection
      } else {
        swatches.paletteMode = "remove"
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
      }
      break
    case "KeyY":
      //
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

export function deactivateShortcut(keyCode) {
  switch (keyCode) {
    case "MetaLeft":
    case "MetaRight":
      //command key
      break
    case "Space":
      //only deactivate while not clicked
      if (!state.clicked) {
        state.tool = tools[dom.toolBtn.id]
        updateStamp()
        canvas.previousXOffset = canvas.xOffset
        canvas.previousYOffset = canvas.yOffset
        renderCursor(state, canvas, swatches)
        setToolCssCursor()
        //TODO: refactor so grabSteps can be called instead with a manually supplied pointer event pointerup
      }
      break
    case "AltLeft":
    case "AltRight":
      //option key
      //only deactivate while not clicked
      if (!state.clicked) {
        state.tool = tools[dom.toolBtn.id]
        updateStamp()
        vectorGui.render(state, canvas)
        renderCursor(state, canvas, swatches)
        setToolCssCursor()
      }
      break
    case "ShiftLeft":
    case "ShiftRight":
      state.tool = tools[dom.toolBtn.id]
      tools.brush.options.line = false
      if (state.tool.name === "brush" && state.clicked) {
        state.tool.fn()
      }
      state.vectorProperties.forceCircle = false
      if (
        (vectorGui.selectedPoint.xKey || vectorGui.collidedKeys.xKey) &&
        vectorGui.selectedPoint.xKey !== "px1"
      ) {
        //while holding control point, readjust ellipse without having to move cursor.
        //TODO: update this functionality to have other radii go back to previous radii when releasing shift
        adjustEllipseSteps()
        vectorGui.render(state, canvas)
      }
      break
    case "KeyA":
      //
      break
    case "KeyB":
      //
      break
    case "KeyC":
      //
      break
    case "KeyD":
      //
      break
    case "KeyE":
      //
      break
    case "KeyF":
      //
      break
    case "KeyG":
      //
      break
    case "KeyH":
      //
      break
    case "KeyI":
      //
      break
    case "KeyJ":
      //
      break
    case "KeyK":
      swatches.paletteMode = "select"
      renderPaletteToolsToDOM()
      renderPaletteToDOM()
      break
    case "KeyL":
      //
      break
    case "KeyM":
      //
      break
    case "KeyN":
      //
      break
    case "KeyO":
      //
      break
    case "KeyP":
      //
      break
    case "KeyQ":
      //
      break
    case "KeyR":
      //
      break
    case "KeyS":
      //
      break
    case "KeyT":
      //
      break
    case "KeyU":
      //
      break
    case "KeyV":
      //
      break
    case "KeyW":
      //
      break
    case "KeyX":
      swatches.paletteMode = "select"
      renderPaletteToolsToDOM()
      renderPaletteToDOM()
      break
    case "KeyY":
      //
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

function setToolCssCursor() {
  if (dom.toolBtn.id === "grab") {
    canvas.vectorGuiCVS.style.cursor = "grab"
  } else if (dom.toolBtn.id === "move") {
    canvas.vectorGuiCVS.style.cursor = "move"
  } else if (
    dom.toolBtn.id === "replace" ||
    dom.toolBtn.id === "brush" ||
    dom.toolBtn.id === "quadCurve" ||
    dom.toolBtn.id === "cubicCurve" ||
    dom.toolBtn.id === "ellipse" ||
    dom.toolBtn.id === "fill" ||
    dom.toolBtn.id === "line" ||
    dom.toolBtn.id === "select"
  ) {
    if (dom.modeBtn.id === "erase") {
      canvas.vectorGuiCVS.style.cursor = "none"
    } else {
      canvas.vectorGuiCVS.style.cursor = "crosshair"
    }
  } else {
    canvas.vectorGuiCVS.style.cursor = "none"
  }
}
