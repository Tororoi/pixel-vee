import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { createNewRasterLayer } from "../Canvas/layers.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"

/**
 * Deselect
 * Not dependent on pointer events
 */
export function actionDeselect() {
  // let maskArray = coordArrayFromSet(
  //   state.maskSet,
  //   canvas.currentLayer.x,
  //   canvas.currentLayer.y
  // )
  addToTimeline({
    tool: tools.select,
    layer: canvas.currentLayer,
    properties: {
      deselect: true,
      invertSelection: state.selectionInversed,
      selectProperties: { ...state.selectProperties },
      // maskArray,
    },
  })
  state.action = null
  state.redoStack = []
  state.deselect()
  canvas.rasterGuiCTX.clearRect(
    0,
    0,
    canvas.rasterGuiCVS.width,
    canvas.rasterGuiCVS.height
  )
}

/**
 * Invert Selection
 * Not dependent on pointer events
 */
export function actionInvertSelection() {
  addToTimeline({
    tool: tools.select,
    layer: canvas.currentLayer,
    properties: {
      deselect: false,
      invertSelection: !state.selectionInversed,
      selectProperties: { ...state.selectProperties },
    },
  })
  state.action = null
  state.redoStack = []
  state.invertSelection()
  // vectorGui.render()
}

/**
 * Upload an image and create a new reference layer
 */
export function addReferenceLayer() {
  let reader
  let img = new Image()

  if (this.files && this.files[0]) {
    reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
      img.onload = () => {
        let onscreenLayerCVS = document.createElement("canvas")
        let onscreenLayerCTX = onscreenLayerCVS.getContext("2d", {
          willReadFrequently: true,
        })
        onscreenLayerCVS.className = "onscreen-canvas"
        dom.canvasLayers.insertBefore(
          onscreenLayerCVS,
          dom.canvasLayers.children[0]
        )
        onscreenLayerCVS.width = onscreenLayerCVS.offsetWidth * canvas.sharpness
        onscreenLayerCVS.height =
          onscreenLayerCVS.offsetHeight * canvas.sharpness
        onscreenLayerCTX.setTransform(
          canvas.sharpness * canvas.zoom,
          0,
          0,
          canvas.sharpness * canvas.zoom,
          0,
          0
        )
        //constrain background image to canvas with scale
        let scale =
          canvas.offScreenCVS.width / img.width >
          canvas.offScreenCVS.height / img.height
            ? canvas.offScreenCVS.height / img.height
            : canvas.offScreenCVS.width / img.width //TODO: should be method, not var so width and height can be adjusted without having to set scale again
        let layer = {
          type: "reference",
          title: `Reference ${canvas.layers.length + 1}`,
          img: img,
          dataUrl: img.src,
          onscreenCvs: onscreenLayerCVS,
          onscreenCtx: onscreenLayerCTX,
          x: 0,
          y: 0,
          scale: scale,
          opacity: 1,
          inactiveTools: [
            "brush",
            "fill",
            "line",
            "quadCurve",
            "cubicCurve",
            "ellipse",
            "select",
          ],
          hidden: false,
          removed: false,
        }
        canvas.layers.unshift(layer)
        addToTimeline({
          tool: tools.addLayer,
          layer,
        })
        state.action = null
        state.redoStack = []
        renderLayersToDOM()
        renderCanvas()
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

/**
 * Add layer
 * Add a new raster layer
 */
export function addRasterLayer() {
  //once layer is added to timeline and drawn on, can no longer be deleted
  const layer = createNewRasterLayer(`Layer ${canvas.layers.length + 1}`)
  canvas.layers.push(layer)
  addToTimeline({
    tool: tools.addLayer,
    layer,
  })
  state.action = null
  state.redoStack = []
  renderLayersToDOM()
}

/**
 * Mark a layer as removed
 * @param {Object} layer
 */
export function removeLayer(layer) {
  //set "removed" flag to true on selected layer.
  if (canvas.activeLayerCount > 1 || layer.type !== "raster") {
    layer.removed = true
    if (layer === canvas.currentLayer) {
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
      vectorGui.reset()
    }
    addToTimeline({
      tool: tools.removeLayer,
      layer,
    })
    state.action = null
    state.redoStack = []
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}
