import { dom } from "../Context/dom.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import {
  actionDraw,
  actionLine,
  actionFill,
  actionEllipse,
  actionQuadraticCurve,
  actionCubicCurve,
} from "../Actions/actions.js"

/**
 * Redraw all timeline actions
 * Critical function for the timeline to work
 * @param {Object} layer - optional parameter to limit render to a specific layer
 * @param {Integer} endIndex - optional parameter to limit render up to a specific action
 * @param {Integer} startIndex - optional parameter to limit render from a specific action
 */
export function redrawTimelineActions(layer, endIndex = null, startIndex = 0) {
  //follows stored instructions to reassemble drawing. Costly operation. Minimize usage as much as possible.
  for (let i = startIndex + 1; i < state.undoStack.length; i++) {
    if (endIndex && i >= endIndex) {
      //render every action up to and not including the action at endIndex
      return
    }
    let action = state.undoStack[i]
    //if layer is passed in, only redraw for that layer
    if (layer) {
      if (action.layer !== layer) continue
    }
    if (!action.hidden && !action.removed) {
      switch (action.tool.name) {
        case "modify":
          //do nothing
          break
        case "changeMode":
          //do nothing
          break
        case "changeColor":
          //do nothing
          break
        case "remove":
          //do nothing
          break
        case "addLayer":
          action.layer.removed = false
          break
        case "removeLayer":
          action.layer.removed = true
          break
        case "clear":
          //Since this action marks all actions on its layer as removed, no need to clear the canvas here or do anything else related to rendering
          break
        case "brush":
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
              brushStamps[action.tool.brushType][p.brushSize][brushDirection],
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
          break
        case "fill":
          actionFill(
            action.properties.vectorProperties.px1 + action.layer.x,
            action.properties.vectorProperties.py1 + action.layer.y,
            action.color,
            action.layer,
            action.modes,
            action.properties.selectProperties, //currently all null
            action.properties.maskSet
          )
          break
        case "line":
          actionLine(
            action.properties.px1 + action.layer.x,
            action.properties.py1 + action.layer.y,
            action.properties.px2 + action.layer.x,
            action.properties.py2 + action.layer.y,
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.properties.maskSet
          )
          break
        case "quadCurve":
          actionQuadraticCurve(
            action.properties.vectorProperties.px1 + action.layer.x,
            action.properties.vectorProperties.py1 + action.layer.y,
            action.properties.vectorProperties.px2 + action.layer.x,
            action.properties.vectorProperties.py2 + action.layer.y,
            action.properties.vectorProperties.px3 + action.layer.x,
            action.properties.vectorProperties.py3 + action.layer.y,
            3,
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.properties.maskSet
          )
          break
        case "cubicCurve":
          actionCubicCurve(
            action.properties.vectorProperties.px1 + action.layer.x,
            action.properties.vectorProperties.py1 + action.layer.y,
            action.properties.vectorProperties.px2 + action.layer.x,
            action.properties.vectorProperties.py2 + action.layer.y,
            action.properties.vectorProperties.px3 + action.layer.x,
            action.properties.vectorProperties.py3 + action.layer.y,
            action.properties.vectorProperties.px4 + action.layer.x,
            action.properties.vectorProperties.py4 + action.layer.y,
            4,
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.properties.maskSet
          )
          break
        case "ellipse":
          actionEllipse(
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
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.properties.vectorProperties.angle,
            action.properties.vectorProperties.offset,
            action.properties.vectorProperties.x1Offset,
            action.properties.vectorProperties.y1Offset,
            action.properties.maskSet
          )
          break
        default:
        //do nothing
      }
    }
  }
  state.redoStack.forEach((action) => {
    if (action.tool.name === "addLayer") {
      action.layer.removed = true
      if (action.layer === canvas.currentLayer) {
        canvas.currentLayer.inactiveTools.forEach((tool) => {
          dom[`${tool}Btn`].disabled = false
        })
        canvas.currentLayer = canvas.layers.find(
          (layer) => layer.type === "raster" && layer.removed === false
        )
        canvas.currentLayer.inactiveTools.forEach((tool) => {
          dom[`${tool}Btn`].disabled = true
        })
      }
    }
  })
  renderLayersToDOM()
  renderVectorsToDOM()
}

/**
 * Draw the canvas layers
 * @param {Object} layer
 */
function drawLayer(layer) {
  layer.onscreenCtx.save()

  if (!layer.removed && !layer.hidden) {
    if (layer.type === "reference") {
      layer.onscreenCtx.globalAlpha = layer.opacity
      //layer.x, layer.y need to be normalized to the pixel grid
      layer.onscreenCtx.drawImage(
        layer.img,
        canvas.xOffset +
          (layer.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        canvas.yOffset +
          (layer.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        layer.img.width * layer.scale,
        layer.img.height * layer.scale
      )
    } else {
      layer.onscreenCtx.beginPath()
      layer.onscreenCtx.rect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      layer.onscreenCtx.clip()
      layer.onscreenCtx.globalAlpha = layer.opacity
      layer.onscreenCtx.drawImage(
        layer.cvs,
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  }
  layer.onscreenCtx.restore()
}

/**
 * Draw canvas layer onto its onscreen canvas
 * @param {Object} layer
 */
export function drawCanvasLayer(layer) {
  //Prevent blurring
  layer.onscreenCtx.imageSmoothingEnabled = false
  //clear onscreen canvas
  layer.onscreenCtx.clearRect(
    0,
    0,
    layer.onscreenCvs.width / canvas.zoom,
    layer.onscreenCvs.height / canvas.zoom
  )
  drawLayer(layer)
  //draw border
  layer.onscreenCtx.beginPath()
  layer.onscreenCtx.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
    canvas.offScreenCVS.width + 2,
    canvas.offScreenCVS.height + 2
  )
  layer.onscreenCtx.lineWidth = 2
  layer.onscreenCtx.strokeStyle = canvas.borderColor
  layer.onscreenCtx.stroke()
}

/**
 * Render background canvas
 */
function renderBackgroundCanvas() {
  //clear canvas
  canvas.backgroundCTX.clearRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom
  )
  //fill background with neutral gray
  canvas.backgroundCTX.fillStyle = canvas.bgColor
  canvas.backgroundCTX.fillRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom
  )
  //clear drawing space
  canvas.backgroundCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
}

/**
 * Clear offscreen canvas layers as needed
 * @param {Object} activeLayer
 */
function clearOffscreenCanvas(activeLayer = null) {
  if (activeLayer) {
    //clear one offscreen layer
    if (activeLayer.type === "raster") {
      activeLayer.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  } else {
    //clear all offscreen layers
    canvas.layers.forEach((layer) => {
      if (layer.type === "raster") {
        layer.ctx.clearRect(
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
      }
    })
  }
}

/**
 * Render canvas entirely including all actions in timeline
 * @param {Object} activeLayer
 * @param {Boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {Integer} index - optional parameter to limit render up to a specific action
 */
export function renderCanvas(
  activeLayer = null,
  redrawTimeline = false,
  index = null
) {
  // window.requestAnimationFrame(() => {
  // let begin = performance.now()
  if (redrawTimeline) {
    //clear offscreen layers
    clearOffscreenCanvas(activeLayer)
    //render all previous actions
    redrawTimelineActions(activeLayer, index)
  }
  //render background canvas
  renderBackgroundCanvas()
  //draw onto onscreen canvas
  if (activeLayer) {
    drawCanvasLayer(activeLayer)
  } else {
    canvas.layers.forEach((layer) => {
      drawCanvasLayer(layer, null)
    })
  }
  // let end = performance.now()
  // console.log(end - begin)
  // })
}

/**
 * Render previous actions to preview canvas
 * TODO: Instead of setting onto previewCVS, set save an image and attach it to actions.
 * When performing undo, intead of rerendering all previous actions,
 * just draw the image of the affected layer that was saved before the action being undone.
 * This will require saving an image with every action and updating images for modified actions.
 * The result will be that redrawing the entire timeline will rarely need to be done and vector modifications will be much more efficient.
 * @param {Object} layer
 */
export function setHistoricalPreview(layer) {
  //render all previous actions
  layer.ctx.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  //provide start index and end index to limit render to a specific range of actions. Actions at start and end will not be rendered.
  redrawTimelineActions(layer, canvas.currentVectorIndex)
  canvas.previewCTX.clearRect(
    0,
    0,
    canvas.previewCVS.width,
    canvas.previewCVS.height
  )
  //image of previous actions saved to preview canvas to prevent unecessary rerendering
  canvas.previewCTX.drawImage(layer.cvs, 0, 0)
}

/**
 *
 * @param {Object} layer
 * @param {Function} previewAction
 */
export function renderPreviewAction(layer, previewAction) {
  //put preview canvas onto offscreen canvas
  layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)
  layer.ctx.drawImage(canvas.previewCVS, 0, 0)
  //render preview fill
  previewAction()
  //render actions from currentVectorIndex to end of timeline
  redrawTimelineActions(layer, null, canvas.currentVectorIndex)
  //render to onscreen canvas
  drawCanvasLayer(layer)
}
