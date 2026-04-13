import { state } from '../Context/state.js'
import { bump } from '../hooks/useAppState.js'
import { canvas } from '../Context/canvas.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { vectorGui } from '../GUI/vector.js'
import { renderVectorsToDOM } from '../DOM/renderVectors.js'
import { dom } from '../Context/dom.js'

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
 * TODO: (Medium Priority) Allow selecting all vectors within box by checking if control points fall within selection area
 */
function selectSteps() {
  if (vectorGui.selectedCollisionPresent && state.tool.clickCounter === 0) {
    adjustSelectSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      state.tool.clickCounter += 1
      //reset selected vectors
      state.vector.clearSelected()
      state.ui.vectorTransformOpen = false
      bump()
      if (dom.vectorTransformUIContainer)
        dom.vectorTransformUIContainer.style.display = 'none'
      renderVectorsToDOM()
      //set initial properties
      state.selection.properties.px1 = state.cursor.x
      state.selection.properties.py1 = state.cursor.y
      state.selection.properties.px2 = state.cursor.x
      state.selection.properties.py2 = state.cursor.y
      state.selection.setBoundaryBox(state.selection.properties)
      break
    case 'pointermove':
      state.selection.properties.px2 = state.cursor.x
      state.selection.properties.py2 = state.cursor.y
      state.selection.setBoundaryBox(state.selection.properties)
      break
    case 'pointerup':
      state.tool.clickCounter = 0
      state.selection.normalize()
      state.selection.setBoundaryBox(state.selection.properties)
      addToTimeline({
        tool: state.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          // selectProperties: { ...state.selection.properties },
          // selectedVectorIndices: [],
        },
      })
      break
    case 'pointerout':
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
    case 'pointerdown':
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      //Ensure moving the selection area has the correct origin point (important for mobile, doesn't affect desktop)
      state.cursor.prevX = state.cursor.x
      state.cursor.prevY = state.cursor.y
      adjustBoundaries()
      break
    case 'pointermove':
      if (vectorGui.selectedPoint.xKey) {
        adjustBoundaries()
      }
      break
    case 'pointerup':
      state.selection.normalize()
      state.selection.setBoundaryBox(state.selection.properties)
      addToTimeline({
        tool: state.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          // selectProperties: { ...state.selection.properties },
          // maskArray,
          // selectedVectorIndices: [],
        },
      })
      vectorGui.selectedPoint = {
        xKey: null,
        yKey: null,
      }
      break
    case 'pointerout':
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
    case 'px1':
      state.selection.properties.px1 = state.cursor.x
      state.selection.properties.py1 = state.cursor.y
      break
    case 'px2':
      state.selection.properties.py1 = state.cursor.y
      break
    case 'px3':
      state.selection.properties.px2 = state.cursor.x
      state.selection.properties.py1 = state.cursor.y
      break
    case 'px4':
      state.selection.properties.px2 = state.cursor.x
      break
    case 'px5':
      state.selection.properties.px2 = state.cursor.x
      state.selection.properties.py2 = state.cursor.y
      break
    case 'px6':
      state.selection.properties.py2 = state.cursor.y
      break
    case 'px7':
      state.selection.properties.px1 = state.cursor.x
      state.selection.properties.py2 = state.cursor.y
      break
    case 'px8':
      state.selection.properties.px1 = state.cursor.x
      break
    case 'px9': {
      //move selected area
      const deltaX = state.cursor.x - state.cursor.prevX
      const deltaY = state.cursor.y - state.cursor.prevY
      state.selection.properties.px1 += deltaX
      state.selection.properties.py1 += deltaY
      state.selection.properties.px2 += deltaX
      state.selection.properties.py2 += deltaY
      break
    }
    default:
    //do nothing
  }
  state.selection.setBoundaryBox(state.selection.properties)
}

export const select = {
  name: 'select',
  fn: selectSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: true,
  options: {
    // rasterOnly: {
    //   active: true,
    //   tooltip:
    //     "Paste will rasterize any vectors that intersect with selected area",
    // },
  },
  modes: {},
  type: 'utility',
  cursor: 'default',
  activeCursor: 'default',
}
