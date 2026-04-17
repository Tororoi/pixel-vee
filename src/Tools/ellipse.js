import { brushStamps } from '../Context/brushStamps.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { actionEllipse } from '../Actions/pointer/ellipse.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { vectorGui } from '../GUI/vector.js'
import {
  getOpposingEllipseVertex,
  findHalf,
  calcEllipseConicsFromVertices,
} from '../utils/ellipse.js'
import { getAngle } from '../utils/trig.js'
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
//=== * * * Ellipse Adjust Helpers * * * ===//
//============================================//

/**
 * Update the offsets of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {boolean|null|undefined} overrideForceCircle - force circle if passed in
 * @param {number} angleOffset - angle offset
 */
export function updateEllipseOffsets(
  vectorProperties,
  overrideForceCircle,
  angleOffset = 0,
) {
  const forceCircle = overrideForceCircle ?? vectorProperties.forceCircle
  vectorProperties.angle = getAngle(
    vectorProperties.px2 - vectorProperties.px1,
    vectorProperties.py2 - vectorProperties.py1,
  )
  if (globalState.tool.current.options.useSubpixels?.active) {
    vectorProperties.unifiedOffset = findHalf(
      canvas.subPixelX,
      canvas.subPixelY,
      vectorProperties.angle + angleOffset,
    )
  } else {
    vectorProperties.unifiedOffset = 0
  }
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  while (vectorProperties.angle < 0) {
    vectorProperties.angle += 2 * Math.PI
  }
  let index =
    Math.floor(
      (vectorProperties.angle + angleOffset + Math.PI / 2 + Math.PI / 8) /
        (Math.PI / 4),
    ) % 8
  let compassDir = directions[index]
  if (forceCircle) {
    vectorProperties.x1Offset = -vectorProperties.unifiedOffset
    vectorProperties.y1Offset = -vectorProperties.unifiedOffset
  } else {
    switch (compassDir) {
      case 'N':
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case 'NE':
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case 'E':
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        break
      case 'SE':
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case 'S':
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case 'SW':
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case 'W':
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        break
      case 'NW':
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      default:
      //none
    }
  }
}

/**
 * Update the opposing control points of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {string} shiftedXKey - The key of the shifted x value
 * @param {string} shiftedYKey - The key of the shifted y value
 * @param {number} newX - The new x value for the shifted point
 * @param {number} newY - The new y value for the shifted point
 */
export function syncEllipseProperties(
  vectorProperties,
  shiftedXKey,
  shiftedYKey,
  newX,
  newY,
) {
  if (shiftedXKey !== 'px1') {
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
  }
  let deltaXa = vectorProperties.px2 - vectorProperties.px1
  let deltaYa = vectorProperties.py2 - vectorProperties.py1
  let deltaXb = vectorProperties.px3 - vectorProperties.px1
  let deltaYb = vectorProperties.py3 - vectorProperties.py1
  if (shiftedXKey === 'px1') {
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
    vectorProperties.px2 = vectorProperties.px1 + deltaXa
    vectorProperties.py2 = vectorProperties.py1 + deltaYa
    vectorProperties.px3 = vectorProperties.px1 + deltaXb
    vectorProperties.py3 = vectorProperties.py1 + deltaYb
  } else if (shiftedXKey === 'px2') {
    vectorProperties.radA = Math.sqrt(deltaXa * deltaXa + deltaYa * deltaYa)
    if (vectorProperties.forceCircle) {
      vectorProperties.radB = vectorProperties.radA
    }
    let newVertex = getOpposingEllipseVertex(
      vectorProperties.px1,
      vectorProperties.py1,
      vectorProperties.px2,
      vectorProperties.py2,
      -Math.PI / 2,
      vectorProperties.radB,
    )
    vectorProperties.px3 = newVertex.x
    vectorProperties.py3 = newVertex.y
    updateEllipseOffsets(vectorProperties, vectorProperties.forceCircle, 0)
  } else if (shiftedXKey === 'px3') {
    vectorProperties.radB = Math.sqrt(deltaXb * deltaXb + deltaYb * deltaYb)
    if (vectorProperties.forceCircle) {
      vectorProperties.radA = vectorProperties.radB
    }
    let newVertex = getOpposingEllipseVertex(
      vectorProperties.px1,
      vectorProperties.py1,
      vectorProperties.px3,
      vectorProperties.py3,
      Math.PI / 2,
      vectorProperties.radA,
    )
    vectorProperties.px2 = newVertex.x
    vectorProperties.py2 = newVertex.y
    updateEllipseOffsets(
      vectorProperties,
      vectorProperties.forceCircle,
      1.5 * Math.PI,
    )
  }
  let conicControlPoints = calcEllipseConicsFromVertices(
    vectorProperties.px1,
    vectorProperties.py1,
    vectorProperties.radA,
    vectorProperties.radB,
    vectorProperties.angle,
    vectorProperties.x1Offset,
    vectorProperties.y1Offset,
  )
  vectorProperties.weight = conicControlPoints.weight
  vectorProperties.leftTangentX = conicControlPoints.leftTangentX
  vectorProperties.leftTangentY = conicControlPoints.leftTangentY
  vectorProperties.topTangentX = conicControlPoints.topTangentX
  vectorProperties.topTangentY = conicControlPoints.topTangentY
  vectorProperties.rightTangentX = conicControlPoints.rightTangentX
  vectorProperties.rightTangentY = conicControlPoints.rightTangentY
  vectorProperties.bottomTangentX = conicControlPoints.bottomTangentX
  vectorProperties.bottomTangentY = conicControlPoints.bottomTangentY
}

/**
 * Update ellipse vector properties for the current selected point and cursor position.
 * @param {object} currentVector - The current vector
 * @param {number} normalizedX - The normalized X coordinate
 * @param {number} normalizedY - The normalized Y coordinate
 */
export function updateEllipseVectorProperties(
  currentVector,
  normalizedX,
  normalizedY,
) {
  syncEllipseProperties(
    globalState.vector.properties,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey,
    normalizedX,
    normalizedY,
  )
  currentVector.vectorProperties = {
    ...globalState.vector.properties,
  }
  currentVector.vectorProperties.px1 -= currentVector.layer.x
  currentVector.vectorProperties.py1 -= currentVector.layer.y
  currentVector.vectorProperties.px2 -= currentVector.layer.x
  currentVector.vectorProperties.py2 -= currentVector.layer.y
  currentVector.vectorProperties.px3 -= currentVector.layer.x
  currentVector.vectorProperties.py3 -= currentVector.layer.y
  currentVector.vectorProperties.leftTangentX -= currentVector.layer.x
  currentVector.vectorProperties.leftTangentY -= currentVector.layer.y
  currentVector.vectorProperties.topTangentX -= currentVector.layer.x
  currentVector.vectorProperties.topTangentY -= currentVector.layer.y
  currentVector.vectorProperties.rightTangentX -= currentVector.layer.x
  currentVector.vectorProperties.rightTangentY -= currentVector.layer.y
  currentVector.vectorProperties.bottomTangentX -= currentVector.layer.x
  currentVector.vectorProperties.bottomTangentY -= currentVector.layer.y
}

//======================================//
//=== * * * Ellipse Controller * * * ===//
//======================================//

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview - Whether this context is for a preview render
 * @returns {object} StrokeContext
 */
function buildEllipseCtx(isPreview = false) {
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
 * TODO: (Medium Priority) Add control points on opposite side of point 2 and 3, for a total of 5 control points
 * Draw ellipse
 * Supported modes: "draw, erase",
 * Due to method of modifying radius on a pixel grid, only odd diameter circles are created. Eg. 15px radius creates a 31px diameter circle. To fix this, allow half pixel increments.
 */
function ellipseSteps() {
  if (rerouteVectorStepsAction()) return
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  const { cropOffsetX, cropOffsetY } = globalState.canvas
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //solidify end points
      globalState.tool.clickCounter += 1
      if (globalState.tool.clickCounter > 2) globalState.tool.clickCounter = 1
      switch (globalState.tool.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          globalState.vector.properties.tool = globalState.tool.current.name
          globalState.vector.properties.px1 = normalizedX
          globalState.vector.properties.py1 = normalizedY
          globalState.vector.properties.forceCircle = true //force circle initially
          break
        default:
        //do nothing
      }
      if (globalState.tool.clickCounter === 1) {
        //initialize circle with radius 15 by default?
        globalState.vector.properties.px2 = normalizedX
        globalState.vector.properties.py2 = normalizedY
        let deltaXa =
          globalState.vector.properties.px2 - globalState.vector.properties.px1
        let deltaYa =
          globalState.vector.properties.py2 - globalState.vector.properties.py1
        globalState.vector.properties.radA = Math.sqrt(
          deltaXa * deltaXa + deltaYa * deltaYa,
        )
      }
      updateEllipseOffsets(globalState.vector.properties)
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      globalState.vector.properties = {
        ...globalState.vector.properties,
        ...calcEllipseConicsFromVertices(
          globalState.vector.properties.px1,
          globalState.vector.properties.py1,
          globalState.vector.properties.radA,
          globalState.vector.properties.radA,
          globalState.vector.properties.angle,
          globalState.vector.properties.x1Offset,
          globalState.vector.properties.y1Offset,
        ),
      }
      actionEllipse(
        globalState.vector.properties.weight,
        globalState.vector.properties.leftTangentX + cropOffsetX,
        globalState.vector.properties.leftTangentY + cropOffsetY,
        globalState.vector.properties.topTangentX + cropOffsetX,
        globalState.vector.properties.topTangentY + cropOffsetY,
        globalState.vector.properties.rightTangentX + cropOffsetX,
        globalState.vector.properties.rightTangentY + cropOffsetY,
        globalState.vector.properties.bottomTangentX + cropOffsetX,
        globalState.vector.properties.bottomTangentY + cropOffsetY,
        buildEllipseCtx(true),
      )
      break
    case 'pointermove':
      //draw line from origin point to current point onscreen
      //normalize pointermove to pixelgrid
      if (
        globalState.cursor.x + canvas.subPixelX !==
          globalState.cursor.prevX + canvas.previousSubPixelX ||
        globalState.cursor.y + canvas.subPixelY !==
          globalState.cursor.prevY + canvas.previousSubPixelY
      ) {
        if (globalState.tool.clickCounter === 1) {
          globalState.vector.properties.px2 = normalizedX
          globalState.vector.properties.py2 = normalizedY
          let deltaXa =
            globalState.vector.properties.px2 -
            globalState.vector.properties.px1
          let deltaYa =
            globalState.vector.properties.py2 -
            globalState.vector.properties.py1
          globalState.vector.properties.radA = Math.sqrt(
            deltaXa * deltaXa + deltaYa * deltaYa,
          )
        }
        updateEllipseOffsets(globalState.vector.properties)
        //onscreen preview
        renderCanvas(canvas.currentLayer)
        globalState.vector.properties = {
          ...globalState.vector.properties,
          ...calcEllipseConicsFromVertices(
            globalState.vector.properties.px1,
            globalState.vector.properties.py1,
            globalState.vector.properties.radA,
            globalState.vector.properties.radA,
            globalState.vector.properties.angle,
            globalState.vector.properties.x1Offset,
            globalState.vector.properties.y1Offset,
          ),
        }
        actionEllipse(
          globalState.vector.properties.weight,
          globalState.vector.properties.leftTangentX + cropOffsetX,
          globalState.vector.properties.leftTangentY + cropOffsetY,
          globalState.vector.properties.topTangentX + cropOffsetX,
          globalState.vector.properties.topTangentY + cropOffsetY,
          globalState.vector.properties.rightTangentX + cropOffsetX,
          globalState.vector.properties.rightTangentY + cropOffsetY,
          globalState.vector.properties.bottomTangentX + cropOffsetX,
          globalState.vector.properties.bottomTangentY + cropOffsetY,
          buildEllipseCtx(true),
        )
      }
      break
    case 'pointerup':
      if (globalState.tool.clickCounter === 1) {
        let deltaXa =
          globalState.vector.properties.px2 - globalState.vector.properties.px1
        let deltaYa =
          globalState.vector.properties.py2 - globalState.vector.properties.py1
        globalState.vector.properties.radA = Math.sqrt(
          deltaXa * deltaXa + deltaYa * deltaYa,
        )

        //set px3 at right angle on the circle
        let newVertex = getOpposingEllipseVertex(
          globalState.vector.properties.px1,
          globalState.vector.properties.py1,
          globalState.vector.properties.px2,
          globalState.vector.properties.py2,
          -Math.PI / 2,
          globalState.vector.properties.radA,
        )
        globalState.vector.properties.px3 = newVertex.x
        globalState.vector.properties.py3 = newVertex.y
        //set rb
        let deltaXb =
          globalState.vector.properties.px3 - globalState.vector.properties.px1
        let deltaYb =
          globalState.vector.properties.py3 - globalState.vector.properties.py1
        globalState.vector.properties.radB = Math.sqrt(
          deltaXb * deltaXb + deltaYb * deltaYb,
        )

        updateEllipseOffsets(globalState.vector.properties)
        globalState.vector.properties = {
          ...globalState.vector.properties,
          ...calcEllipseConicsFromVertices(
            globalState.vector.properties.px1,
            globalState.vector.properties.py1,
            globalState.vector.properties.radA,
            globalState.vector.properties.radB,
            globalState.vector.properties.angle,
            globalState.vector.properties.x1Offset,
            globalState.vector.properties.y1Offset,
          ),
        }
        actionEllipse(
          globalState.vector.properties.weight,
          globalState.vector.properties.leftTangentX + cropOffsetX,
          globalState.vector.properties.leftTangentY + cropOffsetY,
          globalState.vector.properties.topTangentX + cropOffsetX,
          globalState.vector.properties.topTangentY + cropOffsetY,
          globalState.vector.properties.rightTangentX + cropOffsetX,
          globalState.vector.properties.rightTangentY + cropOffsetY,
          globalState.vector.properties.bottomTangentX + cropOffsetX,
          globalState.vector.properties.bottomTangentY + cropOffsetY,
          buildEllipseCtx(false),
        )
        let maskArray = coordArrayFromSet(
          globalState.selection.maskSet,
          canvas.currentLayer.x + globalState.canvas.cropOffsetX,
          canvas.currentLayer.y + globalState.canvas.cropOffsetY,
        )
        //correct boundary box for layer offset and crop offset
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
        //generate new unique key for vector
        const uniqueVectorKey = globalState.vector.nextKey()
        globalState.vector.setCurrentIndex(uniqueVectorKey)
        bump()
        //store control points for timeline
        addToTimeline({
          tool: globalState.tool.current.name,
          layer: canvas.currentLayer,
          properties: {
            maskArray,
            boundaryBox,
            vectorIndices: [uniqueVectorKey],
          },
        })
        //Store vector in state
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
          recordedLayerX: canvas.currentLayer.x,
          recordedLayerY: canvas.currentLayer.y,
          brushSize: globalState.tool.current.brushSize,
          brushType: globalState.tool.current.brushType,
          vectorProperties: {
            ...globalState.vector.properties,
            px1: globalState.vector.properties.px1 - canvas.currentLayer.x,
            py1: globalState.vector.properties.py1 - canvas.currentLayer.y,
            px2: globalState.vector.properties.px2 - canvas.currentLayer.x,
            py2: globalState.vector.properties.py2 - canvas.currentLayer.y,
            px3: globalState.vector.properties.px3 - canvas.currentLayer.x,
            py3: globalState.vector.properties.py3 - canvas.currentLayer.y,
            weight: globalState.vector.properties.weight,
            leftTangentX:
              globalState.vector.properties.leftTangentX -
              canvas.currentLayer.x,
            leftTangentY:
              globalState.vector.properties.leftTangentY -
              canvas.currentLayer.y,
            topTangentX:
              globalState.vector.properties.topTangentX - canvas.currentLayer.x,
            topTangentY:
              globalState.vector.properties.topTangentY - canvas.currentLayer.y,
            rightTangentX:
              globalState.vector.properties.rightTangentX -
              canvas.currentLayer.x,
            rightTangentY:
              globalState.vector.properties.rightTangentY -
              canvas.currentLayer.y,
            bottomTangentX:
              globalState.vector.properties.bottomTangentX -
              canvas.currentLayer.x,
            bottomTangentY:
              globalState.vector.properties.bottomTangentY -
              canvas.currentLayer.y,
          },
          // maskArray,
          // boundaryBox,
          hidden: false,
          removed: false,
        }
        globalState.reset()
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
      }
      break
    default:
    //do nothing
  }
}

/**
 * Ellipse tool
 */
export const ellipse = {
  name: 'ellipse',
  fn: ellipseSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 63,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    useSubpixels: {
      active: true,
      tooltip:
        'Toggle use subpixels. \n\nUse subpixels to control handling of origin point for radii. Determines odd or even length bounding box for ellipse.',
    },
    // radiusExcludesCenter: false,
    displayPaths: {
      active: false,
      tooltip: 'Toggle Paths. \n\nShow paths for ellipse.',
    },
    //forceCircle: {active: false} //affects timeline, may need to handle this in a way that controls vectorProperties.forceCircle instead of replacing vectorProperties.forceCircle
  }, // need to expand radiusExcludesCenter to cover multiple scenarios, centerx = 0 or 1 and centery = 0 or 1
  modes: { eraser: false, inject: false, twoColor: false },
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}
