import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { renderCanvas } from '../Canvas/render.js'
import { vectorGui } from '../GUI/vector.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { transformRasterContent } from '../utils/transformHelpers.js'
import { addTransformToTimeline } from '../Actions/transform/rasterTransform.js'
import { transformBoundaries } from './transform.js'

/**
 * Move the contents of a layer relative to other layers
 */
function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  // move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //TODO: (Low Priority) Make distinction for user that for general move, it's moving the layer, but for a selection, it's moving the selection area with the contents (only works for active paste)
      globalState.tool.grabStartX = canvas.currentLayer.x
      globalState.tool.grabStartY = canvas.currentLayer.y
      globalState.tool.startScale = canvas.currentLayer.scale
      vectorGui.render()
      if (vectorGui.selectedCollisionPresent) {
        transformSteps()
      }
      break
    case 'pointermove':
      if (vectorGui.selectedPoint.xKey) {
        transformSteps()
      } else {
        const dx = globalState.cursor.x - globalState.cursor.prevX
        const dy = globalState.cursor.y - globalState.cursor.prevY
        //Move layer
        canvas.currentLayer.x += dx
        canvas.currentLayer.y += dy
        //Move selection area
        if (globalState.selection.properties.px2 !== null) {
          globalState.selection.properties.px1 += dx
          globalState.selection.properties.px2 += dx
          globalState.selection.properties.py1 += dy
          globalState.selection.properties.py2 += dy
          globalState.selection.setBoundaryBox(globalState.selection.properties)
        }
        //Move maskSet pixel coordinates with the layer
        if (globalState.selection.maskSet && (dx !== 0 || dy !== 0)) {
          const newMaskSet = new Set()
          const w = canvas.offScreenCVS.width
          const h = canvas.offScreenCVS.height
          for (const key of globalState.selection.maskSet) {
            const nx = (key & 0xffff) + dx
            const ny = ((key >> 16) & 0xffff) + dy
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              newMaskSet.add((ny << 16) | nx)
            }
          }
          globalState.selection.maskSet = newMaskSet
        }
        renderCanvas(canvas.currentLayer, true)
      }
      break
    case 'pointerup':
      if (vectorGui.selectedPoint.xKey) {
        transformSteps()
      } else {
        renderCanvas(canvas.currentLayer, true)
        //save start and end coordinates
        addToTimeline({
          tool: globalState.tool.current.name,
          layer: canvas.currentLayer,
          //selectProperties: { ...globalState.selection.properties },
          properties: {
            from: {
              x: globalState.tool.grabStartX,
              y: globalState.tool.grabStartY,
              scale: globalState.tool.startScale,
            },
            to: {
              x: canvas.currentLayer.x,
              y: canvas.currentLayer.y,
              scale: canvas.currentLayer.scale,
            },
          },
        })
      }
      break
    default:
    //do nothing
  }
}

/**
 * Scale selection. Currently only for resizing reference images
 */
function transformSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      if (vectorGui.selectedCollisionPresent) {
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedPoint.xKey,
          yKey: vectorGui.collidedPoint.yKey,
        }
        if (canvas.currentLayer.type === 'raster') {
          globalState.selection.previousBoundaryBox = {
            ...globalState.selection.boundaryBox,
          }
        }
      }
      break
    case 'pointermove':
      if (vectorGui.selectedPoint.xKey) {
        if (canvas.currentLayer.type === 'reference') {
          scaleReference()
        } else if (
          canvas.currentLayer.type === 'raster' &&
          canvas.currentLayer.isPreview
        ) {
          transformBoundaries()
          let isMirroredHorizontally =
            globalState.transform.isMirroredHorizontally
          let isMirroredVertically = globalState.transform.isMirroredVertically
          if (vectorGui.selectedPoint.xKey !== 'px9') {
            //Don't check for mirroring when moving whole selection
            if (
              globalState.selection.boundaryBox.xMax ===
                globalState.selection.previousBoundaryBox.xMin ||
              globalState.selection.boundaryBox.xMin ===
                globalState.selection.previousBoundaryBox.xMax
            ) {
              isMirroredHorizontally =
                !globalState.transform.isMirroredHorizontally
            }
            if (
              globalState.selection.boundaryBox.yMax ===
                globalState.selection.previousBoundaryBox.yMin ||
              globalState.selection.boundaryBox.yMin ===
                globalState.selection.previousBoundaryBox.yMax
            ) {
              isMirroredVertically = !globalState.transform.isMirroredVertically
            }
          }
          transformRasterContent(
            canvas.currentLayer,
            globalState.clipboard.pastedImages[
              globalState.clipboard.currentPastedImageKey
            ].imageData,
            globalState.selection.boundaryBox,
            globalState.transform.rotationDegrees % 360,
            isMirroredHorizontally,
            isMirroredVertically,
          )
        }
        renderCanvas(canvas.currentLayer)
      }
      break
    case 'pointerup':
      if (vectorGui.selectedPoint.xKey) {
        if (canvas.currentLayer.type === 'reference') {
          addToTimeline({
            tool: globalState.tool.current.name,
            layer: canvas.currentLayer,
            //selectProperties: { ...globalState.selection.properties },
            properties: {
              from: {
                x: globalState.tool.grabStartX,
                y: globalState.tool.grabStartY,
                scale: globalState.tool.startScale,
              },
              to: {
                x: canvas.currentLayer.x,
                y: canvas.currentLayer.y,
                scale: canvas.currentLayer.scale,
              },
            },
          })
        } else if (
          canvas.currentLayer.type === 'raster' &&
          canvas.currentLayer.isPreview
        ) {
          if (
            globalState.selection.boundaryBox.xMax ===
              globalState.selection.previousBoundaryBox.xMin ||
            globalState.selection.boundaryBox.xMin ===
              globalState.selection.previousBoundaryBox.xMax
          ) {
            globalState.transform.isMirroredHorizontally =
              !globalState.transform.isMirroredHorizontally
          }
          if (
            globalState.selection.boundaryBox.yMax ===
              globalState.selection.previousBoundaryBox.yMin ||
            globalState.selection.boundaryBox.yMin ===
              globalState.selection.previousBoundaryBox.yMax
          ) {
            globalState.transform.isMirroredVertically =
              !globalState.transform.isMirroredVertically
          }
          globalState.selection.normalize()
          globalState.selection.setBoundaryBox(globalState.selection.properties)
          addTransformToTimeline()
        }
        renderCanvas(canvas.currentLayer) //TODO: (Low Priority) QA to figure out need to redraw timeline?
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
      }
      break
    default:
    //do nothing
  }
}

/**
 *
 */
function scaleReference() {
  switch (vectorGui.selectedPoint.xKey) {
    case 'px1': {
      //top left corner
      let newWidth =
        globalState.tool.grabStartX +
        canvas.currentLayer.img.width * globalState.tool.startScale -
        globalState.cursor.x
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      //round change in height to snap to grid, but more useful and smooth if not snapped to grid
      let changeInHeight =
        canvas.currentLayer.img.height * globalState.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = globalState.cursor.x
      canvas.currentLayer.y = globalState.tool.grabStartY + changeInHeight
      break
    }
    case 'px2': {
      //top middle, expand or contract width
      let newHeight =
        globalState.tool.grabStartY +
        canvas.currentLayer.img.height * globalState.tool.startScale -
        globalState.cursor.y
      let scaleFactor = newHeight / canvas.currentLayer.img.height
      let changeInWidth =
        canvas.currentLayer.img.width * globalState.tool.startScale -
        canvas.currentLayer.img.width * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = globalState.tool.grabStartX + changeInWidth / 2
      canvas.currentLayer.y = globalState.cursor.y
      break
    }
    case 'px3': {
      //top right corner
      let newWidth = globalState.cursor.x - globalState.tool.grabStartX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * globalState.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.y = globalState.tool.grabStartY + changeInHeight
      break
    }
    case 'px4': {
      //middle right, expand or contract height
      let newWidth = globalState.cursor.x - globalState.tool.grabStartX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * globalState.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.y = globalState.tool.grabStartY + changeInHeight / 2
      break
    }
    case 'px5': {
      //lower right corner
      let newWidth = globalState.cursor.x - globalState.tool.grabStartX
      let newHeight = globalState.cursor.y - globalState.tool.grabStartY
      canvas.currentLayer.scale =
        canvas.offScreenCVS.width / canvas.currentLayer.img.width >
        canvas.offScreenCVS.height / canvas.currentLayer.img.height
          ? newHeight / canvas.currentLayer.img.height
          : newWidth / canvas.currentLayer.img.width
      break
    }
    case 'px6': {
      //lower middle, expand or contract width
      let newHeight = globalState.cursor.y - globalState.tool.grabStartY
      let scaleFactor = newHeight / canvas.currentLayer.img.height
      let changeInWidth =
        canvas.currentLayer.img.width * globalState.tool.startScale -
        canvas.currentLayer.img.width * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = globalState.tool.grabStartX + changeInWidth / 2
      break
    }
    case 'px7': {
      //bottom left corner
      let newWidth =
        globalState.tool.grabStartX +
        canvas.currentLayer.img.width * globalState.tool.startScale -
        globalState.cursor.x
      let newHeight = globalState.cursor.y - globalState.tool.grabStartY

      canvas.currentLayer.scale =
        canvas.offScreenCVS.width / canvas.currentLayer.img.width >
        canvas.offScreenCVS.height / canvas.currentLayer.img.height
          ? newHeight / canvas.currentLayer.img.height
          : newWidth / canvas.currentLayer.img.width

      canvas.currentLayer.x = globalState.cursor.x
      break
    }
    case 'px8': {
      //middle left, expand or contract height
      let newWidth =
        globalState.tool.grabStartX +
        canvas.currentLayer.img.width * globalState.tool.startScale -
        globalState.cursor.x
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * globalState.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = globalState.cursor.x
      canvas.currentLayer.y = globalState.tool.grabStartY + changeInHeight / 2
      break
    }
    case 'px9': {
      //Move layer
      canvas.currentLayer.x += globalState.cursor.x - globalState.cursor.prevX
      canvas.currentLayer.y += globalState.cursor.y - globalState.cursor.prevY
      break
    }
    default:
    //do nothing
  }
}

export const move = {
  name: 'move',
  fn: moveSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: true,
  options: {},
  modes: {},
  type: 'utility',
  cursor: 'move',
  activeCursor: 'move',
}
