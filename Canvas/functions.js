function drawLayers(canvas, ctx) {
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
        //l.x, l.y need to be normalized to the pixel grid
        ctx.drawImage(
          l.cvs,
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

//FIX: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
//Draw Canvas
export function draw(canvas) {
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
  drawLayers(canvas, canvas.onScreenCTX)
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
 *
 * @param {*} index - optional parameter to limit render up to a specific action
 */
export function redrawPoints(state, canvas, index = null) {
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (index && i > index) {
      return
    }
    i++
    action.forEach((p) => {
      if (!p.hidden && !p.removed) {
        //TODO: add action function to p in addToTimeline
        switch (p.tool.name) {
          case "modify":
            //do nothing
            break
          case "remove":
            //do nothing
            break
          case "addLayer":
            p.layer.removed = false
            canvas.renderLayersToDOM()
            canvas.renderVectorsToDOM()
            break
          case "removeLayer":
            p.layer.removed = true
            canvas.renderLayersToDOM()
            canvas.renderVectorsToDOM()
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
          case "fill":
            //actionFill
            p.tool.action(
              p.properties.px1,
              p.properties.py1,
              p.color,
              p.layer.ctx,
              p.mode
            )
            break
          case "line":
            //actionLine
            p.tool.action(
              p.properties.px1,
              p.properties.py1,
              p.properties.px2,
              p.properties.py2,
              p.color,
              p.layer.ctx,
              p.mode,
              p.brush,
              p.weight
            )
            break
          case "quadCurve":
            //actionQuadraticCurve
            p.tool.action(
              p.properties.px1,
              p.properties.py1,
              p.properties.px2,
              p.properties.py2,
              p.properties.px3,
              p.properties.py3,
              3,
              p.color,
              p.layer.ctx,
              p.mode,
              p.brush,
              p.weight
            )
            break
          case "cubicCurve":
            //TODO: pass source on history objects to avoid debugging actions from the timeline unless desired
            //actionCubicCurve
            p.tool.action(
              p.properties.px1,
              p.properties.py1,
              p.properties.px2,
              p.properties.py2,
              p.properties.px3,
              p.properties.py3,
              p.properties.px4,
              p.properties.py4,
              4,
              p.color,
              p.layer.ctx,
              p.mode,
              p.brush,
              p.weight
            )
            break
          case "ellipse":
            //actionEllipse
            p.tool.action(
              p.properties.px1,
              p.properties.py1,
              p.properties.px2,
              p.properties.py2,
              p.properties.px3,
              p.properties.py3,
              p.properties.radA,
              p.properties.radB,
              p.properties.forceCircle,
              p.color,
              p.layer.ctx,
              p.mode,
              p.brush,
              p.weight,
              p.properties.angle,
              p.properties.offset,
              p.properties.x1Offset,
              p.properties.y1Offset
            )
            break
          case "replace":
            //IMPORTANT:
            //Any replaced pixels over previous vectors would be fully rasterized.
            //Even if image only depicts replaced pixels, those that were replaced cannot be moved if they were part of a vector.
            //maybe a separate tool could exist for replacing vector pixels as a modification of one vector, as if the vector's render acts as a mask.
            //maybe collision detection could be used somehow? probably expensive.
            p.layer.ctx.drawImage(
              p.properties.image,
              0,
              0,
              p.properties.width,
              p.properties.height
            )
            break
          default:
            //actionDraw
            p.tool.action(
              p.x,
              p.y,
              p.color,
              p.brush,
              p.weight,
              p.layer.ctx,
              p.mode
            )
        }
      }
    })
  })
  state.redoStack.forEach((action) => {
    action.forEach((p) => {
      if (p.tool.name === "addLayer") {
        p.layer.removed = true
        if (p.layer === canvas.currentLayer) {
          canvas.currentLayer = layersCont.children[0].layerObj
        }
        canvas.renderLayersToDOM()
        canvas.renderVectorsToDOM()
      }
    })
  })
}

/**
 *
 * @param {*} index - optional parameter to limit render up to a specific action
 */
export function render(state, canvas, index) {
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
  canvas.redrawPoints(state, canvas, index)
  canvas.draw(canvas)
}

export const setInitialZoom = (width) => {
  const ratio = 256 / width
  switch (true) {
    case ratio >= 8:
      return 16
    case ratio >= 4:
      return 8
    case ratio >= 2:
      return 4
    case ratio >= 1:
      return 2
    case ratio >= 0.5:
      return 1
    default:
      return 0.5
  }
}
