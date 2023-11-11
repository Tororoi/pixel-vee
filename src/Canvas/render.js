import { dom } from "../Context/dom.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"

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
 * Redraw all timeline actions
 * Critical function for the timeline to work
 * @param {Object} layer - optional parameter to limit render to a specific layer
 * @param {Integer} index - optional parameter to limit render up to a specific action
 */
function redrawTimelineActions(layer, index = null) {
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (index && i > index) {
      return
    }
    i++
    //if layer is passed in, only redraw for that layer
    if (layer) {
      if (action.layer !== layer) return
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
          renderLayersToDOM()
          renderVectorsToDOM()
          break
        case "removeLayer":
          action.layer.removed = true
          renderLayersToDOM()
          renderVectorsToDOM()
          break
        case "clear":
          //Since this action marks all actions on its layer as removed, no need to clear the canvas here or do anything else related to rendering
          break
        case "brush":
          //actionDraw
          // let begin = performance.now()

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
            action.tool.action(
              p.x + offsetX,
              p.y + offsetY,
              p.color,
              brushStamps[action.tool.brushType][p.brushSize],
              brushDirection,
              p.brushSize,
              action.layer,
              action.modes,
              mask,
              seen,
              null,
              false
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
          // let end = performance.now()
          // if (action.properties.maskSet) {
          //   console.log(end - begin)
          // }
          break
        case "fill":
          //actionFill
          action.tool.action(
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
          //actionLine
          action.tool.action(
            action.properties.px1 + action.layer.x,
            action.properties.py1 + action.layer.y,
            action.properties.px2 + action.layer.x,
            action.properties.py2 + action.layer.y,
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.brushSize],
            action.brushSize,
            action.properties.maskSet
          )
          break
        case "quadCurve":
          //actionQuadraticCurve
          action.tool.action(
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
            brushStamps[action.tool.brushType][action.brushSize],
            action.brushSize,
            action.properties.maskSet
          )
          break
        case "cubicCurve":
          //actionCubicCurve
          action.tool.action(
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
            brushStamps[action.tool.brushType][action.brushSize],
            action.brushSize,
            action.properties.maskSet
          )
          break
        case "ellipse":
          //actionEllipse
          action.tool.action(
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
            brushStamps[action.tool.brushType][action.brushSize],
            action.brushSize,
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
  })
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
      renderLayersToDOM()
      renderVectorsToDOM()
    }
  })
}

/**
 * Draw canvas layer onto its onscreen canvas
 * @param {Object} layer
 */
function drawCanvasLayer(layer) {
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
 * Render canvas entirely including all actions in timeline
 * @param {Object} currentLayer
 * @param {Boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {Integer} index - optional parameter to limit render up to a specific action
 */
export function renderCanvas(
  currentLayer = null,
  redrawTimeline = false,
  index = null
) {
  // window.requestAnimationFrame(() => {
  // let begin = performance.now()
  if (redrawTimeline) {
    //clear offscreen layers
    if (currentLayer) {
      if (currentLayer.type === "raster") {
        currentLayer.ctx.clearRect(
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
      }
    } else {
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
    //render all previous actions
    redrawTimelineActions(currentLayer, index)
  }
  //draw onto onscreen canvas
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
  if (currentLayer) {
    drawCanvasLayer(currentLayer)
  } else {
    canvas.layers.forEach((layer) => {
      drawCanvasLayer(layer, null)
    })
  }
  // let end = performance.now()
  // console.log(end - begin)
  // })
}
