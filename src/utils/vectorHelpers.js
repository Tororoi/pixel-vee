import { getAngle } from "./trig.js"

/**
 * WARNING: This function directly manipulates the vector's properties in the history.
 * @param {object} vector - The vector to update
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @param {string} xKey - The key of the x property to update
 * @param {string} yKey - The key of the y property to update
 */
export function updateVectorProperties(vector, x, y, xKey, yKey) {
  vector.vectorProperties[xKey] = x - vector.layer.x
  vector.vectorProperties[yKey] = y - vector.layer.y
}

/**
 * Calculate the change in position and angle of the current vector.
 * @param {object} currentVector - The vector to calculate the deltas for
 * @param {string} selectedPointXKey - The key of the x property of the selected point
 * @param {object} toolOptions - The options for the tool
 * @param {object} vectorsSavedProperties - The saved properties of the vectors
 * @returns {{currentDeltaX: number, currentDeltaY: number, currentDeltaAngle: number}} - Returns an object with properties.
 *          `currentDeltaX` and `currentDeltaY` are expected to be integers representing the change in position.
 *          `currentDeltaAngle` is expected to be a float representing the change in angle in radians.
 */
export function calculateCurrentVectorDeltas(
  currentVector,
  selectedPointXKey,
  toolOptions,
  vectorsSavedProperties
) {
  let currentDeltaX = 0
  let currentDeltaY = 0
  let currentDeltaAngle = 0 // Default to 0 if alignment is active

  if (!["px1", "px2"].includes(selectedPointXKey)) {
    //Set selected keys
    let selectedEndpointXKey,
      selectedEndpointYKey,
      selectedHandleXKey,
      selectedHandleYKey
    if (selectedPointXKey === "px3") {
      selectedEndpointXKey = "px1"
      selectedEndpointYKey = "py1"
      selectedHandleXKey = "px3"
      selectedHandleYKey = "py3"
    } else if (selectedPointXKey === "px4") {
      selectedEndpointXKey = "px2"
      selectedEndpointYKey = "py2"
      selectedHandleXKey = "px4"
      selectedHandleYKey = "py4"
    }

    currentDeltaX =
      currentVector.vectorProperties[selectedEndpointXKey] -
      currentVector.vectorProperties[selectedHandleXKey]
    currentDeltaY =
      currentVector.vectorProperties[selectedEndpointYKey] -
      currentVector.vectorProperties[selectedHandleYKey]

    if (!toolOptions.align?.active) {
      const angle = getAngle(currentDeltaX, currentDeltaY)
      const savedCurrentProperties = vectorsSavedProperties[currentVector.index]
      const savedDeltaX =
        savedCurrentProperties[selectedEndpointXKey] -
        savedCurrentProperties[selectedHandleXKey]
      const savedDeltaY =
        savedCurrentProperties[selectedEndpointYKey] -
        savedCurrentProperties[selectedHandleYKey]
      const savedAngle = getAngle(savedDeltaX, savedDeltaY)
      currentDeltaAngle = angle - savedAngle
    }
  }

  return { currentDeltaX, currentDeltaY, currentDeltaAngle }
}

/**
 * Handles options and updates the linked vector if it exists.
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @param {number} currentDeltaX - (Integer)
 * @param {number} currentDeltaY - (Integer)
 * @param {number} currentDeltaAngle - (Float)
 * @param {string} selectedXKey - The key of the x property of the selected point
 * @param {object} linkedVector - The linked vector
 * @param {object} linkedPoints - The linked points
 * @param {object} vectorsSavedProperties - The saved properties of the vectors
 * @param {object} toolOptions - The options for the tool
 */
export function handleOptionsAndUpdateVector(
  x,
  y,
  currentDeltaX,
  currentDeltaY,
  currentDeltaAngle,
  selectedXKey,
  linkedVector,
  linkedPoints,
  vectorsSavedProperties,
  toolOptions
) {
  //Set linked keys
  let linkedEndpointXKey, linkedEndpointYKey, linkedHandleXKey, linkedHandleYKey
  if (linkedPoints.px1) {
    linkedEndpointXKey = "px1"
    linkedEndpointYKey = "py1"
    linkedHandleXKey = "px3"
    linkedHandleYKey = "py3"
  } else if (linkedPoints.px2) {
    linkedEndpointXKey = "px2"
    linkedEndpointYKey = "py2"
    linkedHandleXKey = "px4"
    linkedHandleYKey = "py4"
  }
  // If vector is linked via px1 or px2, update vector properties
  if (linkedEndpointXKey) {
    if (["px1", "px2"].includes(selectedXKey)) {
      updateVectorProperties(
        linkedVector,
        x,
        y,
        linkedEndpointXKey,
        linkedEndpointYKey
      )
      //If hold option enabled, maintain relative angle of control handles
      if (toolOptions.hold?.active) {
        //update handle x and y
        const linkedDeltaX =
          vectorsSavedProperties[linkedEndpointXKey] -
          vectorsSavedProperties[linkedHandleXKey]
        const linkedDeltaY =
          vectorsSavedProperties[linkedEndpointYKey] -
          vectorsSavedProperties[linkedHandleYKey]
        updateVectorProperties(
          linkedVector,
          x - linkedDeltaX,
          y - linkedDeltaY,
          linkedHandleXKey,
          linkedHandleYKey
        )
      }
    } else if (
      ["px3", "px4"].includes(selectedXKey) &&
      (toolOptions.align?.active ||
        toolOptions.hold?.active ||
        toolOptions.equal?.active)
    ) {
      //If align option enabled, move px3 and py3 of linked vector to maintain opposite angle of selected control handle
      const linkedDeltaX =
        vectorsSavedProperties[linkedEndpointXKey] -
        vectorsSavedProperties[linkedHandleXKey]
      const linkedDeltaY =
        vectorsSavedProperties[linkedEndpointYKey] -
        vectorsSavedProperties[linkedHandleYKey]
      let linkedHandleLength
      if (toolOptions.equal?.active) {
        //Match handle length to selected vector
        linkedHandleLength = Math.sqrt(currentDeltaX ** 2 + currentDeltaY ** 2)
      } else {
        //Maintain handle length
        linkedHandleLength = Math.sqrt(linkedDeltaX ** 2 + linkedDeltaY ** 2)
      }
      let newLinkedAngle
      //Priority for angle is align > hold > equal
      if (toolOptions.align?.active) {
        //Align angle of linked control handle opposite of selected vector control handle
        newLinkedAngle = getAngle(currentDeltaX, currentDeltaY) + Math.PI
      } else if (toolOptions.hold?.active) {
        //Maintain relative angle of linked control handles
        let linkedAngle = getAngle(linkedDeltaX, linkedDeltaY)
        newLinkedAngle = linkedAngle + currentDeltaAngle
      } else if (toolOptions.equal?.active) {
        //Maintain absolute angle of linked control handle
        newLinkedAngle = getAngle(linkedDeltaX, linkedDeltaY)
      }
      const newLinkedDeltaX =
        currentDeltaX -
        Math.round(Math.cos(newLinkedAngle) * linkedHandleLength)
      const newLinkedDeltaY =
        currentDeltaY -
        Math.round(Math.sin(newLinkedAngle) * linkedHandleLength)
      updateVectorProperties(
        linkedVector,
        x + newLinkedDeltaX,
        y + newLinkedDeltaY,
        linkedHandleXKey,
        linkedHandleYKey
      )
    }
  }
}

//===============================================//
//======== * * * Transform Helpers * * * ========//
//===============================================//

/**
 *
 * @param {Array} points - An array of points
 * @returns {Array} - Returns an array of points
 */
export function findCentroid(points) {
  let sumX = 0
  let sumY = 0
  const n = points.length

  for (let i = 0; i < n; i++) {
    sumX += points[i][0]
    sumY += points[i][1]
  }

  const centroidX = Math.round(sumX / n)
  const centroidY = Math.round(sumY / n)

  return [centroidX, centroidY]
}

/**
 *
 * @param {object} layer - The layer object
 * @param {object} vectorsSavedProperties - The saved properties of the vectors
 * @param {object} vectors - The vectors in state
 * @param {number} xDiff - The difference in x for current cursor vs grab start
 * @param {number} yDiff - The difference in y for current cursor vs grab start
 */
export function translateVectors(
  layer,
  vectorsSavedProperties,
  vectors,
  xDiff,
  yDiff
) {
  for (const [vectorIndex, originalVectorProperties] of Object.entries(
    vectorsSavedProperties
  )) {
    //Use diffs between cursorX/ cursorY and previousX/ previousY to update all selected vectors
    const vector = vectors[parseInt(vectorIndex)]
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
          originalVectorProperties[pxProp] + xDiff + layer.x,
          originalVectorProperties[pyProp] + yDiff + layer.y,
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
 * @param {object} vectorsSavedProperties - The saved properties of the vectors
 * @param {object} vectors - The vectors in state
 * @param {number} cursorX - The x coordinate of the cursor
 * @param {number} cursorY - The y coordinate of the cursor
 * @param {number} startX - The x coordinate of the starting cursor position of the transformation
 * @param {number} startY - The y coordinate of the starting cursor position of the transformation
 * @param {number} centerX - The x coordinate of the center of the vector shape
 * @param {number} centerY - The y coordinate of the center of the vector shape
 */
export function rotateVectors(
  layer,
  vectorsSavedProperties,
  vectors,
  cursorX,
  cursorY,
  startX,
  startY,
  centerX,
  centerY
) {
  const absoluteRadians = getAngle(cursorX - centerX, cursorY - centerY)
  const originalRadians = getAngle(startX - centerX, startY - centerY)
  const radians = absoluteRadians - originalRadians
  //Freely rotate selected vectors at any angle around origin point (default center of vectors bounding box)
  for (const [vectorIndex, originalVectorProperties] of Object.entries(
    vectorsSavedProperties
  )) {
    const vector = vectors[vectorIndex]
    for (let i = 1; i <= 4; i++) {
      if (
        "px" + i in originalVectorProperties &&
        "py" + i in originalVectorProperties
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        const oldX = originalVectorProperties[xKey] + layer.x
        const oldY = originalVectorProperties[yKey] + layer.y
        const newX = Math.floor(
          cos * (oldX - centerX) - sin * (oldY - centerY) + centerX
        )
        const newY = Math.floor(
          sin * (oldX - centerX) + cos * (oldY - centerY) + centerY
        )
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if (originalVectorProperties.type === "ellipse") {
      //updateVectorProperties is not enough for ellipses. The angle must be updated as well.
      vector.vectorProperties.angle = getAngle(
        vector.vectorProperties.px2 - vector.vectorProperties.px1,
        vector.vectorProperties.py2 - vector.vectorProperties.py1
      )
    }
  }
}

/**
 * For better consistency with rotation point, this is used upon the event of selection or translation of vectors, not after every transformation.
 * @param {Set} vectorIndicesSet - A set of vector indices
 * @param {object} vectors - The vectors in state
 * @returns {Array} - Returns an array with centerX and centerY
 */
export function findVectorShapeCentroid(vectorIndicesSet, vectors) {
  const vectorPoints = []
  vectorIndicesSet.forEach((index) => {
    const vectorProperties = vectors[index].vectorProperties
    //Get points for center point calculation.
    for (let i = 1; i <= 4; i++) {
      if ("px" + i in vectorProperties && "py" + i in vectorProperties) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        vectorPoints.push([vectorProperties[xKey], vectorProperties[yKey]])
      }
    }
  })
  return findCentroid(vectorPoints)
}
