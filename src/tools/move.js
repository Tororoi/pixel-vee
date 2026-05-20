import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { renderCanvas } from '../canvas/render.js'
import { vectorGui } from '../gui/vector.js'
import { addToTimeline } from '../actions/undoRedo/undoRedo.js'
import { transformRasterContent } from '../utils/transformHelpers.js'
import { addTransformToTimeline } from '../actions/transform/rasterTransform.js'
import { transformBoundaries } from './transform.js'
import { brush, rebuildBuildUpDensityMap } from './brush.js'
import { renderMaskFromSet } from '../canvas/layers.js'
import {
  applyDitherOffset,
  applyDitherOffsetControl,
} from '../utils/ditherPreview.js'

// In-flight mask-move state. The blockedSet is captured on
// pointerdown and each pointermove translates it by the cumulative
// drag delta — the set is the source of truth, and renderMaskFromSet
// repaints the canvas to match. Module-level rather than on
// globalState because no other code needs to read it — the move
// tool owns the entire lifecycle.
let _maskMoveSetSnapshot = null
let _maskMoveStartCursor = null

/**
 * Move the contents of a layer relative to other layers
 */
function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  // move raster layer or reference layer
  const isMaskMove =
    globalState.maskEdit.active && !!canvas.currentLayer.mask
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //TODO: (Low Priority) Make distinction for user that for general move, it's moving the layer, but for a selection, it's moving the selection area with the contents (only works for active paste)
      globalState.tool.grabStartX = canvas.currentLayer.x
      globalState.tool.grabStartY = canvas.currentLayer.y
      globalState.tool.startScale = canvas.currentLayer.scale
      vectorGui.render()
      if (vectorGui.selectedCollisionPresent) {
        transformSteps()
      } else if (isMaskMove) {
        // Snapshot the blockedSet once so each pointermove can
        // translate from the original coords rather than accumulating
        // compounded shifts.
        _maskMoveSetSnapshot = new Set(canvas.currentLayer.mask.blockedSet)
        _maskMoveStartCursor = {
          x: globalState.cursor.x,
          y: globalState.cursor.y,
        }
      }
      break
    case 'pointermove':
      if (vectorGui.selectedPoint.xKey) {
        transformSteps()
      } else if (isMaskMove && _maskMoveSetSnapshot) {
        // Mask-only move: translate each marked coord by the cumulative
        // drag delta, then re-render the canvas from the new set.
        // Out-of-bounds coords are preserved in the set so moving the
        // mask off an edge doesn't discard work — they just don't
        // render until they come back into view.
        const dx = globalState.cursor.x - _maskMoveStartCursor.x
        const dy = globalState.cursor.y - _maskMoveStartCursor.y
        const m = canvas.currentLayer.mask
        const newSet = new Set()
        for (const key of _maskMoveSetSnapshot) {
          const nx = ((key << 16) >> 16) + dx
          const ny = (key >> 16) + dy
          // Mask `nx` to 16 bits so the packed key uses the same
          // sign-friendly encoding `renderMaskFromSet` decodes.
          newSet.add((ny << 16) | (nx & 0xffff))
        }
        m.blockedSet = newSet
        renderMaskFromSet(canvas.currentLayer)
        renderCanvas(canvas.currentLayer)
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
      } else if (isMaskMove && _maskMoveSetSnapshot) {
        // Finalize the translation: the canvas and blockedSet were
        // already updated in pointermove via renderMaskFromSet, so the
        // gate sees the new mask state immediately. Record the action
        // for undo/redo with the final delta so a future full timeline
        // replay can reproduce the translation.
        const dx = globalState.cursor.x - _maskMoveStartCursor.x
        const dy = globalState.cursor.y - _maskMoveStartCursor.y
        renderCanvas(canvas.currentLayer)
        addToTimeline({
          tool: 'moveMask',
          layer: canvas.currentLayer,
          properties: {
            dx,
            dy,
            // performAction's `!action.boundaryBox` guard rejects actions
            // without a boundary. Supply an empty one — moveMask uses no
            // per-pixel bounds itself.
            boundaryBox: { xMin: null, xMax: null, yMin: null, yMax: null },
          },
        })
        globalState.clearRedoStack()
        _maskMoveSetSnapshot = null
        _maskMoveStartCursor = null
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
        if (canvas.currentLayer.type === 'raster') {
          const dx = canvas.currentLayer.x - globalState.tool.grabStartX
          const dy = canvas.currentLayer.y - globalState.tool.grabStartY
          brush.ditherOffsetX = (((brush.ditherOffsetX - dx) % 8) + 8) % 8
          brush.ditherOffsetY = (((brush.ditherOffsetY - dy) % 8) + 8) % 8
          const picker = document.querySelector('.dither-picker-container')
          if (picker)
            applyDitherOffset(picker, brush.ditherOffsetX, brush.ditherOffsetY)
          const preview = document.querySelector('.dither-preview')
          if (preview)
            applyDitherOffset(preview, brush.ditherOffsetX, brush.ditherOffsetY)
          const control = document.querySelector('.dither-offset-control')
          if (control)
            applyDitherOffsetControl(
              control.parentElement,
              brush.ditherOffsetX,
              brush.ditherOffsetY,
            )
          if (brush.modes?.buildUpDither) {
            rebuildBuildUpDensityMap()
          }
        }
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
