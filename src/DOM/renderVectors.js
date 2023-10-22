import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { getAngle } from "../utils/trig.js"

export const renderVectorsToDOM = () => {
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
