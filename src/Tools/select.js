import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

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
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //1. set drag origin
      //2. save context
      // state.selectPixelPoints = []
      // for (const pixel of brushStamps[state.tool.brushType][state.tool.brushSize]) {
      //   state.selectPixelPoints[`${pixel.x},${pixel.y}`] = {
      //     x: pixel.x,
      //     y: pixel.y,
      //   }
      // }
      // state.selectCornersSet = new Set()
      // for (const pixel of brushStamps[state.tool.brushType][state.tool.brushSize]) {
      //   state.selectCornersSet.add(`${pixel.x},${pixel.y}`)
      //   state.selectCornersSet.add(`${pixel.x + 1},${pixel.y}`)
      //   state.selectCornersSet.add(`${pixel.x},${pixel.y + 1}`)
      //   state.selectCornersSet.add(`${pixel.x + 1},${pixel.y + 1}`)
      // }
      // state.maskSet = new Set()
      state.maskSet = null
      //reset properties
      state.selectProperties.px1 = null
      state.selectProperties.py1 = null
      state.selectProperties.px2 = null
      state.selectProperties.py2 = null
      //set top left corner
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "pointermove":
      //1. if state.clicked create strokeable path using drag origin and current x/y as opposite corners of rectangle
      //2. stroke outline path with animated "marching ants".
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "pointerup":
      //1. create clip mask using drag origin and current x/y as opposite corners of rectangle
      //create maskset
      state.maskSet = new Set()
      const { px1, py1, px2, py2 } = state.selectProperties
      const xMin = Math.min(px1, px2)
      const xMax = Math.max(px1, px2)
      const yMin = Math.min(py1, py2)
      const yMax = Math.max(py1, py2)
      const width = canvas.currentLayer.cvs.width
      const height = canvas.currentLayer.cvs.height

      const addMask = (xRange, yRange) => {
        for (let x = xRange[0]; x < xRange[1]; x++) {
          for (let y = yRange[0]; y < yRange[1]; y++) {
            const key = `${x},${y}`
            state.maskSet.add(key)
          }
        }
      }

      // Add masks for regions outside the rectangular area
      addMask([0, xMin], [0, height]) // Left region
      addMask([xMax, width], [0, height]) // Right region
      addMask([xMin, xMax], [0, yMin]) // Top region between xMin and xMax
      addMask([xMin, xMax], [yMax, height]) // Bottom region between xMin and xMax
      //add to timeline the maskSet, p1, p2. undo will unset from state, redo will set to state
      let maskArray = coordArrayFromSet(
        state.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          deselect: false,
          selectProperties: { ...state.selectProperties },
          maskArray,
        },
      })
      //TODO: constrain fill tool and vector tools to mask
      break
    case "pointerout":
      //1. create clip mask using drag origin and last x/y as opposite corners of rectangle
      break
    default:
    //do nothing
  }
}

export const select = {
  name: "select",
  fn: selectSteps,
  brushSize: 1,
  brushType: "circle",
  disabled: false,
  options: { magicWand: false },
  modes: {},
  type: "raster",
  cursor: "default",
  activeCursor: "default",
}
