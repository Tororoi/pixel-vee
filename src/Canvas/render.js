import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { renderLayersToDOM } from "../DOM/renderLayers.js"
import { renderVectorsToDOM } from "../DOM/renderVectors.js"

function drawLayers(ctx, renderPreview) {
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      if (l.type === "reference") {
        ctx.save()
        ctx.globalAlpha = l.opacity
        //l.x, l.y need to be normalized to the pixel grid
        ctx.drawImage(
          l.img,
          canvas.xOffset +
            (l.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.yOffset +
            (l.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          l.img.width * l.scale,
          l.img.height * l.scale
        )
        ctx.restore()
      } else {
        ctx.save()
        ctx.globalAlpha = l.opacity
        let drawCVS = l.cvs
        if (l === canvas.currentLayer && renderPreview) {
          //render preview of action
          canvas.previewCTX.clearRect(
            0,
            0,
            canvas.previewCVS.width,
            canvas.previewCVS.height
          )
          canvas.previewCTX.drawImage(l.cvs, 0, 0, l.cvs.width, l.cvs.height)
          renderPreview(canvas.previewCTX) //Pass function through to here so it can be actionLine or other actions with multiple points
          drawCVS = canvas.previewCVS
        }
        //l.x, l.y need to be normalized to the pixel grid
        ctx.drawImage(
          drawCVS,
          canvas.xOffset +
            (l.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.yOffset +
            (l.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
        ctx.restore()
      }
    }
  })
}

/**
 *
 * @param {*} index - optional parameter to limit render up to a specific action
 */
function redrawTimelineActions(index = null) {
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (index && i > index) {
      return
    }
    i++
    let imageData = null //for inject actions getImageData of currently assembled layer canvas
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
          // p.layer.removed = false
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
          //Since this action marks all actions on its layer as removed, no need to clear the canvas here anymore
          // p.layer.ctx.clearRect(
          //   0,
          //   0,
          //   canvas.offScreenCVS.width,
          //   canvas.offScreenCVS.height
          // )
          break
        case "brush":
          //actionDraw
          // const seen = new Set()
          const seen = action.properties.maskSet
            ? new Set(action.properties.maskSet)
            : new Set()
          for (const p of action.properties.points) {
            action.tool.action(
              p.x,
              p.y,
              p.color,
              p.brushStamp,
              p.brushSize,
              action.layer.ctx,
              action.mode,
              seen
            )
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
        case "replace":
          //IMPORTANT:
          //Any replaced pixels over previous vectors would be fully rasterized.
          //actionDraw
          const replaceSeen = new Set(action.properties.maskSet)
          action.properties.points.forEach((p) => {
            action.tool.action(
              p.x,
              p.y,
              p.color,
              p.brushStamp,
              p.brushSize,
              action.layer.ctx,
              action.mode,
              replaceSeen
            )
          })
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

//FIX: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
//Draw Canvas
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
 * @param {boolean} clearCanvas - pass true if the canvas needs to be cleared before rendering
 * @param {boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {*} index - optional parameter to limit render up to a specific action
 */
export function renderCanvas(
  renderPreview = null,
  clearCanvas = false,
  redrawTimeline = false,
  index = null
) {
  // console.warn("render")
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
