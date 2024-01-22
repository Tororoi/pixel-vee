import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { vectorGui } from "../GUI/vector.js"

//=====================================//
//=== * * * Select Controller * * * ===//
//=====================================//

/**
 * TODO: Work in progress
 * GOAL: create a dynamic selectable area, allowing the user to restrict the areas of the canvas that accept changes
 * Should use a mask set that keeps track of selected or unselected pixels
 * use vectorGui.drawSelectOutline for visual rendering of masked pixels
 * Select tools: rectangle, free form, magic wand (auto select color)
 * Hold shift to add to selection with magic wand
 * Hold option to minus from selection with magic wand/ free form
 * Command + I to invert selection
 */
function selectSteps() {
  if (vectorGui.collisionPresent && state.clickCounter === 0) {
    adjustSelectSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.clickCounter += 1
      //set initial properties
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      state.setBoundaryBox(state.selectProperties)
      break
    case "pointermove":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      state.setBoundaryBox(state.selectProperties)
      break
    case "pointerup":
      state.clickCounter = 0
      state.normalizeSelectProperties()
      state.setBoundaryBox(state.selectProperties)
      addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          invertSelection: state.selectionInversed,
          selectProperties: { ...state.selectProperties },
        },
      })
      break
    case "pointerout":
      //TODO: handle pointerout?
      break
    default:
    //do nothing
  }
}

/**
 * TODO: Work in progress
 * Adjust selected area by dragging one of eight control points
 * Move selected area by dragging inside selected area
 */
function adjustSelectSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedKeys.xKey,
        yKey: vectorGui.collidedKeys.yKey,
      }
      adjustBoundaries()
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        adjustBoundaries()
      }
      break
    case "pointerup":
      state.normalizeSelectProperties()
      state.setBoundaryBox(state.selectProperties)
      addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          invertSelection: state.selectionInversed,
          selectProperties: { ...state.selectProperties },
          // maskArray,
        },
      })
      vectorGui.selectedPoint = {
        xKey: null,
        yKey: null,
      }
      break
    case "pointerout":
      break
    default:
    //do nothing
  }
}

/**
 * Adjust selected area by dragging one of eight control points or move selected area by dragging inside selected area
 * TODO: Make shortcuts for maintaining ratio while dragging
 */
function adjustBoundaries() {
  //selectedPoint does not correspond to the selectProperties key. Based on selected point, adjust boundaryBox.
  switch (vectorGui.selectedPoint.xKey) {
    case "px1":
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "px2":
      state.selectProperties.py1 = state.cursorY
      break
    case "px3":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "px4":
      state.selectProperties.px2 = state.cursorX
      break
    case "px5":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "px6":
      state.selectProperties.py2 = state.cursorY
      break
    case "px7":
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "px8":
      state.selectProperties.px1 = state.cursorX
      break
    case "px9":
      //move selected area
      const deltaX = state.cursorX - state.previousX
      const deltaY = state.cursorY - state.previousY
      state.selectProperties.px1 += deltaX
      state.selectProperties.py1 += deltaY
      state.selectProperties.px2 += deltaX
      state.selectProperties.py2 += deltaY
    default:
    //do nothing
  }
  state.setBoundaryBox(state.selectProperties)
}

//TODO: adjust pasted pixels to move/flip/transform before setting them to the layer canvas

export const select = {
  name: "select",
  fn: selectSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: {
    rasterOnly: {
      active: true,
      tooltip:
        "Paste will rasterize any vectors that intersect with selected area",
    },
    // inverse: {
    //   active: false,
    //   tooltip: "Inverse selected area",
    // },
  },
  modes: {},
  type: "utility",
  cursor: "default",
  activeCursor: "default",
}
