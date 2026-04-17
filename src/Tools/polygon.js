import { brushStamps } from '../Context/brushStamps.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { keys } from '../Shortcuts/keys.js'
import { actionPolygon } from '../Actions/pointer/polygon.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { bump } from '../hooks/appState.svelte.js'
import { rerouteVectorStepsAction } from './adjust.js'
import {
  getCropNormalizedCursorX,
  getCropNormalizedCursorY,
} from '../utils/coordinateHelpers.js'

//============================================//
//==== * * * Polygon Adjust Helpers * * * ====//
//============================================//

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview - whether to render as preview
 * @returns {object} StrokeContext
 */
function buildPolygonCtx(isPreview = false) {
  return createStrokeContext({
    layer: canvas.currentLayer,
    isPreview,
    boundaryBox: globalState.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: globalState.tool.current.modes,
    maskSet: globalState.selection.maskSet,
    brushStamp:
      brushStamps[globalState.tool.current.brushType][
        globalState.tool.current.brushSize
      ],
    brushSize: globalState.tool.current.brushSize,
    ditherPattern: ditherPatterns[globalState.tool.current.ditherPatternIndex],
    twoColorMode: globalState.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: globalState.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: globalState.tool.current.ditherOffsetY ?? 0,
  })
}

/**
 * Compute and store all 4 corners from px1 (anchor) and current cursor,
 * clamping to a square if Shift is held.
 * Layout: px1=anchor, px2=adjacent horizontal, px3=opposite, px4=adjacent vertical
 */
function updateVertices() {
  let ex = globalState.cursor.x - globalState.canvas.cropOffsetX
  let ey = globalState.cursor.y - globalState.canvas.cropOffsetY
  if (
    keys.ShiftLeft ||
    keys.ShiftRight ||
    globalState.vector.properties.forceSquare
  ) {
    const dx = ex - globalState.vector.properties.px1
    const dy = ey - globalState.vector.properties.py1
    const size = Math.min(Math.abs(dx), Math.abs(dy))
    ex = globalState.vector.properties.px1 + Math.sign(dx) * size
    ey = globalState.vector.properties.py1 + Math.sign(dy) * size
  }
  const x1 = globalState.vector.properties.px1
  const y1 = globalState.vector.properties.py1
  globalState.vector.properties.px2 = ex
  globalState.vector.properties.py2 = y1
  globalState.vector.properties.px3 = ex
  globalState.vector.properties.py3 = ey
  globalState.vector.properties.px4 = x1
  globalState.vector.properties.py4 = ey
  globalState.vector.properties.px0 = Math.round((x1 + ex) / 2)
  globalState.vector.properties.py0 = Math.round((y1 + ey) / 2)
}

/**
 * Compute the uniform drag context for the given corner at drag-start.
 * Reads canvas-absolute positions from globalState.vector.properties.
 * Must be called at pointerdown before any cursor movement.
 * @param {string} selectedXKey - the key of the corner being dragged (e.g. "px3")
 * @returns {object|null} uniform context, or null if selectedXKey is not a corner
 */
export function getUniformCtx(selectedXKey) {
  const cornerMap = {
    px1: {
      fixedXKey: 'px3',
      fixedYKey: 'py3',
      adj1XKey: 'px2',
      adj1YKey: 'py2',
      adj2XKey: 'px4',
      adj2YKey: 'py4',
    },
    px2: {
      fixedXKey: 'px4',
      fixedYKey: 'py4',
      adj1XKey: 'px1',
      adj1YKey: 'py1',
      adj2XKey: 'px3',
      adj2YKey: 'py3',
    },
    px3: {
      fixedXKey: 'px1',
      fixedYKey: 'py1',
      adj1XKey: 'px2',
      adj1YKey: 'py2',
      adj2XKey: 'px4',
      adj2YKey: 'py4',
    },
    px4: {
      fixedXKey: 'px2',
      fixedYKey: 'py2',
      adj1XKey: 'px1',
      adj1YKey: 'py1',
      adj2XKey: 'px3',
      adj2YKey: 'py3',
    },
  }
  const map = cornerMap[selectedXKey]
  if (!map) return null
  const p = globalState.vector.properties
  const fx = p[map.fixedXKey]
  const fy = p[map.fixedYKey]
  const d1rx = p[map.adj1XKey] - fx
  const d1ry = p[map.adj1YKey] - fy
  const d1len = Math.sqrt(d1rx * d1rx + d1ry * d1ry)
  const d2rx = p[map.adj2XKey] - fx
  const d2ry = p[map.adj2YKey] - fy
  const d2len = Math.sqrt(d2rx * d2rx + d2ry * d2ry)
  return {
    ...map,
    d1x: d1len > 0 ? d1rx / d1len : 0,
    d1y: d1len > 0 ? d1ry / d1len : 0,
    d2x: d2len > 0 ? d2rx / d2len : 0,
    d2y: d2len > 0 ? d2ry / d2len : 0,
  }
}

/**
 * Apply uniform constraint: project the dragged corner's new position onto the
 * saved side directions from the fixed corner to recompute adjacent corners.
 * @param {object} vectorProperties - the vector's properties object to mutate
 * @param {string} selectedXKey - key of the dragged x coordinate
 * @param {string} selectedYKey - key of the dragged y coordinate
 * @param {number} newX - new x position for the dragged point
 * @param {number} newY - new y position for the dragged point
 * @param {object} uniformCtx - context returned by getUniformCtx at drag-start
 * @param {boolean} forceSquare - when true, clamp both side lengths to their minimum to produce a square
 */
export function syncPolygonUniform(
  vectorProperties,
  selectedXKey,
  selectedYKey,
  newX,
  newY,
  uniformCtx,
  forceSquare = false,
) {
  const {
    fixedXKey,
    fixedYKey,
    adj1XKey,
    adj1YKey,
    adj2XKey,
    adj2YKey,
    d1x,
    d1y,
    d2x,
    d2y,
  } = uniformCtx
  const fx = vectorProperties[fixedXKey]
  const fy = vectorProperties[fixedYKey]
  const dx = newX - fx
  const dy = newY - fy
  let len1 = dx * d1x + dy * d1y
  let len2 = dx * d2x + dy * d2y
  if (forceSquare) {
    const size = Math.min(Math.abs(len1), Math.abs(len2))
    len1 = Math.sign(len1) * size
    len2 = Math.sign(len2) * size
    vectorProperties[selectedXKey] = Math.round(fx + len1 * d1x + len2 * d2x)
    vectorProperties[selectedYKey] = Math.round(fy + len1 * d1y + len2 * d2y)
  } else {
    vectorProperties[selectedXKey] = newX
    vectorProperties[selectedYKey] = newY
  }
  vectorProperties[adj1XKey] = Math.round(fx + len1 * d1x)
  vectorProperties[adj1YKey] = Math.round(fy + len1 * d1y)
  vectorProperties[adj2XKey] = Math.round(fx + len2 * d2x)
  vectorProperties[adj2YKey] = Math.round(fy + len2 * d2y)
  vectorProperties.px0 = Math.round((vectorProperties[selectedXKey] + fx) / 2)
  vectorProperties.py0 = Math.round((vectorProperties[selectedYKey] + fy) / 2)
}

/**
 * Update polygon corners given a dragged control point and its new position.
 * Dragging px0 (center) translates all 4 corners. Dragging a corner moves it
 * independently; if forceSquare is set, all corners are recomputed as a square
 * from px1. The center (px0/py0) is recomputed after any corner move.
 * @param {object} vectorProperties - the vector's properties object to mutate
 * @param {string} selectedXKey - key of the dragged x coordinate (e.g. "px0")
 * @param {string} selectedYKey - key of the dragged y coordinate (e.g. "py0")
 * @param {number} newX - new x position for the dragged point
 * @param {number} newY - new y position for the dragged point
 */
export function syncPolygonProperties(
  vectorProperties,
  selectedXKey,
  selectedYKey,
  newX,
  newY,
) {
  if (selectedXKey === 'px0') {
    const dx = newX - vectorProperties.px0
    const dy = newY - vectorProperties.py0
    vectorProperties.px0 = newX
    vectorProperties.py0 = newY
    vectorProperties.px1 += dx
    vectorProperties.py1 += dy
    vectorProperties.px2 += dx
    vectorProperties.py2 += dy
    vectorProperties.px3 += dx
    vectorProperties.py3 += dy
    vectorProperties.px4 += dx
    vectorProperties.py4 += dy
  } else if (vectorProperties.forceSquare) {
    let ex = newX
    let ey = newY
    const dx = ex - vectorProperties.px1
    const dy = ey - vectorProperties.py1
    const size = Math.min(Math.abs(dx), Math.abs(dy))
    ex = vectorProperties.px1 + Math.sign(dx) * size
    ey = vectorProperties.py1 + Math.sign(dy) * size
    vectorProperties.px2 = ex
    vectorProperties.py2 = vectorProperties.py1
    vectorProperties.px3 = ex
    vectorProperties.py3 = ey
    vectorProperties.px4 = vectorProperties.px1
    vectorProperties.py4 = ey
    vectorProperties.px0 = Math.round((vectorProperties.px1 + ex) / 2)
    vectorProperties.py0 = Math.round((vectorProperties.py1 + ey) / 2)
  } else {
    vectorProperties[selectedXKey] = newX
    vectorProperties[selectedYKey] = newY
    vectorProperties.px0 = Math.round(
      (vectorProperties.px1 + vectorProperties.px3) / 2,
    )
    vectorProperties.py0 = Math.round(
      (vectorProperties.py1 + vectorProperties.py3) / 2,
    )
  }
}

/**
 * Update polygon vector properties for the current selected point and cursor position.
 * @param {object} currentVector - The current vector
 * @param {number} normalizedX - The normalized X coordinate
 * @param {number} normalizedY - The normalized Y coordinate
 */
export function updatePolygonVectorProperties(
  currentVector,
  normalizedX,
  normalizedY,
) {
  const uniformCtx = globalState.tool.current.options.uniform?.active
    ? globalState.vector.savedProperties[globalState.vector.currentIndex]
        ?.uniformCtx
    : null
  if (uniformCtx && vectorGui.selectedPoint.xKey !== 'px0') {
    syncPolygonUniform(
      globalState.vector.properties,
      vectorGui.selectedPoint.xKey,
      vectorGui.selectedPoint.yKey,
      normalizedX,
      normalizedY,
      uniformCtx,
      globalState.vector.properties.forceSquare,
    )
  } else {
    syncPolygonProperties(
      globalState.vector.properties,
      vectorGui.selectedPoint.xKey,
      vectorGui.selectedPoint.yKey,
      normalizedX,
      normalizedY,
    )
  }
  currentVector.vectorProperties = { ...globalState.vector.properties }
  currentVector.vectorProperties.px0 -= currentVector.layer.x
  currentVector.vectorProperties.py0 -= currentVector.layer.y
  currentVector.vectorProperties.px1 -= currentVector.layer.x
  currentVector.vectorProperties.py1 -= currentVector.layer.y
  currentVector.vectorProperties.px2 -= currentVector.layer.x
  currentVector.vectorProperties.py2 -= currentVector.layer.y
  currentVector.vectorProperties.px3 -= currentVector.layer.x
  currentVector.vectorProperties.py3 -= currentVector.layer.y
  currentVector.vectorProperties.px4 -= currentVector.layer.x
  currentVector.vectorProperties.py4 -= currentVector.layer.y
}

/**
 * Call actionPolygon with the current vector properties.
 * @param {boolean} isPreview - whether to render as preview
 * @param {number} cropOffsetX - crop offset X to translate to canvas-absolute space
 * @param {number} cropOffsetY - crop offset Y to translate to canvas-absolute space
 */
function drawPolygon(isPreview, cropOffsetX, cropOffsetY) {
  const p = globalState.vector.properties
  actionPolygon(
    p.px1 + cropOffsetX,
    p.py1 + cropOffsetY,
    p.px2 + cropOffsetX,
    p.py2 + cropOffsetY,
    p.px3 + cropOffsetX,
    p.py3 + cropOffsetY,
    p.px4 + cropOffsetX,
    p.py4 + cropOffsetY,
    buildPolygonCtx(isPreview),
  )
}

//==========================================//
//===== * * * Polygon Controller * * * =====//
//==========================================//

/**
 * Draw polygon
 * Supported modes: draw, erase
 */
function polygonSteps() {
  if (rerouteVectorStepsAction()) return
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  const { cropOffsetX, cropOffsetY } = globalState.canvas
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      vectorGui.reset()
      globalState.vector.properties.tool = globalState.tool.current.name
      globalState.vector.properties.px1 = normalizedX
      globalState.vector.properties.py1 = normalizedY
      updateVertices()
      renderCanvas(canvas.currentLayer)
      drawPolygon(true, cropOffsetX, cropOffsetY)
      break
    case 'pointermove':
      if (
        globalState.cursor.x !== globalState.cursor.prevX ||
        globalState.cursor.y !== globalState.cursor.prevY
      ) {
        updateVertices()
        renderCanvas(canvas.currentLayer)
        drawPolygon(true, cropOffsetX, cropOffsetY)
      }
      break
    case 'pointerup': {
      updateVertices()
      drawPolygon(false, cropOffsetX, cropOffsetY)
      const maskArray = coordArrayFromSet(
        globalState.selection.maskSet,
        canvas.currentLayer.x + globalState.canvas.cropOffsetX,
        canvas.currentLayer.y + globalState.canvas.cropOffsetY,
      )
      const boundaryBox = { ...globalState.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -=
          canvas.currentLayer.x + globalState.canvas.cropOffsetX
        boundaryBox.xMax -=
          canvas.currentLayer.x + globalState.canvas.cropOffsetX
        boundaryBox.yMin -=
          canvas.currentLayer.y + globalState.canvas.cropOffsetY
        boundaryBox.yMax -=
          canvas.currentLayer.y + globalState.canvas.cropOffsetY
      }
      const uniqueVectorKey = globalState.vector.nextKey()
      globalState.vector.setCurrentIndex(uniqueVectorKey)
      bump()
      addToTimeline({
        tool: globalState.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      const layerX = canvas.currentLayer.x
      const layerY = canvas.currentLayer.y
      const vectorProperties = globalState.vector.properties
      globalState.vector.all[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: globalState.timeline.currentAction,
        layer: canvas.currentLayer,
        modes: { ...globalState.tool.current.modes },
        color: { ...swatches.primary.color },
        secondaryColor: { ...swatches.secondary.color },
        ditherPatternIndex: globalState.tool.current.ditherPatternIndex,
        ditherOffsetX:
          (((globalState.tool.current.ditherOffsetX +
            globalState.canvas.cropOffsetX) %
            8) +
            8) %
          8,
        ditherOffsetY:
          (((globalState.tool.current.ditherOffsetY +
            globalState.canvas.cropOffsetY) %
            8) +
            8) %
          8,
        recordedLayerX: layerX,
        recordedLayerY: layerY,
        brushSize: globalState.tool.current.brushSize,
        brushType: globalState.tool.current.brushType,
        vectorProperties: {
          ...vectorProperties,
          px0: vectorProperties.px0 - layerX,
          py0: vectorProperties.py0 - layerY,
          px1: vectorProperties.px1 - layerX,
          py1: vectorProperties.py1 - layerY,
          px2: vectorProperties.px2 - layerX,
          py2: vectorProperties.py2 - layerY,
          px3: vectorProperties.px3 - layerX,
          py3: vectorProperties.py3 - layerY,
          px4: vectorProperties.px4 - layerX,
          py4: vectorProperties.py4 - layerY,
        },
        hidden: false,
        removed: false,
      }
      globalState.reset()
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
      break
    }
    default:
    //do nothing
  }
}

/**
 * Polygon tool
 */
export const polygon = {
  name: 'polygon',
  fn: polygonSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 63,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    uniform: {
      active: false,
      tooltip:
        'Uniform. \n\nMaintain rectangular shape when adjusting corners.',
    },
    displayPaths: {
      active: false,
      tooltip: 'Toggle Paths. \n\nShow path for polygon.',
    },
  },
  modes: { eraser: false, inject: false, twoColor: false },
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}
