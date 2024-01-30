import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { createRasterLayer, createReferenceLayer } from "../Canvas/layers.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { cutSelectedPixels, pasteSelectedPixels } from "../Menu/edit.js"

//=============================================//
//====== * * * Non Pointer Actions * * * ======//
//=============================================//

//=============================================//
//=========== * * * Selection * * * ===========//
//=============================================//

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
  vectorGui.render()
}

/**
 * Cut Selection
 * Not dependent on pointer events
 */
export function actionCutSelection() {
  if (
    canvas.currentLayer.type === "raster" &&
    state.boundaryBox.xMax !== null
  ) {
    cutSelectedPixels()
    //correct boundary box for layer offset
    const boundaryBox = { ...state.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= canvas.currentLayer.x
      boundaryBox.xMax -= canvas.currentLayer.x
      boundaryBox.yMin -= canvas.currentLayer.y
      boundaryBox.yMax -= canvas.currentLayer.y
    }
    addToTimeline({
      tool: tools.cut,
      layer: canvas.currentLayer,
      properties: {
        selectionInversed: state.selectionInversed,
        boundaryBox,
      },
    })
    state.action = null
    state.redoStack = []
    renderCanvas(canvas.currentLayer)
    vectorGui.render()
  }
}

/**
 * Paste Selection
 * Not dependent on pointer events
 */
export function actionPasteSelection() {
  if (canvas.currentLayer.type === "raster" && state.selectClipboard.canvas) {
    pasteSelectedPixels()
    //correct boundary box for layer offset
    const boundaryBox = { ...state.selectClipboard.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= canvas.currentLayer.x
      boundaryBox.xMax -= canvas.currentLayer.x
      boundaryBox.yMin -= canvas.currentLayer.y
      boundaryBox.yMax -= canvas.currentLayer.y
    }
    addToTimeline({
      tool: tools.paste,
      layer: canvas.currentLayer,
      properties: {
        canvas: state.selectClipboard.canvas,
        boundaryBox,
      },
    })
    state.action = null
    state.redoStack = []
    renderCanvas(canvas.currentLayer)
    vectorGui.render()
  }
}

//=============================================//
//============ * * * Layers * * * =============//
//=============================================//

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
        const layer = createReferenceLayer(img)
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
  const layer = createRasterLayer()
  canvas.layers.push(layer)
  addToTimeline({
    tool: tools.addLayer,
    layer,
  })
  state.action = null
  state.redoStack = []
  renderLayersToDOM()
}

// /**
//  * Add layer
//  * Add a new preview layer - used for pasting and dragging
//  */
// export function addPreviewLayer() {
//   //once layer is added to timeline and drawn on, can no longer be deleted
//   const layer = createRasterLayer("preview")
//   canvas.layers.push(layer)
//   addToTimeline({
//     tool: tools.addLayer,
//     layer,
//   })
//   state.action = null
//   state.redoStack = []
// }

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
