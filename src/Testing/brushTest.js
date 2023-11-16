import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { renderCanvas } from "../Canvas/render.js"
import { brushStamps } from "../Context/brushStamps.js"
import { storedActions } from "./storedActions.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"

export function testBrushAction() {
  let brushSize = tools.brush.brushSize
  const action = storedActions.brush
  let begin = performance.now()
  const offsetX = action.layer.x
  const offsetY = action.layer.y

  let seen = new Set()
  let mask = null
  if (action.properties.maskSet) {
    if (offsetX !== 0 || offsetY !== 0) {
      mask = new Set(
        action.properties.maskArray.map(
          (coord) => `${coord.x + offsetX},${coord.y + offsetY}`
        )
      )
    } else {
      mask = new Set(action.properties.maskSet)
    }
  }
  let previousX = action.properties.points[0].x + offsetX
  let previousY = action.properties.points[0].y + offsetY
  let brushDirection = "0,0"
  for (const p of action.properties.points) {
    brushDirection = calculateBrushDirection(
      p.x + offsetX,
      p.y + offsetY,
      previousX,
      previousY
    )
    tools[action.tool.name].action(
      p.x + offsetX,
      p.y + offsetY,
      p.color,
      brushStamps[action.tool.brushType][brushSize][brushDirection],
      brushSize,
      action.layer,
      action.modes,
      mask,
      seen
    )
    previousX = p.x + offsetX
    previousY = p.y + offsetY
    //If points are saved as individual pixels instead of the cursor points so that the brushStamp does not need to be iterated over, it is much faster:
    // action.layer.ctx.fillStyle = p.color
    // let x = p.x
    // let y = p.y
    // const key = `${x},${y}`
    // if (!seen.has(key)) {
    //   seen.add(key)
    //   switch (action.mode) {
    //     case "erase":
    //       action.layer.ctx.clearRect(x, y, 1, 1)
    //       break
    //     case "inject":
    //       action.layer.ctx.clearRect(x, y, 1, 1)
    //       action.layer.ctx.fillRect(x, y, 1, 1)
    //       break
    //     default:
    //       action.layer.ctx.fillRect(x, y, 1, 1)
    //   }
    // }
  }
  let end = performance.now()
  console.log(`Brush Action: ${Math.round((end - begin) * 10000) / 10000}ms`)
  renderCanvas(action.layer)
}

/**
 * Save current action as a test that can be repeated exactly
 */
export function saveBrushAsTest() {
  if (state.points.length === state.testNumPoints) {
    console.log("save brush as test")
    let maskArray = coordArrayFromSet(
      state.maskSet,
      canvas.currentLayer.x,
      canvas.currentLayer.y
    )
    let testAction = {
      tool: { ...tools.brush },
      modes: { ...tools.brush.modes },
      color: { ...swatches.primary.color },
      layer: canvas.currentLayer,
      properties: {
        points: [...state.points],
        maskSet: state.maskSet,
        maskArray,
      },
    }
    storedActions.brush = testAction
    // // Save data
    // let jsonString = JSON.stringify(testAction, null, 2)
    // //TODO: instead of opening in a new window, save to special testing object
    // // Create a new Blob with the JSON data and the correct MIME type
    // const blob = new Blob([jsonString], { type: "application/json" })

    // // Create a URL for the Blob
    // const blobUrl = URL.createObjectURL(blob)

    // // Open the URL in a new tab/window
    // window.open(blobUrl)
  }
}
