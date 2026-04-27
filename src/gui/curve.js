import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { vectorGui } from './vector.js'
import {
  drawControlPointHandle,
  getGuiLineWidth,
  doubleStroke,
} from '../utils/guiHelpers.js'
import {
  getRenderXOffset,
  getRenderYOffset,
} from '../utils/coordinateHelpers.js'

/**
 * Draws the GUI overlay for a curve vector: the handle lines connecting
 * anchor points to their control points, and the interactive control-point
 * dots. Resolves the active curve mode by checking the passed vector's
 * modes first, then the globally-selected vector, then the current tool
 * — this priority ensures an explicitly supplied vector is rendered on
 * its own terms rather than the active selection's. Control-point handles
 * are only drawn when the relevant coordinate is a confirmed integer,
 * guarding against uninitialized positions during interactive placement.
 * When no vector reference is supplied (in-progress drawing) a first
 * unselected-style pass renders the base dots before the selected-style
 * pass; when a vector is provided the unselected pass is skipped because
 * that layer is owned by a separate rendering phase.
 * @param {object} vectorProperties - Pixel coords of the curve (px1/py1 =
 *   first anchor, px2/py2 = second anchor, px3/py3 = first ctrl point,
 *   px4/py4 = second ctrl point for cubic curves).
 * @param {object|null} vector - The committed vector object to render, or
 *   null/undefined for the in-progress active stroke.
 */
export function renderCurveVector(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  // Prefer the passed vector's modes so a non-active vector renders
  // correctly; fall back through the selected vector to the tool default.
  const currentVectorModes =
    vector?.modes ??
    globalState.vector.all[globalState.vector.currentIndex]?.modes ??
    globalState.tool.current.modes
  const cubicCurveActive = currentVectorModes?.cubicCurve
  const quadCurveActive = currentVectorModes?.quadCurve

  // Number.isInteger guards against unplaced control points (undefined)
  // and correctly passes when a point sits at coordinate 0.
  if (cubicCurveActive && Number.isInteger(px4)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
    drawControlPointHandle(canvas, xOffset, yOffset, px2, py2, px4, py4)
  } else if ((cubicCurveActive || quadCurveActive) && Number.isInteger(px3)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
  }

  const activePointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    ...(quadCurveActive || cubicCurveActive ? [{ x: 'px3', y: 'py3' }] : []),
    ...(cubicCurveActive ? [{ x: 'px4', y: 'py4' }] : []),
  ]

  // Without a vector, draw the unselected-style (base) dots first so the
  // selected-style pass renders on top with the correct z-order.
  if (!vector) {
    vectorGui.drawControlPoints(vectorProperties, activePointsKeys, false)
  }

  vectorGui.drawControlPoints(vectorProperties, activePointsKeys, true, vector)
}

/**
 * Strokes the visible path for a curve vector onto the vector GUI canvas.
 * The curve type degrades progressively: cubic bezier when both control
 * points are placed, quadratic when only the first is placed, or a
 * straight line when only the second anchor exists. This allows the path
 * to render incrementally as the user places points during drawing.
 * Returns early if the second anchor has not been placed yet, since there
 * is no segment to stroke.
 * @param {object} vectorProperties - Pixel coords of the curve (px1/py1 =
 *   first anchor, px2/py2 = second anchor, px3/py3 = first ctrl point,
 *   px4/py4 = second ctrl point for cubic curves).
 * @param {object|null} vector - The committed vector object to render, or
 *   null/undefined for the in-progress active stroke.
 */
export function renderCurvePath(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()

  canvas.vectorGuiCTX.beginPath()
  // +0.5 shifts integer pixel coords to canvas pixel centers, keeping
  // axis-aligned lines crisp at 1px rather than blurred across 2px.
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
  // Same priority fallback as renderCurveVector: explicit vector first,
  // then active selection, then tool default.
  const currentVectorModes =
    vector?.modes ??
    globalState.vector.all[globalState.vector.currentIndex]?.modes ??
    globalState.tool.current.modes
  const cubicCurveActive = currentVectorModes?.cubicCurve
  const quadCurveActive = currentVectorModes?.quadCurve

  if (cubicCurveActive && Number.isInteger(px4)) {
    canvas.vectorGuiCTX.bezierCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px4 + 0.5,
      yOffset + py4 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5,
    )
  } else if ((cubicCurveActive || quadCurveActive) && Number.isInteger(px3)) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5,
    )
  } else if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  } else {
    return
  }
  // Black over white keeps the path visible against both dark and
  // light artwork without relying on a fixed background color.
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
