import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { getAngle } from "../utils/trig.js"

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
    if (!action.removed && !action.layer?.removed) {
      if (action.tool.type === "vector") {
        action.index = state.undoStack.indexOf(action) //change forEach to use i so this indexOf won't be needed
        let vectorElement = document.createElement("div")
        vectorElement.className = `vector ${action.index}`
        vectorElement.id = action.index
        dom.vectorsThumbnails.appendChild(vectorElement)
        canvas.thumbnailCTX.clearRect(
          0,
          0,
          canvas.thumbnailCVS.width,
          canvas.thumbnailCVS.height
        )
        //TODO: find a way to constrain coordinates to fit canvas viewing area for maximum size of vector without changing the size of the canvas for each vector thumbnail
        // Save minima and maxima for x and y plotted coordinates to get the bounding box when plotting the curve. Then, here we can constrain the coords to fit a maximal bounding box in the thumbnail canvas
        canvas.thumbnailCTX.lineWidth = 2
        let border = 32
        let wd =
          canvas.thumbnailCVS.width /
          canvas.sharpness /
          (canvas.offScreenCVS.width + border)
        let hd =
          canvas.thumbnailCVS.height /
          canvas.sharpness /
          (canvas.offScreenCVS.height + border)
        //get the minimum dimension ratio
        let minD = Math.min(wd, hd)
        let xOffset =
          (canvas.thumbnailCVS.width / 2 -
            (minD * canvas.offScreenCVS.width * canvas.sharpness) / 2) /
          canvas.sharpness
        let yOffset =
          (canvas.thumbnailCVS.height / 2 -
            (minD * canvas.offScreenCVS.height * canvas.sharpness) / 2) /
          canvas.sharpness
        if (action.index === canvas.currentVectorIndex) {
          canvas.thumbnailCTX.fillStyle = "rgb(0, 0, 0)"
        } else {
          canvas.thumbnailCTX.fillStyle = "rgb(51, 51, 51)"
        }
        canvas.thumbnailCTX.fillRect(
          0,
          0,
          canvas.thumbnailCVS.width,
          canvas.thumbnailCVS.height
        )
        canvas.thumbnailCTX.clearRect(
          xOffset,
          yOffset,
          minD * canvas.offScreenCVS.width,
          minD * canvas.offScreenCVS.height
        )
        // thumbnailCTX.strokeStyle = action.color.color
        canvas.thumbnailCTX.strokeStyle = "black"
        canvas.thumbnailCTX.beginPath()
        //TODO: line tool to be added as vectors. Behavior of replace tool is like a mask, so the replaced pixels are static coordinates.
        if (action.tool.name === "fill") {
          canvas.thumbnailCTX.arc(
            minD * action.properties.vectorProperties.px1 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py1 + 0.5 + yOffset,
            1,
            0,
            2 * Math.PI,
            true
          )
        } else if (action.tool.name === "quadCurve") {
          canvas.thumbnailCTX.moveTo(
            minD * action.properties.vectorProperties.px1 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py1 + 0.5 + yOffset
          )
          canvas.thumbnailCTX.quadraticCurveTo(
            minD * action.properties.vectorProperties.px3 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py3 + 0.5 + yOffset,
            minD * action.properties.vectorProperties.px2 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py2 + 0.5 + yOffset
          )
        } else if (action.tool.name === "cubicCurve") {
          canvas.thumbnailCTX.moveTo(
            minD * action.properties.vectorProperties.px1 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py1 + 0.5 + yOffset
          )
          canvas.thumbnailCTX.bezierCurveTo(
            minD * action.properties.vectorProperties.px3 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py3 + 0.5 + yOffset,
            minD * action.properties.vectorProperties.px4 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py4 + 0.5 + yOffset,
            minD * action.properties.vectorProperties.px2 + 0.5 + xOffset,
            minD * action.properties.vectorProperties.py2 + 0.5 + yOffset
          )
        } else if (action.tool.name === "ellipse") {
          let angle = getAngle(
            action.properties.vectorProperties.px2 -
              action.properties.vectorProperties.px1,
            action.properties.vectorProperties.py2 -
              action.properties.vectorProperties.py1
          )
          canvas.thumbnailCTX.ellipse(
            minD * action.properties.vectorProperties.px1 + xOffset,
            minD * action.properties.vectorProperties.py1 + yOffset,
            minD * action.properties.vectorProperties.radA,
            minD * action.properties.vectorProperties.radB,
            angle,
            0,
            2 * Math.PI
          )
        }
        canvas.thumbnailCTX.globalCompositeOperation = "xor"
        canvas.thumbnailCTX.stroke()
        let thumb = new Image()
        thumb.src = canvas.thumbnailCVS.toDataURL()
        thumb.alt = `thumb ${action.index}`
        // vectorElement.appendChild(thumbnailCVS)
        vectorElement.appendChild(thumb)
        let tool = document.createElement("div")
        tool.className = "tool"
        let icon = document.createElement("div")
        icon.className = action.tool.name
        if (action.index === canvas.currentVectorIndex) {
          tool.style.background = "rgb(255, 255, 255)"
          vectorElement.style.background = "rgb(0, 0, 0)"
        } else {
          vectorElement.style.background = "rgb(51, 51, 51)"
        }
        tool.appendChild(icon)
        vectorElement.appendChild(tool)
        let color = document.createElement("div") //TODO: make clickable and color can be rechosen via colorpicker
        color.className = "actionColor"
        // color.style.background = action.color.color
        let colorSwatch = document.createElement("div")
        colorSwatch.className = "swatch"
        colorSwatch.style.background = action.color.color
        color.appendChild(colorSwatch)
        vectorElement.appendChild(color)
        //TODO: add mask toggle for turning on/off the mask that existed when starting the fill action
        let hide = document.createElement("div")
        hide.className = "hide"
        let hideIcon = document.createElement("div")
        hideIcon.className = "eye"
        hide.appendChild(hideIcon)
        if (action.hidden) {
          hideIcon.classList.add("eyeclosed")
        } else {
          hideIcon.classList.add("eyeopen")
        }
        vectorElement.appendChild(hide)
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
        vectorElement.vectorObj = action
      }
    }
  })
}

//TODO: need edit mode, generate palette from canvas, remove mode
export function renderPaletteToDOM() {
  dom.paletteColors.innerHTML = ""
  for (let i = 0; i < swatches.palette.length; i++) {
    let paletteColor = document.createElement("div")
    paletteColor.className = "palette-color"
    if (swatches.palette[i].color === swatches.primary.color.color) {
      paletteColor.classList.add("selected")
      swatches.selectedPaletteIndex = i
    }
    let swatch = document.createElement("div")
    swatch.className = "swatch"
    swatch.style.background = swatches.palette[i].color
    paletteColor.appendChild(swatch)
    dom.paletteColors.appendChild(paletteColor)

    //associate object
    swatch.color = swatches.palette[i]
  }
  // Create add color button
  let addColorBtn = document.createElement("div")
  addColorBtn.className = "add-color"
  let icon = document.createElement("div")
  icon.className = "icon"
  addColorBtn.appendChild(icon)
  dom.paletteColors.appendChild(addColorBtn)
}
