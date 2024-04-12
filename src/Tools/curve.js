import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  actionQuadraticCurve,
  actionCubicCurve,
} from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import {
  vectorGui,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  createActiveIndexesForRender,
} from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { getAngle } from "../utils/trig.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { makeCircle } from "../utils/smallestEnclosingCircle.js"

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
function quadCurveSteps() {
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
    adjustCurveSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 2) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vectorProperties.type = state.tool.name
          state.vectorProperties.px1 = state.cursorX
          state.vectorProperties.py1 = state.cursorY
          //endpoint starts at same point as startpoint
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionQuadraticCurve(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.vectorProperties.px3,
        state.vectorProperties.py3,
        state.boundaryBox,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        true
      )

      break
    case "pointermove":
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionQuadraticCurve(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.vectorProperties.px3,
        state.vectorProperties.py3,
        state.boundaryBox,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        true
      )

      break
    case "pointerup":
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.clickCounter === 2) {
        actionQuadraticCurve(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.px2,
          state.vectorProperties.py2,
          state.vectorProperties.px3,
          state.vectorProperties.py3,
          state.boundaryBox,
          state.clickCounter,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet
        )
        state.clickCounter = 0
        let maskArray = coordArrayFromSet(
          state.maskSet,
          canvas.currentLayer.x,
          canvas.currentLayer.y
        )
        //correct boundary box for layer offset
        const boundaryBox = { ...state.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -= canvas.currentLayer.x
          boundaryBox.xMax -= canvas.currentLayer.x
          boundaryBox.yMin -= canvas.currentLayer.y
          boundaryBox.yMax -= canvas.currentLayer.y
        }
        //generate new unique key for vector
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        state.currentVectorIndex = uniqueVectorKey
        enableActionsForSelection()
        //store control points for timeline
        addToTimeline({
          tool: state.tool.name,
          layer: canvas.currentLayer,
          properties: {
            maskArray,
            boundaryBox,
            vectorIndices: [uniqueVectorKey],
          },
        })
        //Add the vector to the state
        state.vectors[uniqueVectorKey] = {
          index: uniqueVectorKey,
          actionIndex: state.action.index,
          layer: canvas.currentLayer,
          modes: { ...state.tool.modes },
          color: { ...swatches.primary.color },
          brushSize: state.tool.brushSize,
          brushType: state.tool.brushType,
          vectorProperties: {
            ...state.vectorProperties,
            px1: state.vectorProperties.px1 - canvas.currentLayer.x,
            py1: state.vectorProperties.py1 - canvas.currentLayer.y,
            px2: state.vectorProperties.px2 - canvas.currentLayer.x,
            py2: state.vectorProperties.py2 - canvas.currentLayer.y,
            px3: state.vectorProperties.px3 - canvas.currentLayer.x,
            py3: state.vectorProperties.py3 - canvas.currentLayer.y,
          },
          // maskArray,
          // boundaryBox,
          hidden: false,
          removed: false,
        }
        renderCanvas(canvas.currentLayer)
      }
      break
    default:
    //do nothing
  }
}

/**
 * Draw cubic bezier curves
 * Supported modes: "draw, erase",
 */
function cubicCurveSteps() {
  //for selecting another vector via the canvas, collisionPresent is false since it is currently based on collision with selected vector.
  if (
    state.collidedVectorIndex &&
    !vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0
  ) {
    let collidedVector = state.vectors[state.collidedVectorIndex]
    vectorGui.setVectorProperties(collidedVector)
    //Render new selected vector before running standard render routine
    //First render makes the new selected vector collidable with other vectors and the next render handles the collision normally.
    // renderCurrentVector() //May not be needed after changing order of render calls in renderLayerVectors
    vectorGui.render()
  }
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
    adjustCurveSteps()
    return
  }
  // TODO: (High Priority) If there are selected vectors, call transformVectorSteps() instead of this function
  if (state.selectedVectorIndicesSet.size > 0) {
    transformVectorSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 3) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vectorProperties.type = state.tool.name
          state.vectorProperties.px1 = state.cursorX
          state.vectorProperties.py1 = state.cursorY
          //endpoint starts at same point as startpoint
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        case 3:
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionCubicCurve(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.vectorProperties.px3,
        state.vectorProperties.py3,
        state.vectorProperties.px4,
        state.vectorProperties.py4,
        state.boundaryBox,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        true
      )
      break
    case "pointermove":
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        case 3:
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionCubicCurve(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.vectorProperties.px3,
        state.vectorProperties.py3,
        state.vectorProperties.px4,
        state.vectorProperties.py4,
        state.boundaryBox,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        true
      )
      break
    case "pointerup":
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        case 3:
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.clickCounter === 3) {
        actionCubicCurve(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.px2,
          state.vectorProperties.py2,
          state.vectorProperties.px3,
          state.vectorProperties.py3,
          state.vectorProperties.px4,
          state.vectorProperties.py4,
          state.boundaryBox,
          state.clickCounter,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet
        )
        state.clickCounter = 0
        let maskArray = coordArrayFromSet(
          state.maskSet,
          canvas.currentLayer.x,
          canvas.currentLayer.y
        )
        //correct boundary box for layer offset
        const boundaryBox = { ...state.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -= canvas.currentLayer.x
          boundaryBox.xMax -= canvas.currentLayer.x
          boundaryBox.yMin -= canvas.currentLayer.y
          boundaryBox.yMax -= canvas.currentLayer.y
        }
        //generate new unique key for vector
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        state.currentVectorIndex = uniqueVectorKey
        enableActionsForSelection()
        //store control points for timeline
        addToTimeline({
          tool: state.tool.name,
          layer: canvas.currentLayer,
          properties: {
            maskArray,
            boundaryBox,
            vectorIndices: [uniqueVectorKey],
          },
        })
        //Store vector in state
        state.vectors[uniqueVectorKey] = {
          index: uniqueVectorKey,
          actionIndex: state.action.index,
          layer: canvas.currentLayer,
          modes: { ...state.tool.modes },
          color: { ...swatches.primary.color },
          brushSize: state.tool.brushSize,
          brushType: state.tool.brushType,
          vectorProperties: {
            ...state.vectorProperties,
            px1: state.vectorProperties.px1 - canvas.currentLayer.x,
            py1: state.vectorProperties.py1 - canvas.currentLayer.y,
            px2: state.vectorProperties.px2 - canvas.currentLayer.x,
            py2: state.vectorProperties.py2 - canvas.currentLayer.y,
            px3: state.vectorProperties.px3 - canvas.currentLayer.x,
            py3: state.vectorProperties.py3 - canvas.currentLayer.y,
            px4: state.vectorProperties.px4 - canvas.currentLayer.x,
            py4: state.vectorProperties.py4 - canvas.currentLayer.y,
          },
          // maskArray, //default to action's maskArray
          // boundaryBox, //default to action's boundaryBox
          hidden: false,
          removed: false,
        }
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
      }
      break
    default:
    //do nothing
  }
}

//=======================================//
//======== * * * Adjusters * * * ========//
//=======================================//

/**
 * Used automatically by curve tools after curve is completed.
 * TODO: (Low Priority) create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * BUG: cut selection not rendered properly in timeline
 */
function adjustCurveSteps() {
  let currentVector = state.vectors[state.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.vectorsSavedProperties[state.currentVectorIndex] = {
          ...currentVector.vectorProperties,
        }
        //save linked vectors too
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector, true)
        }
        state.activeIndexes = createActiveIndexesForRender(
          currentVector,
          state.vectorsSavedProperties
        )
        renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector)
        }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector)
        }
        //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
        if (
          (state.tool.options.align?.active ||
            state.tool.options.equal?.active ||
            state.tool.options.link?.active) &&
          Object.keys(state.vectorsSavedProperties).length === 1 &&
          ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
        ) {
          //snap selected point to collidedVector's control point
          if (state.collidedVectorIndex && state.currentVectorIndex) {
            let collidedVector = state.vectors[state.collidedVectorIndex]
            let snappedToX =
              collidedVector.vectorProperties[
                vectorGui.otherCollidedKeys.xKey
              ] + collidedVector.layer.x
            let snappedToY =
              collidedVector.vectorProperties[
                vectorGui.otherCollidedKeys.yKey
              ] + collidedVector.layer.y
            state.vectorProperties[vectorGui.selectedPoint.xKey] = snappedToX
            state.vectorProperties[vectorGui.selectedPoint.yKey] = snappedToY
            updateVectorProperties(
              currentVector,
              snappedToX,
              snappedToY,
              vectorGui.selectedPoint.xKey,
              vectorGui.selectedPoint.yKey
            )
            if (state.tool.options.hold?.active) {
              updateLockedCurrentVectorControlHandle(
                currentVector,
                snappedToX,
                snappedToY
              )
            }
            //Handle options behavior on snapping
            if (
              (state.tool.options.align?.active ||
                state.tool.options.equal?.active) &&
              ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
            ) {
              //Set selected keys
              let selectedEndpointXKey,
                selectedEndpointYKey,
                selectedHandleXKey,
                selectedHandleYKey
              //if control point is p1, handle is line to p3, if control point is p2, handle is line to p4
              if (vectorGui.selectedPoint.xKey === "px1") {
                ;[
                  selectedEndpointXKey,
                  selectedEndpointYKey,
                  selectedHandleXKey,
                  selectedHandleYKey,
                ] = ["px1", "py1", "px3", "py3"]
              } else if (vectorGui.selectedPoint.xKey === "px2") {
                ;[
                  selectedEndpointXKey,
                  selectedEndpointYKey,
                  selectedHandleXKey,
                  selectedHandleYKey,
                ] = ["px2", "py2", "px4", "py4"]
              }
              //Set selected deltas
              const savedCurrentProperties =
                state.vectorsSavedProperties[currentVector.index]
              const currentHandleDeltaX =
                savedCurrentProperties[selectedEndpointXKey] -
                savedCurrentProperties[selectedHandleXKey]
              const currentHandleDeltaY =
                savedCurrentProperties[selectedEndpointYKey] -
                savedCurrentProperties[selectedHandleYKey]
              const selectedHandleDeltaX =
                state.vectorProperties[selectedHandleXKey] -
                state.vectorProperties[selectedEndpointXKey]
              const selectedHandleDeltaY =
                state.vectorProperties[selectedHandleYKey] -
                state.vectorProperties[selectedEndpointYKey]
              //Set collided deltas
              let collidedHandleDeltaX, collidedHandleDeltaY
              if (vectorGui.otherCollidedKeys.xKey === "px1") {
                collidedHandleDeltaX =
                  collidedVector.vectorProperties.px3 -
                  collidedVector.vectorProperties.px1
                collidedHandleDeltaY =
                  collidedVector.vectorProperties.py3 -
                  collidedVector.vectorProperties.py1
              } else if (vectorGui.otherCollidedKeys.xKey === "px2") {
                collidedHandleDeltaX =
                  collidedVector.vectorProperties.px4 -
                  collidedVector.vectorProperties.px2
                collidedHandleDeltaY =
                  collidedVector.vectorProperties.py4 -
                  collidedVector.vectorProperties.py2
              }
              let selectedHandleLength
              if (state.tool.options.equal?.active) {
                //Make selected handle length equal to collided vector' handle length
                selectedHandleLength = Math.sqrt(
                  collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2
                )
              } else {
                //Maintain selected handle length
                selectedHandleLength = Math.sqrt(
                  currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2
                )
              }
              let newSelectedAngle
              //Priority for angle is align > equal
              if (state.tool.options.align?.active) {
                //Align angle of selected control handle opposite of collided vector control handle
                newSelectedAngle =
                  getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
              } else if (state.tool.options.equal?.active) {
                //Maintain absolute angle of selected control handle
                newSelectedAngle = getAngle(
                  selectedHandleDeltaX,
                  selectedHandleDeltaY
                )
              }
              const newSelectedHandleDeltaX = -Math.round(
                Math.cos(newSelectedAngle) * selectedHandleLength
              )
              const newSelectedHandleDeltaY = -Math.round(
                Math.sin(newSelectedAngle) * selectedHandleLength
              )
              state.vectorProperties[selectedHandleXKey] =
                state.vectorProperties[selectedEndpointXKey] -
                newSelectedHandleDeltaX
              state.vectorProperties[selectedHandleYKey] =
                state.vectorProperties[selectedEndpointYKey] -
                newSelectedHandleDeltaY
              updateVectorProperties(
                currentVector,
                state.vectorProperties[selectedHandleXKey],
                state.vectorProperties[selectedHandleYKey],
                selectedHandleXKey,
                selectedHandleYKey
              )
            }
          }
        }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
        // renderCanvas(currentVector.layer, true)
        modifyVectorAction(currentVector)
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

//=======================================//
//======== * * * Transformers * * * =====//
//=======================================//

/**
 * Transform selected vectors
 * Ignore all tool options
 * This is for full vector rotation, scaling, and translation
 */
function transformVectorSteps() {
  //Doesn't really matter which selected vector is used since all selected vectors will be transformed, but one is needed for keeping track of the right layer, etc. so use the first one.
  let currentVector =
    state.vectors[state.selectedVectorIndicesSet.values().next().value] ||
    state.vectors[state.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown": {
      state.grabStartX = state.cursorX
      state.grabStartY = state.cursorY
      //reset current vector properties
      vectorGui.reset()
      //Set state.vectorsSavedProperties for all selected vectors
      state.vectorsSavedProperties = {}
      const vectorIndicesSet = new Set(state.selectedVectorIndicesSet)
      if (vectorIndicesSet.size === 0) {
        vectorIndicesSet.add(state.currentVectorIndex)
      }
      vectorIndicesSet.forEach((index) => {
        state.vectorsSavedProperties[index] = {
          ...state.vectors[index].vectorProperties,
        }
      })
      const points = []
      for (const vectorIndex of vectorIndicesSet) {
        const vector = state.vectors[vectorIndex]
        for (let i = 1; i <= 2; i++) {
          if (vector.vectorProperties.type === "ellipse" && i === 2) {
            continue
          }
          if (
            "px" + i in vector.vectorProperties &&
            "py" + i in vector.vectorProperties
          ) {
            points.push({
              x: vector.vectorProperties[`px${i}`],
              y: vector.vectorProperties[`py${i}`],
            })
          }
        }
      }
      state.smallestEnclosingCircle = makeCircle(points)
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Translation

      //Set activeIndexes for all selected vectors
      state.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vectorsSavedProperties
      )
      renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      break
    }
    case "pointermove": {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      //Translation
      // translateVectors(currentVector.layer)
      //Rotation
      rotateVectors(currentVector.layer)
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      break
    }
    case "pointerup": {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      //Translation
      // translateVectors(currentVector.layer)
      //Rotation
      rotateVectors(currentVector.layer)
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      modifyVectorAction(currentVector)
      break
    }
    default:
    //do nothing
  }
}

/**
 *
 * @param {object} layer - The layer object
 */
function translateVectors(layer) {
  const xDiff = state.cursorX - state.grabStartX + layer.x
  const yDiff = state.cursorY - state.grabStartY + layer.y
  for (const [vectorIndex, originalVectorProperties] of Object.entries(
    state.vectorsSavedProperties
  )) {
    //Use diffs between cursorX/ cursorY and previousX/ previousY to update all selected vectors
    const vector = state.vectors[parseInt(vectorIndex)]
    const pointsArray = [1, 2, 3, 4]
    // Update properties if they exist.
    pointsArray.forEach((n) => {
      const pxProp = `px${n}`
      const pyProp = `py${n}`
      if (
        originalVectorProperties[pxProp] !== undefined &&
        originalVectorProperties[pyProp] !== undefined
      ) {
        updateVectorProperties(
          vector,
          originalVectorProperties[pxProp] + xDiff,
          originalVectorProperties[pyProp] + yDiff,
          pxProp,
          pyProp
        )
      }
    })
  }
}

/**
 *
 * @param {object} layer - The layer object
 */
function rotateVectors(layer) {
  const vectorIndicesSet = new Set(state.selectedVectorIndicesSet)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.currentVectorIndex)
  }

  const centerX = 128
  const centerY = 128
  //TODO: to keep center more consistent, and also keep ui simple, find the center point based on a circle that passes through outer most points of all selected vectors.
  // const centerX = vectorGui.mother.rotationOrigin.x
  // const centerY = vectorGui.mother.rotationOrigin.y
  const absoluteRadians = getAngle(
    state.cursorX - centerX,
    state.cursorY - centerY
  )
  const originalRadians = getAngle(
    state.grabStartX - centerX,
    state.grabStartY - centerY
  )
  const radians = absoluteRadians - originalRadians
  //TODO: (High Priority) Freely rotate selected vectors at any angle around origin point (default center of vectors bounding box)
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vectors[vectorIndex]
    const originalVectorProperties = state.vectorsSavedProperties[vectorIndex]
    for (let i = 1; i <= 4; i++) {
      if (
        "px" + i in originalVectorProperties &&
        "py" + i in originalVectorProperties
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = originalVectorProperties[xKey]
        let newY = originalVectorProperties[yKey]
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        newX = Math.floor(
          cos * (originalVectorProperties[xKey] - centerX) -
            sin * (originalVectorProperties[yKey] - centerY) +
            centerX
        )
        newY = Math.floor(
          sin * (originalVectorProperties[xKey] - centerX) +
            cos * (originalVectorProperties[yKey] - centerY) +
            centerY
        )
        if (originalVectorProperties.type === "ellipse") {
          //TODO: (High Priority) Implement rotation for ellipses. updateVectorProperties is not enough. See if radA, radB, and angle can be factored out of the vectorProperties object.
          console.log("ellipse", vector)
        }
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if (vectorIndex === state.currentVectorIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
}

export const quadCurve = {
  name: "quadCurve",
  fn: quadCurveSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow paths for curves.",
    },
  },
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}

export const cubicCurve = {
  name: "cubicCurve",
  fn: cubicCurveSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    //Priority hierarchy of options: Equal = Align > Hold > Link
    equal: {
      active: false,
      tooltip:
        "Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.",
    }, // Magnitude continuity
    align: {
      active: true,
      tooltip:
        "Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.",
    }, // Tangential continuity
    hold: {
      active: false,
      tooltip:
        "Toggle Hold (H). \n\nMaintain relative angles of all control handles attached to selected control point.",
    },
    link: {
      active: true,
      tooltip:
        "Toggle Linking (L). \n\nConnected control points of other vectors will move with selected control point.",
    }, // Positional continuity
    // displayVectors: false,
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow paths for curves.",
    },
  },
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
