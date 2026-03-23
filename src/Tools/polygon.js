import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
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
import { enableActionsForSelection } from '../DOM/disableDomElements.js'
import { rerouteVectorStepsAction } from './adjust.js'

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
    boundaryBox: state.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: state.tool.current.modes,
    maskSet: state.selection.maskSet,
    brushStamp:
      brushStamps[state.tool.current.brushType][state.tool.current.brushSize],
    brushSize: state.tool.current.brushSize,
    ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
    twoColorMode: state.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
  })
}

/**
 * Compute and store all 4 corners from px1 (anchor) and current cursor,
 * clamping to a square if Shift is held.
 * Layout: px1=anchor, px2=adjacent horizontal, px3=opposite, px4=adjacent vertical
 */
function updateVertices() {
  let ex = state.cursor.x
  let ey = state.cursor.y
  if (
    keys.ShiftLeft ||
    keys.ShiftRight ||
    state.vector.properties.forceSquare
  ) {
    const dx = ex - state.vector.properties.px1
    const dy = ey - state.vector.properties.py1
    const size = Math.min(Math.abs(dx), Math.abs(dy))
    ex = state.vector.properties.px1 + Math.sign(dx) * size
    ey = state.vector.properties.py1 + Math.sign(dy) * size
  }
  const x1 = state.vector.properties.px1
  const y1 = state.vector.properties.py1
  state.vector.properties.px2 = ex
  state.vector.properties.py2 = y1
  state.vector.properties.px3 = ex
  state.vector.properties.py3 = ey
  state.vector.properties.px4 = x1
  state.vector.properties.py4 = ey
  state.vector.properties.px0 = Math.round((x1 + ex) / 2)
  state.vector.properties.py0 = Math.round((y1 + ey) / 2)
}

/**
 * Compute the uniform drag context for the given corner at drag-start.
 * Reads canvas-absolute positions from state.vector.properties.
 * Must be called at pointerdown before any cursor movement.
 * @param {string} selectedXKey - the key of the corner being dragged (e.g. "px3")
 * @returns {object|null} uniform context, or null if selectedXKey is not a corner
 */
export function getUniformCtx(selectedXKey) {
  const cornerMap = {
    px1: { fixedXKey: 'px3', fixedYKey: 'py3', adj1XKey: 'px2', adj1YKey: 'py2', adj2XKey: 'px4', adj2YKey: 'py4' },
    px2: { fixedXKey: 'px4', fixedYKey: 'py4', adj1XKey: 'px1', adj1YKey: 'py1', adj2XKey: 'px3', adj2YKey: 'py3' },
    px3: { fixedXKey: 'px1', fixedYKey: 'py1', adj1XKey: 'px2', adj1YKey: 'py2', adj2XKey: 'px4', adj2YKey: 'py4' },
    px4: { fixedXKey: 'px2', fixedYKey: 'py2', adj1XKey: 'px1', adj1YKey: 'py1', adj2XKey: 'px3', adj2YKey: 'py3' },
  }
  const map = cornerMap[selectedXKey]
  if (!map) return null
  const p = state.vector.properties
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
export function syncPolygonUniform(vectorProperties, selectedXKey, selectedYKey, newX, newY, uniformCtx, forceSquare = false) {
  const { fixedXKey, fixedYKey, adj1XKey, adj1YKey, adj2XKey, adj2YKey, d1x, d1y, d2x, d2y } = uniformCtx
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
    vectorProperties.px0 = Math.round((vectorProperties.px1 + vectorProperties.px3) / 2)
    vectorProperties.py0 = Math.round((vectorProperties.py1 + vectorProperties.py3) / 2)
  }
}

/**
 * Update polygon vector properties for the current selected point and cursor position.
 * @param {object} currentVector - The current vector
 */
export function updatePolygonVectorProperties(currentVector) {
  const uniformCtx = state.tool.current.options.uniform?.active
    ? state.vector.savedProperties[state.vector.currentIndex]?.uniformCtx
    : null
  if (uniformCtx && vectorGui.selectedPoint.xKey !== 'px0') {
    syncPolygonUniform(
      state.vector.properties,
      vectorGui.selectedPoint.xKey,
      vectorGui.selectedPoint.yKey,
      state.cursor.x,
      state.cursor.y,
      uniformCtx,
      state.vector.properties.forceSquare,
    )
  } else {
    syncPolygonProperties(
      state.vector.properties,
      vectorGui.selectedPoint.xKey,
      vectorGui.selectedPoint.yKey,
      state.cursor.x,
      state.cursor.y,
    )
  }
  currentVector.vectorProperties = { ...state.vector.properties }
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
 */
function drawPolygon(isPreview) {
  const p = state.vector.properties
  actionPolygon(
    p.px1,
    p.py1,
    p.px2,
    p.py2,
    p.px3,
    p.py3,
    p.px4,
    p.py4,
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
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      vectorGui.reset()
      state.vector.properties.type = state.tool.current.name
      state.vector.properties.px1 = state.cursor.x
      state.vector.properties.py1 = state.cursor.y
      updateVertices()
      renderCanvas(canvas.currentLayer)
      drawPolygon(true)
      break
    case 'pointermove':
      if (
        state.cursor.x !== state.cursor.prevX ||
        state.cursor.y !== state.cursor.prevY
      ) {
        updateVertices()
        renderCanvas(canvas.currentLayer)
        drawPolygon(true)
      }
      break
    case 'pointerup': {
      updateVertices()
      drawPolygon(false)
      const maskArray = coordArrayFromSet(
        state.selection.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y,
      )
      const boundaryBox = { ...state.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      const uniqueVectorKey = state.vector.nextKey()
      state.vector.setCurrentIndex(uniqueVectorKey)
      enableActionsForSelection()
      addToTimeline({
        tool: state.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      const lx = canvas.currentLayer.x
      const ly = canvas.currentLayer.y
      const p = state.vector.properties
      state.vector.all[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: state.timeline.currentAction,
        layer: canvas.currentLayer,
        modes: { ...state.tool.current.modes },
        color: { ...swatches.primary.color },
        secondaryColor: { ...swatches.secondary.color },
        ditherPatternIndex: state.tool.current.ditherPatternIndex,
        ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
        ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
        recordedLayerX: lx,
        recordedLayerY: ly,
        brushSize: state.tool.current.brushSize,
        brushType: state.tool.current.brushType,
        vectorProperties: {
          ...p,
          px0: p.px0 - lx,
          py0: p.py0 - ly,
          px1: p.px1 - lx,
          py1: p.py1 - ly,
          px2: p.px2 - lx,
          py2: p.py2 - ly,
          px3: p.px3 - lx,
          py3: p.py3 - ly,
          px4: p.px4 - lx,
          py4: p.py4 - ly,
        },
        hidden: false,
        removed: false,
      }
      state.reset()
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
  ditherPatternIndex: 64,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    uniform: {
      active: false,
      tooltip: 'Uniform. \n\nMaintain rectangular shape when adjusting corners.',
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
