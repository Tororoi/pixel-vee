import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { renderCanvas } from "../Canvas/render.js"
import { brushStamps } from "../Context/brushStamps.js"
import { storedActions } from "./storedActions.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"

export function testEllipseAction() {
  let brushSize = tools.ellipse.brushSize
  const action = storedActions.ellipse
  let begin = performance.now()
  tools[action.tool.name].action(
    action.properties.vectorProperties.px1 + action.layer.x,
    action.properties.vectorProperties.py1 + action.layer.y,
    action.properties.vectorProperties.px2 + action.layer.x,
    action.properties.vectorProperties.py2 + action.layer.y,
    action.properties.vectorProperties.px3 + action.layer.x,
    action.properties.vectorProperties.py3 + action.layer.y,
    action.properties.vectorProperties.radA,
    action.properties.vectorProperties.radB,
    action.properties.vectorProperties.forceCircle,
    action.color,
    action.layer,
    action.modes,
    brushStamps[action.tool.brushType][brushSize],
    brushSize,
    action.properties.vectorProperties.angle,
    action.properties.vectorProperties.offset,
    action.properties.vectorProperties.x1Offset,
    action.properties.vectorProperties.y1Offset,
    action.properties.maskSet
  )
  let end = performance.now()
  console.log(`Ellipse Action: ${Math.round((end - begin) * 10000) / 10000}ms`)
  renderCanvas(action.layer)
}

/**
 * Save current action as a test that can be repeated exactly
 */
export function saveEllipseAsTest(points) {
  console.log("render points", points.length)
  if (points.length === 1000 && canvas.pointerEvent === "pointermove") {
    console.log("save ellipse as test")
    let maskArray = coordArrayFromSet(
      state.maskSet,
      canvas.currentLayer.x,
      canvas.currentLayer.y
    )
    let testAction = {
      tool: { ...tools.ellipse },
      modes: { ...tools.ellipse.modes },
      color: { ...swatches.primary.color },
      layer: canvas.currentLayer,
      properties: {
        vectorProperties: {
          px1: state.vectorProperties.px1 - canvas.currentLayer.x,
          py1: state.vectorProperties.py1 - canvas.currentLayer.y,
          px2: state.vectorProperties.px2 - canvas.currentLayer.x,
          py2: state.vectorProperties.py2 - canvas.currentLayer.y,
          px3: state.vectorProperties.px3 - canvas.currentLayer.x,
          py3: state.vectorProperties.py3 - canvas.currentLayer.y,
          radA: state.vectorProperties.radA,
          radB: state.vectorProperties.radB,
          angle: state.vectorProperties.angle,
          offset: state.vectorProperties.offset,
          x1Offset: state.vectorProperties.x1Offset,
          y1Offset: state.vectorProperties.y1Offset,
          forceCircle: state.vectorProperties.forceCircle,
          //add bounding box minima maxima x and y?
        },
        maskSet: state.maskSet,
        maskArray,
      },
    }
    storedActions.ellipse = testAction
  }
}
