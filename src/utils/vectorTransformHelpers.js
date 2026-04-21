import { updateVectorProperties } from './vectorHelpers.js'
import { calcEllipseConicsFromVertices } from './ellipse.js'
import { calculateEllipseBoundingBox } from './transformHelpers.js'
import { getAngle } from './trig.js'

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
  yDiff,
) {
  for (const [vectorIndex, originalVectorProperties] of Object.entries(
    vectorsSavedProperties,
  )) {
    //Use diffs between cursorX/ cursorY and previousX/ previousY to update all selected vectors
    const vector = vectors[parseInt(vectorIndex)]
    const pointsArray = [1, 2, 3, 4]
    // Update properties if they exist.
    pointsArray.forEach((n) => {
      const pxProp = `px${n}`
      const pyProp = `py${n}`
      if (
        originalVectorProperties[pxProp] != null &&
        originalVectorProperties[pyProp] != null
      ) {
        updateVectorProperties(
          vector,
          originalVectorProperties[pxProp] + xDiff + layer.x,
          originalVectorProperties[pyProp] + yDiff + layer.y,
          pxProp,
          pyProp,
        )
      }
    })
    if ('px0' in originalVectorProperties) {
      vector.vectorProperties.px0 = Math.round(
        (vector.vectorProperties.px1 + vector.vectorProperties.px3) / 2,
      )
      vector.vectorProperties.py0 = Math.round(
        (vector.vectorProperties.py1 + vector.vectorProperties.py3) / 2,
      )
    }
    if (originalVectorProperties.tool === 'ellipse') {
      const conicControlPoints = calcEllipseConicsFromVertices(
        vector.vectorProperties.px1,
        vector.vectorProperties.py1,
        vector.vectorProperties.radA,
        vector.vectorProperties.radB,
        vector.vectorProperties.angle,
        vector.vectorProperties.x1Offset,
        vector.vectorProperties.y1Offset,
      )
      vector.vectorProperties.weight = conicControlPoints.weight
      vector.vectorProperties.leftTangentX = conicControlPoints.leftTangentX
      vector.vectorProperties.leftTangentY = conicControlPoints.leftTangentY
      vector.vectorProperties.topTangentX = conicControlPoints.topTangentX
      vector.vectorProperties.topTangentY = conicControlPoints.topTangentY
      vector.vectorProperties.rightTangentX = conicControlPoints.rightTangentX
      vector.vectorProperties.rightTangentY = conicControlPoints.rightTangentY
      vector.vectorProperties.bottomTangentX = conicControlPoints.bottomTangentX
      vector.vectorProperties.bottomTangentY = conicControlPoints.bottomTangentY
    }
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
  centerY,
) {
  const absoluteRadians = getAngle(cursorX - centerX, cursorY - centerY)
  const originalRadians = getAngle(startX - centerX, startY - centerY)
  const radians = absoluteRadians - originalRadians
  //Freely rotate selected vectors at any angle around origin point (default center of vectors bounding box)
  for (const [vectorIndex, originalVectorProperties] of Object.entries(
    vectorsSavedProperties,
  )) {
    const vector = vectors[vectorIndex]
    for (let i = 1; i <= 4; i++) {
      if (
        originalVectorProperties[`px${i}`] != null &&
        originalVectorProperties[`py${i}`] != null
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        const oldX = originalVectorProperties[xKey] + layer.x
        const oldY = originalVectorProperties[yKey] + layer.y
        const newX = Math.floor(
          cos * (oldX - centerX) - sin * (oldY - centerY) + centerX,
        )
        const newY = Math.floor(
          sin * (oldX - centerX) + cos * (oldY - centerY) + centerY,
        )
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if ('px0' in originalVectorProperties) {
      vector.vectorProperties.px0 = Math.round(
        (vector.vectorProperties.px1 + vector.vectorProperties.px3) / 2,
      )
      vector.vectorProperties.py0 = Math.round(
        (vector.vectorProperties.py1 + vector.vectorProperties.py3) / 2,
      )
    }
    if (originalVectorProperties.tool === 'ellipse') {
      //updateVectorProperties is not enough for ellipses. The angle and radii must be updated as well as the values for conic segments.
      vector.vectorProperties.angle = getAngle(
        vector.vectorProperties.px2 - vector.vectorProperties.px1,
        vector.vectorProperties.py2 - vector.vectorProperties.py1,
      )
      while (vector.vectorProperties.angle < 0) {
        vector.vectorProperties.angle += 2 * Math.PI
      }
      vector.vectorProperties.radA = Math.sqrt(
        (vector.vectorProperties.px1 - vector.vectorProperties.px2) ** 2 +
          (vector.vectorProperties.py1 - vector.vectorProperties.py2) ** 2,
      )
      //TODO: (Medium Priority) Should p3 be recalculated here to maintain integrity of rotated ellipse?
      vector.vectorProperties.radB = Math.sqrt(
        (vector.vectorProperties.px1 - vector.vectorProperties.px3) ** 2 +
          (vector.vectorProperties.py1 - vector.vectorProperties.py3) ** 2,
      )
      const conicControlPoints = calcEllipseConicsFromVertices(
        vector.vectorProperties.px1,
        vector.vectorProperties.py1,
        vector.vectorProperties.radA,
        vector.vectorProperties.radB,
        vector.vectorProperties.angle,
        vector.vectorProperties.x1Offset,
        vector.vectorProperties.y1Offset,
      )
      vector.vectorProperties.weight = conicControlPoints.weight
      vector.vectorProperties.leftTangentX = conicControlPoints.leftTangentX
      vector.vectorProperties.leftTangentY = conicControlPoints.leftTangentY
      vector.vectorProperties.topTangentX = conicControlPoints.topTangentX
      vector.vectorProperties.topTangentY = conicControlPoints.topTangentY
      vector.vectorProperties.rightTangentX = conicControlPoints.rightTangentX
      vector.vectorProperties.rightTangentY = conicControlPoints.rightTangentY
      vector.vectorProperties.bottomTangentX = conicControlPoints.bottomTangentX
      vector.vectorProperties.bottomTangentY = conicControlPoints.bottomTangentY
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
      if (
        vectorProperties[`px${i}`] != null &&
        vectorProperties[`py${i}`] != null
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        vectorPoints.push([vectorProperties[xKey], vectorProperties[yKey]])
      }
    }
  })
  return findCentroid(vectorPoints)
}

/**
 *
 * @param {Set} vectorIndicesSet - A set of vector indices
 * @param {object} vectors - The vectors in state
 * @returns {object} - Returns an object with xMin, xMax, yMin, and yMax
 */
export function findVectorShapeBoundaryBox(vectorIndicesSet, vectors) {
  let [xMin, xMax, yMin, yMax] = [null, null, null, null]
  for (const vectorIndex of vectorIndicesSet) {
    const vector = vectors[vectorIndex]
    const vectorXPoints = []
    const vectorYPoints = []
    if (vector.vectorProperties.tool === 'ellipse') {
      //Ellipse has a center point and a radius. The boundary box is calculated differently.
      const ellipseBoundingBox = calculateEllipseBoundingBox(
        vector.vectorProperties,
      )
      vectorXPoints.push(ellipseBoundingBox.xMin, ellipseBoundingBox.xMax)
      vectorYPoints.push(ellipseBoundingBox.yMin, ellipseBoundingBox.yMax)
    } else {
      for (let i = 1; i <= 4; i++) {
        if (
          vector.vectorProperties[`px${i}`] != null &&
          vector.vectorProperties[`py${i}`] != null
        ) {
          vectorXPoints.push(vector.vectorProperties[`px${i}`])
          vectorYPoints.push(vector.vectorProperties[`py${i}`])
        }
      }
    }
    xMin = Math.min(xMin ?? Infinity, ...vectorXPoints)
    xMax = Math.max(xMax ?? -Infinity, ...vectorXPoints)
    yMin = Math.min(yMin ?? Infinity, ...vectorYPoints)
    yMax = Math.max(yMax ?? -Infinity, ...vectorYPoints)
  }
  let layer = vectors[vectorIndicesSet.values().next().value].layer
  xMin += layer.x
  xMax += layer.x
  yMin += layer.y
  yMax += layer.y
  return { xMin, xMax, yMin, yMax }
}
