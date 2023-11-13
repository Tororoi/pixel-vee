import { canvas } from "../Context/canvas.js"
import { brushAction } from "./brushAction.js"
import { actionDraw } from "../Actions/actions.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { renderCanvas } from "../Canvas/render.js"

export function testBrushAction() {
  const action = brushAction
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
    actionDraw(
      p.x + offsetX,
      p.y + offsetY,
      p.color,
      p.brushStamp[brushDirection],
      p.brushSize,
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
  renderCanvas(canvas.currentLayer)
}
