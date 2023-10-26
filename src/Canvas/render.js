import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"

/**
 * Draw the canvas layers
 * @param {CanvasRenderingContext2D} ctx
 * @param {Function} renderPreview
 */
function drawLayers(ctx, renderPreview) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  ctx.clip()
  canvas.layers.forEach((layer) => {
    if (!layer.removed && !layer.hidden) {
      if (layer.type === "reference") {
        ctx.globalAlpha = layer.opacity
        //layer.x, layer.y need to be normalized to the pixel grid
        ctx.drawImage(
          layer.img,
          canvas.xOffset +
            (layer.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.yOffset +
            (layer.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          layer.img.width * layer.scale,
          layer.img.height * layer.scale
        )
      } else {
        ctx.globalAlpha = layer.opacity
        let drawCVS = layer.cvs
        if (layer === canvas.currentLayer && renderPreview) {
          //render preview of action
          canvas.previewCTX.clearRect(
            0,
            0,
            canvas.previewCVS.width,
            canvas.previewCVS.height
          )
          canvas.previewCTX.drawImage(
            layer.cvs,
            0,
            0,
            layer.cvs.width,
            layer.cvs.height
          )
          renderPreview(canvas.previewCTX) //Pass function through to here so it can be actionLine or other actions with multiple points
          drawCVS = canvas.previewCVS
        }
        //layer.x, layer.y need to be normalized to the pixel grid
        ctx.drawImage(
          drawCVS,
          canvas.xOffset,
          // + (layer.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.yOffset,
          // + (layer.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
      }
    }
  })
  ctx.restore()
}

/**
 * Redraw all timeline actions
 * Critical function for the timeline to work
 * @param {Integer} index - optional parameter to limit render up to a specific action
 */
function redrawTimelineActions(index = null) {
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (index && i > index) {
      return
    }
    i++
    if (!action.hidden && !action.removed) {
      switch (action.tool.name) {
        case "modify":
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
          const seen = action.properties.maskSet
            ? new Set(action.properties.maskSet)
            : new Set()
          let previousX = action.properties.points[0].x
          let previousY = action.properties.points[0].y
          let brushDirection = "0,0"
          for (const p of action.properties.points) {
            brushDirection = calculateBrushDirection(
              p.x,
              p.y,
              previousX,
              previousY
            )
            action.tool.action(
              p.x,
              p.y,
              p.color,
              p.brushStamp,
              brushDirection,
              p.brushSize,
              action.layer,
              action.layer.ctx,
              action.mode,
              seen,
              null,
              false
            )
            previousX = p.x
            previousY = p.y
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
          //actionFill
          action.tool.action(
            action.properties.vectorProperties.px1,
            action.properties.vectorProperties.py1,
            action.color,
            action.layer,
            action.mode,
            action.properties.selectProperties,
            action.properties.maskSet
          )
          break
        case "line":
          //actionLine
          action.tool.action(
            action.properties.px1,
            action.properties.py1,
            action.properties.px2,
            action.properties.py2,
            action.color,
            action.layer,
            action.layer.ctx,
            action.mode,
            action.brushStamp,
            action.brushSize
          )
          break
        case "quadCurve":
          //actionQuadraticCurve
          action.tool.action(
            action.properties.vectorProperties.px1,
            action.properties.vectorProperties.py1,
            action.properties.vectorProperties.px2,
            action.properties.vectorProperties.py2,
            action.properties.vectorProperties.px3,
            action.properties.vectorProperties.py3,
            3,
            action.color,
            action.layer,
            action.layer.ctx,
            action.mode,
            action.brushStamp,
            action.brushSize
          )
          break
        case "cubicCurve":
          //TODO: pass source on history objects to avoid debugging actions from the timeline unless desired
          //actionCubicCurve
          action.tool.action(
            action.properties.vectorProperties.px1,
            action.properties.vectorProperties.py1,
            action.properties.vectorProperties.px2,
            action.properties.vectorProperties.py2,
            action.properties.vectorProperties.px3,
            action.properties.vectorProperties.py3,
            action.properties.vectorProperties.px4,
            action.properties.vectorProperties.py4,
            4,
            action.color,
            action.layer,
            action.layer.ctx,
            action.mode,
            action.brushStamp,
            action.brushSize
          )
          break
        case "ellipse":
          //actionEllipse
          action.tool.action(
            action.properties.vectorProperties.px1,
            action.properties.vectorProperties.py1,
            action.properties.vectorProperties.px2,
            action.properties.vectorProperties.py2,
            action.properties.vectorProperties.px3,
            action.properties.vectorProperties.py3,
            action.properties.vectorProperties.radA,
            action.properties.vectorProperties.radB,
            action.properties.vectorProperties.forceCircle,
            action.color,
            action.layer,
            action.layer.ctx,
            action.mode,
            action.brushStamp,
            action.brushSize,
            action.properties.vectorProperties.angle,
            action.properties.vectorProperties.offset,
            action.properties.vectorProperties.x1Offset,
            action.properties.vectorProperties.y1Offset
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
        canvas.currentLayer = dom.layersContainer.children[0].layerObj
      }
      renderLayersToDOM()
      renderVectorsToDOM()
    }
  })
}

/**
 * Draw canvas layers onto onscreen canvas
 * TODO: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
 * @param {Function} renderPreview
 */
function drawCanvasLayers(renderPreview) {
  //clear canvas
  canvas.onScreenCTX.clearRect(
    0,
    0,
    canvas.onScreenCVS.width / canvas.zoom,
    canvas.onScreenCVS.height / canvas.zoom
  )
  //Prevent blurring
  canvas.onScreenCTX.imageSmoothingEnabled = false
  //fill background with neutral gray
  canvas.onScreenCTX.fillStyle = canvas.bgColor
  canvas.onScreenCTX.fillRect(
    0,
    0,
    canvas.onScreenCVS.width / canvas.zoom,
    canvas.onScreenCVS.height / canvas.zoom
  )
  //BUG: How to mask outside drawing space?
  //clear drawing space
  canvas.onScreenCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  drawLayers(canvas.onScreenCTX, renderPreview)
  //draw border
  canvas.onScreenCTX.beginPath()
  canvas.onScreenCTX.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
    canvas.offScreenCVS.width + 2,
    canvas.offScreenCVS.height + 2
  )
  canvas.onScreenCTX.lineWidth = 2
  canvas.onScreenCTX.strokeStyle = canvas.borderColor
  canvas.onScreenCTX.stroke()
}

/**
 * Render canvas entirely including all actions in timeline
 * @param {Function} renderPreview
 * @param {Boolean} clearCanvas - pass true if the canvas needs to be cleared before rendering
 * @param {Boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {Integer} index - optional parameter to limit render up to a specific action
 */
export function renderCanvas(
  renderPreview = null,
  clearCanvas = false,
  redrawTimeline = false,
  index = null
) {
  // window.requestAnimationFrame(() => {
  // let begin = performance.now()
  if (clearCanvas) {
    //clear offscreen layers
    canvas.layers.forEach((l) => {
      if (l.type === "raster") {
        l.ctx.clearRect(
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
      }
    })
  }
  if (redrawTimeline) {
    //render all previous actions
    redrawTimelineActions(index)
  }
  //draw onto onscreen canvas
  drawCanvasLayers(renderPreview)
  // let end = performance.now()
  // console.log(end - begin)
  // })
}
