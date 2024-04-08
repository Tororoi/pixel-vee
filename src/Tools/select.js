import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { vectorGui } from "../GUI/vector.js"
import { renderVectorsToDOM } from "../DOM/renderVectors.js"

//=====================================//
//=== * * * Select Controller * * * ===//
//=====================================//

/**
 * TODO: (Medium Priority) Work in progress
 * GOAL: create a dynamic selectable area, allowing the user to restrict the areas of the canvas that accept changes
 * Should use a mask set that keeps track of selected or unselected pixels
 * use vectorGui.drawSelectOutline for visual rendering of masked pixels
 * Select tools: rectangle, free form, magic wand (auto select color)
 * Hold shift to add to selection with magic wand
 * Hold option to minus from selection with magic wand/ free form
 * TODO: (Medium Priority) When selecting vectors, allow rotation with recalculated vectors for accurate and useful rotation transformation
 */
function selectSteps() {
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
    adjustSelectSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.clickCounter += 1
      //reset selected vectors
      state.selectedVectorIndicesSet.clear()
      renderVectorsToDOM()
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
        tool: state.tool.name,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          // selectProperties: { ...state.selectProperties },
          // selectedVectorIndices: [],
        },
      })
      break
    case "pointerout":
      //TODO: (Low Priority) handle pointerout?
      break
    default:
    //do nothing
  }
}

/**
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
      //Ensure moving the selection area has the correct origin point (important for mobile, doesn't affect desktop)
      state.previousX = state.cursorX
      state.previousY = state.cursorY
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
        tool: state.tool.name,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          // selectProperties: { ...state.selectProperties },
          // maskArray,
          // selectedVectorIndices: [],
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
 * TODO: (Medium Priority) Make shortcuts for maintaining ratio while dragging
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
    case "px9": {
      //move selected area
      const deltaX = state.cursorX - state.previousX
      const deltaY = state.cursorY - state.previousY
      state.selectProperties.px1 += deltaX
      state.selectProperties.py1 += deltaY
      state.selectProperties.px2 += deltaX
      state.selectProperties.py2 += deltaY
      break
    }
    default:
    //do nothing
  }
  state.setBoundaryBox(state.selectProperties)
}

export const select = {
  name: "select",
  fn: selectSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: {
    // rasterOnly: {
    //   active: true,
    //   tooltip:
    //     "Paste will rasterize any vectors that intersect with selected area",
    // },
  },
  modes: {},
  type: "utility",
  cursor: "default",
  activeCursor: "default",
}
