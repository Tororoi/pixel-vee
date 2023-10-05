import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { getAngle } from "../utils/trig.js"

function drawLayers(ctx) {
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
    action.forEach((p) => {
      if (!p.hidden && !p.removed) {
        //TODO: add action function to p in addToTimeline
        switch (p.tool.name) {
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
            p.layer.removed = false
            renderLayersToDOM()
            renderVectorsToDOM()
            break
          case "removeLayer":
            p.layer.removed = true
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
            if (p.mode === "inject") {
              //TODO IN PROGRESS: actionPut requires image data, but we don't want to store a snapshot of the entire canvas (p.imageData) at the time of first render.
              //Instead, we want a snapshot of the canvas during this redraw right before this action
              //Instead of actions being arrays, they should have some properties and one of those properties can be an array of points
              //actionPut
              // p.tool.action(
              //   p.x,
              //   p.y,
              //   p.color,
              //   p.brush,
              //   p.weight,
              //   p.layer.cvs,
              //   p.layer.ctx,
              //   p.mode,
              //   p.imageData
              // )
            } else if (p.mode === "erase") {
              //actionDraw
              p.tool.secondaryAction(
                p.x,
                p.y,
                p.color,
                p.brush,
                p.weight,
                p.layer.ctx,
                p.mode
              )
            } else {
              p.layer.ctx.drawImage(
                p.properties.image,
                0,
                0,
                p.properties.width,
                p.properties.height
              )
            }
            break
          case "fill":
            //actionFill
            p.tool.action(
              p.properties.px1,
              p.properties.py1,
              p.color,
              p.layer,
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
          //do nothing
        }
      }
    })
  })
  state.redoStack.forEach((action) => {
    action.forEach((p) => {
      if (p.tool.name === "addLayer") {
        p.layer.removed = true
        if (p.layer === canvas.currentLayer) {
          canvas.currentLayer = dom.layersContainer.children[0].layerObj
        }
        renderLayersToDOM()
        renderVectorsToDOM()
      }
    })
  })
}

//FIX: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
//Draw Canvas
function drawCanvasLayers() {
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
  drawLayers(canvas.onScreenCTX)
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
  clearCanvas = false,
  redrawTimeline = false,
  index = null
) {
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
  drawCanvasLayers()
}

export function renderLayersToDOM() {
  dom.layersContainer.innerHTML = ""
  let id = 0
  canvas.activeLayerCount = 0
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      canvas.activeLayerCount++
      let layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}`
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.classList.add("selected")
      }
      let hide = document.createElement("div")
      hide.className = "hide"
      if (l.opacity === 0) {
        hide.classList.add("eyeclosed")
      } else {
        hide.classList.add("eyeopen")
      }
      layerElement.appendChild(hide)
      let trash = document.createElement("div") //TODO: make clickable and sets vector action as hidden
      trash.className = "trash"
      let trashIcon = document.createElement("div")
      trashIcon.className = "icon"
      trash.appendChild(trashIcon)
      layerElement.appendChild(trash)
      dom.layersContainer.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })
}

export function renderVectorsToDOM() {
  dom.vectorsThumbnails.innerHTML = ""
  state.undoStack.forEach((action) => {
    let p = action[0]
    if (!p.removed) {
      if (p.tool.type === "vector") {
        p.index = state.undoStack.indexOf(action)
        let vectorElement = document.createElement("div")
        vectorElement.className = `vector ${p.index}`
        vectorElement.id = p.index
        dom.vectorsThumbnails.appendChild(vectorElement)
        vectorElement.draggable = true
        canvas.thumbnailCTX.clearRect(
          0,
          0,
          canvas.thumbnailCVS.width,
          canvas.thumbnailCVS.height
        )
        //TODO: find a way to constrain coordinates to fit canvas viewing area for maximum size of vector without changing the size of the canvas for each vector thumbnail
        // Save minima and maxima for x and y plotted coordinates to get the bounding box when plotting the curve. Then, here we can constrain the coords to fit a maximal bounding box in the thumbnail canvas
        canvas.thumbnailCTX.lineWidth = 2
        let wd =
          canvas.thumbnailCVS.width /
          canvas.sharpness /
          canvas.offScreenCVS.width
        let hd =
          canvas.thumbnailCVS.height /
          canvas.sharpness /
          canvas.offScreenCVS.height
        //get the minimum dimension ratio
        let minD = Math.min(wd, hd)
        // thumbnailCTX.strokeStyle = p.color.color
        canvas.thumbnailCTX.strokeStyle = "black"
        canvas.thumbnailCTX.beginPath()
        //TODO: line tool to be added as vectors. Behavior of replace tool is like a mask, so the replaced pixels are static coordinates.
        if (p.tool.name === "fill") {
          canvas.thumbnailCTX.arc(
            minD * p.properties.px1 + 0.5,
            minD * p.properties.py1 + 0.5,
            1,
            0,
            2 * Math.PI,
            true
          )
        } else if (p.tool.name === "quadCurve") {
          canvas.thumbnailCTX.moveTo(
            minD * p.properties.px1 + 0.5,
            minD * p.properties.py1 + 0.5
          )
          canvas.thumbnailCTX.quadraticCurveTo(
            minD * p.properties.px3 + 0.5,
            minD * p.properties.py3 + 0.5,
            minD * p.properties.px2 + 0.5,
            minD * p.properties.py2 + 0.5
          )
        } else if (p.tool.name === "cubicCurve") {
          canvas.thumbnailCTX.moveTo(
            minD * p.properties.px1 + 0.5,
            minD * p.properties.py1 + 0.5
          )
          canvas.thumbnailCTX.bezierCurveTo(
            minD * p.properties.px3 + 0.5,
            minD * p.properties.py3 + 0.5,
            minD * p.properties.px4 + 0.5,
            minD * p.properties.py4 + 0.5,
            minD * p.properties.px2 + 0.5,
            minD * p.properties.py2 + 0.5
          )
        } else if (p.tool.name === "ellipse") {
          let angle = getAngle(
            p.properties.px2 - p.properties.px1,
            p.properties.py2 - p.properties.py1
          )
          canvas.thumbnailCTX.ellipse(
            minD * p.properties.px1,
            minD * p.properties.py1,
            minD * p.properties.radA,
            minD * p.properties.radB,
            angle,
            0,
            2 * Math.PI
          )
        }
        canvas.thumbnailCTX.stroke()
        if (p.index === canvas.currentVectorIndex) {
          canvas.thumbnailCTX.fillStyle = "rgb(0, 0, 0)"
        } else {
          canvas.thumbnailCTX.fillStyle = "rgb(51, 51, 51)"
        }
        canvas.thumbnailCTX.fillRect(
          minD * canvas.offScreenCVS.width,
          0,
          canvas.thumbnailCVS.width,
          canvas.thumbnailCVS.height
        )
        canvas.thumbnailCTX.fillRect(
          0,
          minD * canvas.offScreenCVS.height,
          canvas.thumbnailCVS.width,
          canvas.thumbnailCVS.height
        )
        let thumb = new Image()
        thumb.src = canvas.thumbnailCVS.toDataURL()
        // vectorElement.appendChild(thumbnailCVS)
        vectorElement.appendChild(thumb)
        let tool = document.createElement("div")
        tool.className = "tool"
        let icon = document.createElement("div")
        icon.className = p.tool.name
        if (p.index === canvas.currentVectorIndex) {
          tool.style.background = "rgb(255, 255, 255)"
          vectorElement.style.background = "rgb(0, 0, 0)"
        } else {
          vectorElement.style.background = "rgb(51, 51, 51)"
        }
        tool.appendChild(icon)
        vectorElement.appendChild(tool)
        let color = document.createElement("div") //TODO: make clickable and color can be rechosen via colorpicker
        color.className = "actionColor"
        // color.style.background = p.color.color
        let colorSwatch = document.createElement("div")
        colorSwatch.className = "swatch"
        colorSwatch.style.background = p.color.color
        color.appendChild(colorSwatch)
        vectorElement.appendChild(color)
        let trash = document.createElement("div") //TODO: make clickable and sets vector action as hidden
        trash.className = "trash"
        let trashIcon = document.createElement("div")
        trashIcon.className = "icon"
        trash.appendChild(trashIcon)
        vectorElement.appendChild(trash)
        // thumbnailCVS.width = thumbnailCVS.offsetWidth * canvas.sharpness
        // thumbnailCVS.height = thumbnailCVS.offsetHeight * canvas.sharpness
        // thumbnailCTX.scale(canvas.sharpness * 1, canvas.sharpness * 1)

        //associate object
        vectorElement.vectorObj = p
      }
    }
  })
}
