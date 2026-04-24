import { brushStamps } from '../Context/brushStamps.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { calculateBrushDirection } from '../utils/drawHelpers.js'
import {
  actionDitherDraw,
  actionBuildUpDitherDraw,
} from '../Actions/pointer/draw.js'
import { actionFill } from '../Actions/pointer/fill.js'
import { actionEllipse } from '../Actions/pointer/ellipse.js'
import { actionPolygon } from '../Actions/pointer/polygon.js'
import { actionCurve } from '../Actions/pointer/curve.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { isDitherOn, ditherPatterns } from '../Context/ditherPatterns.js'
import { transformRasterContent } from '../utils/transformHelpers.js'
import { getWasm } from '../wasm.js'

/**
 * Render a contiguous block of build-up dither actions in a single pass.
 * Instead of replaying every stroke point-by-point (O(actions × points × stamp)),
 * this pre-scans the buildUpDensityDelta arrays to build a final density map and
 * writes each unique pixel exactly once — O(total_delta_pixels).
 *
 * Correctness: the final pixel at position (x,y) is determined by the last action
 * that touched it. That action saw a pre-hit density of (totalDensity - 1), so the
 * step index is min(totalDensity - 1, buildUpSteps.length - 1), matching sequential replay.
 * @param {object[]} actions - Consecutive build-up dither actions on the same layer
 * @param {object} layer - The shared layer object
 * @param {Map} buildUpLayerMaps - Accumulated density from all prior build-up actions (for cross-segment density)
 * @param {CanvasRenderingContext2D|null} betweenCtx - Override render target (null → use layer.ctx)
 * @param {number} cropDX - Canvas crop x offset
 * @param {number} cropDY - Canvas crop y offset
 */
export function renderBuildUpDitherSegment(
  actions,
  layer,
  buildUpLayerMaps,
  betweenCtx,
  cropDX,
  cropDY,
) {
  const offsetX = layer.x + cropDX
  const offsetY = layer.y + cropDY
  const renderCtx = betweenCtx ?? layer.ctx
  const wasm = getWasm()

  if (wasm) {
    _renderBuildUpDitherSegmentWasm(
      wasm,
      actions,
      layer,
      buildUpLayerMaps,
      renderCtx,
      offsetX,
      offsetY,
      cropDX,
      cropDY,
    )
  } else {
    _renderBuildUpDitherSegmentJS(
      actions,
      layer,
      buildUpLayerMaps,
      renderCtx,
      offsetX,
      offsetY,
      cropDX,
      cropDY,
    )
  }
}

function _renderBuildUpDitherSegmentWasm(
  wasm,
  actions,
  layer,
  buildUpLayerMaps,
  renderCtx,
  offsetX,
  offsetY,
  cropDX,
  cropDY,
) {
  const cw = canvas.offScreenCVS.width
  const ch = canvas.offScreenCVS.height

  // Build per-action flat arrays for WASM
  const deltaFlat = []
  const actionR = [],
    actionG = [],
    actionB = [],
    actionA = []
  const actionSR = [],
    actionSG = [],
    actionSB = [],
    actionSA = []
  const actionTwoColor = []
  const actionSteps = []
  const actionStepCounts = []
  const actionOffX = [],
    actionOffY = []

  for (const action of actions) {
    const lx = action.layer.x + cropDX
    const ly = action.layer.y + cropDY
    for (const coord of action.buildUpDensityDelta ?? []) {
      const px = (coord & 0xffff) + lx
      const py = ((coord >>> 16) & 0xffff) + ly
      if (px >= 0 && px < cw && py >= 0 && py < ch) {
        deltaFlat.push((py << 16) | px)
      }
    }
    deltaFlat.push(0xffffffff) // sentinel
    actionR.push(action.color.r)
    actionG.push(action.color.g)
    actionB.push(action.color.b)
    actionA.push(action.color.a)
    const sec = action.secondaryColor
    actionSR.push(sec ? sec.r : 0)
    actionSG.push(sec ? sec.g : 0)
    actionSB.push(sec ? sec.b : 0)
    actionSA.push(sec ? sec.a : 0)
    actionTwoColor.push(action.modes?.twoColor && sec ? 1 : 0)
    const steps = action.buildUpSteps ?? [15, 31, 47, 63]
    for (const s of steps) actionSteps.push(s)
    actionStepCounts.push(steps.length)
    const effX =
      ((((action.ditherOffsetX ?? 0) + action.recordedLayerX - offsetX) % 8) +
        8) %
      8
    const effY =
      ((((action.ditherOffsetY ?? 0) + action.recordedLayerY - offsetY) % 8) +
        8) %
      8
    actionOffX.push(effX)
    actionOffY.push(effY)
  }

  const priorMap = buildUpLayerMaps.get(layer) ?? new Int32Array(cw * ch)
  const imgData = renderCtx.getImageData(0, 0, cw, ch)

  wasm.render_buildup_segment(
    imgData.data,
    priorMap,
    cw,
    ch,
    new Uint32Array(deltaFlat),
    new Uint8Array(actionR),
    new Uint8Array(actionG),
    new Uint8Array(actionB),
    new Uint8Array(actionA),
    new Uint8Array(actionSR),
    new Uint8Array(actionSG),
    new Uint8Array(actionSB),
    new Uint8Array(actionSA),
    new Uint8Array(actionTwoColor),
    new Uint8Array(actionSteps),
    new Uint32Array(actionStepCounts),
    new Int32Array(actionOffX),
    new Int32Array(actionOffY),
    actions[0]?.modes?.eraser ?? false,
    actions[0]?.modes?.inject ?? false,
  )

  renderCtx.putImageData(imgData, 0, 0)
}

function _renderBuildUpDitherSegmentJS(
  actions,
  layer,
  buildUpLayerMaps,
  renderCtx,
  offsetX,
  offsetY,
  cropDX,
  cropDY,
) {
  // Phase 1: scan all deltas to build segment density count and lastAction per pixel
  const segmentDelta = new Map() // absolute_pos → count within this segment
  const lastActionMap = new Map() // absolute_pos → last action touching that pixel

  for (const action of actions) {
    if (!action.buildUpDensityDelta) continue
    const lx = action.layer.x + cropDX
    const ly = action.layer.y + cropDY
    for (const coord of action.buildUpDensityDelta) {
      const px = (coord & 0xffff) + lx
      const py = ((coord >>> 16) & 0xffff) + ly
      const key = (py << 16) | px
      segmentDelta.set(key, (segmentDelta.get(key) ?? 0) + 1)
      lastActionMap.set(key, action)
    }
  }

  // Phase 2: write each pixel using the correct number of composites per density hit.
  const priorDensityMap = buildUpLayerMaps.get(layer)
  const cw = canvas.offScreenCVS.width
  for (const [key, segmentCount] of segmentDelta) {
    const x = key & 0xffff
    const y = (key >>> 16) & 0xffff
    const action = lastActionMap.get(key)
    const buildUpSteps = action.buildUpSteps ?? [15, 31, 47, 63]
    const priorDensity = priorDensityMap ? priorDensityMap[y * cw + x] || 0 : 0
    const totalDensity = priorDensity + segmentCount
    const stepIndex = Math.min(totalDensity - 1, buildUpSteps.length - 1)
    const finalPattern = ditherPatterns[buildUpSteps[stepIndex]]
    const effectiveDitherOffsetX =
      ((((action.ditherOffsetX ?? 0) + action.recordedLayerX - offsetX) % 8) +
        8) %
      8
    const effectiveDitherOffsetY =
      ((((action.ditherOffsetY ?? 0) + action.recordedLayerY - offsetY) % 8) +
        8) %
      8
    const isOn = isDitherOn(
      finalPattern,
      x,
      y,
      effectiveDitherOffsetX,
      effectiveDitherOffsetY,
    )
    const isErase = action.modes?.eraser ?? false
    const isInject = action.modes?.inject ?? false
    const hasTwoColor = !!(action.modes?.twoColor && action.secondaryColor)

    if (isInject) {
      // Clear-before-draw: matches clearRect+fillRect in actionBuildUpDitherDraw.
      if (isOn || hasTwoColor) {
        renderCtx.clearRect(x, y, 1, 1)
      }
      if (isOn) {
        renderCtx.fillStyle = action.color.color
        renderCtx.fillRect(x, y, 1, 1)
      } else if (hasTwoColor) {
        renderCtx.fillStyle = action.secondaryColor.color
        renderCtx.fillRect(x, y, 1, 1)
      }
    } else if (isErase) {
      if (isOn) {
        renderCtx.clearRect(x, y, 1, 1)
      }
    } else {
      // Normal draw: composite once per density hit where the pixel was "on".
      // Find the turn-on step (first buildUpSteps index where pixel is on).
      let turnOnStepIdx = -1
      for (let d = 0; d < buildUpSteps.length; d++) {
        if (
          isDitherOn(
            ditherPatterns[buildUpSteps[d]],
            x,
            y,
            effectiveDitherOffsetX,
            effectiveDitherOffsetY,
          )
        ) {
          turnOnStepIdx = d
          break
        }
      }

      let secondaryComposites = 0
      let primaryComposites = 0
      if (turnOnStepIdx === -1) {
        secondaryComposites = hasTwoColor ? segmentCount : 0
      } else {
        const turnOnDensity = turnOnStepIdx + 1
        const primaryStart = Math.max(turnOnDensity, priorDensity + 1)
        primaryComposites = Math.max(0, totalDensity - primaryStart + 1)
        if (hasTwoColor) {
          const secEnd = Math.min(turnOnDensity - 1, totalDensity)
          secondaryComposites = Math.max(0, secEnd - priorDensity)
        }
      }

      if (secondaryComposites > 0) {
        renderCtx.fillStyle = action.secondaryColor.color
        for (let i = 0; i < secondaryComposites; i++) {
          renderCtx.fillRect(x, y, 1, 1)
        }
      }
      if (primaryComposites > 0) {
        renderCtx.fillStyle = action.color.color
        for (let i = 0; i < primaryComposites; i++) {
          renderCtx.fillRect(x, y, 1, 1)
        }
      }
    }
  }
}

/**
 * Helper for performAction to render vectors
 * @param {object} action - The vector action to be rendered
 * @param {CanvasRenderingContext2D} activeCtx - The canvas context for saving between actions
 * @param {number} cropDX - horizontal crop offset delta, default 0
 * @param {number} cropDY - vertical crop offset delta, default 0
 */
function renderActionVectors(action, activeCtx = null, cropDX = 0, cropDY = 0) {
  //Correct action coordinates with layer offsets
  const offsetX = action.layer.x + cropDX
  const offsetY = action.layer.y + cropDY
  //correct boundary box for offsets
  const boundaryBox = { ...action.boundaryBox }
  if (boundaryBox.xMax !== null) {
    boundaryBox.xMin += offsetX
    boundaryBox.xMax += offsetX
    boundaryBox.yMin += offsetY
    boundaryBox.yMax += offsetY
  }
  //render vectors
  for (let i = 0; i < action.vectorIndices.length; i++) {
    const vector = globalState.vector.all[action.vectorIndices[i]]
    if (vector.hidden || vector.removed) continue
    const vectorProperties = vector.vectorProperties
    const vRecordedLayerX = vector.recordedLayerX
    const vRecordedLayerY = vector.recordedLayerY
    const vEffectiveDitherOffsetX =
      ((((vector.ditherOffsetX ?? 0) + vRecordedLayerX - offsetX) % 8) + 8) % 8
    const vEffectiveDitherOffsetY =
      ((((vector.ditherOffsetY ?? 0) + vRecordedLayerY - offsetY) % 8) + 8) % 8
    const vectorCtx = createStrokeContext({
      layer: vector.layer,
      customContext: activeCtx,
      boundaryBox,
      currentColor: vector.color,
      currentModes: vector.modes,
      brushStamp: brushStamps[vector.brushType][vector.brushSize],
      brushSize: vector.brushSize,
      ditherPattern: ditherPatterns[vector.ditherPatternIndex ?? 63],
      twoColorMode: vector.modes?.twoColor ?? false,
      secondaryColor: vector.secondaryColor ?? null,
      ditherOffsetX: vEffectiveDitherOffsetX,
      ditherOffsetY: vEffectiveDitherOffsetY,
    })
    switch (vectorProperties.tool) {
      case 'fill': {
        // let tempMask = new Set([vectorProperties.px1 + offsetX, vectorProperties.py1 + offsetY])
        actionFill(
          vectorProperties.px1 + offsetX,
          vectorProperties.py1 + offsetY,
          vectorCtx,
        )
        break
      }
      case 'curve': {
        const stepNum = vector.modes.cubicCurve
          ? 3
          : vector.modes.quadCurve
            ? 2
            : 1
        actionCurve(
          vectorProperties.px1 + offsetX,
          vectorProperties.py1 + offsetY,
          vectorProperties.px2 + offsetX,
          vectorProperties.py2 + offsetY,
          vectorProperties.px3 + offsetX,
          vectorProperties.py3 + offsetY,
          vectorProperties.px4 + offsetX,
          vectorProperties.py4 + offsetY,
          stepNum,
          vectorCtx,
        )
        break
      }
      case 'ellipse':
        actionEllipse(
          vectorProperties.weight,
          vectorProperties.leftTangentX + offsetX,
          vectorProperties.leftTangentY + offsetY,
          vectorProperties.topTangentX + offsetX,
          vectorProperties.topTangentY + offsetY,
          vectorProperties.rightTangentX + offsetX,
          vectorProperties.rightTangentY + offsetY,
          vectorProperties.bottomTangentX + offsetX,
          vectorProperties.bottomTangentY + offsetY,
          vectorCtx,
        )
        break
      case 'polygon':
        actionPolygon(
          vectorProperties.px1 + offsetX,
          vectorProperties.py1 + offsetY,
          vectorProperties.px2 + offsetX,
          vectorProperties.py2 + offsetY,
          vectorProperties.px3 + offsetX,
          vectorProperties.py3 + offsetY,
          vectorProperties.px4 + offsetX,
          vectorProperties.py4 + offsetY,
          vectorCtx,
        )
        break
      default:
      //do nothing
    }
  }
}

/**
 * Helper for redrawTimelineActions
 * @param {object} action - The action to be performed
 * @param {CanvasRenderingContext2D} betweenCtx - The canvas context for saving between actions
 * @param {object|null} lastPasteAction - Most recent paste action for this layer
 * @param {object|null} lastTransformAction - Most recent transform action for this layer
 * @param {Map<number, number>|null} buildUpDensityMap - Accumulated density counts for build-up dither
 * @param {number} cropDX - horizontal crop offset delta (current - recorded), default 0
 * @param {number} cropDY - vertical crop offset delta (current - recorded), default 0
 */
export function performAction(
  action,
  betweenCtx = null,
  lastPasteAction = null,
  lastTransformAction = null,
  buildUpDensityMap = null,
  cropDX = 0,
  cropDY = 0,
) {
  if (!action?.boundaryBox) {
    return
  }
  switch (action.tool) {
    case 'brush': {
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x + cropDX
      const offsetY = action.layer.y + cropDY
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX
        boundaryBox.xMax += offsetX
        boundaryBox.yMin += offsetY
        boundaryBox.yMax += offsetY
      }
      let seen = new Set()
      let mask = null
      //TODO: (Low Priority) implement points and maskArray as an array of integers to reduce space cost. Could be stored as typed arrays but not meaningful for storing the json file.
      //points require 3 entries for every coordinate, x, y, brushSize
      //maskArray requires 2 entries for every coordinate, x, y
      if (action.maskArray) {
        // Rebuild as packed integers (y<<16)|x — the format draw.js expects.
        // maskArray stores layer-relative {x,y} objects; re-apply the current
        // layer offset and crop delta to get absolute canvas coordinates.
        mask = new Set(
          action.maskArray.map(
            (coord) => ((coord.y + offsetY) << 16) | (coord.x + offsetX),
          ),
        )
      }
      let previousX = action.points[0].x + offsetX
      let previousY = action.points[0].y + offsetY
      let brushDirection = '0,0'
      const isBuildUp = action.modes?.buildUpDither ?? false
      const buildUpSteps = action.buildUpSteps ?? [15, 31, 47, 63]
      const pattern = isBuildUp
        ? null
        : ditherPatterns[action.ditherPatternIndex ?? 63]
      // Build context once per stroke; brushSize is updated per-point below
      // since points may have individual brushSizes stored in the timeline.
      // Effective dither offset accounts for layer movement since stroke was recorded.
      // Pixels are replayed at (p.x + offsetX + cropDX), so the tile lookup must
      // shift by (recordedLayerX - offsetX - cropDX) to keep the pattern fixed to the pixels.
      const recordedLayerX = action.recordedLayerX
      const recordedLayerY = action.recordedLayerY
      const effectiveDitherOffsetX =
        ((((action.ditherOffsetX ?? 0) + recordedLayerX - offsetX) % 8) + 8) % 8
      const effectiveDitherOffsetY =
        ((((action.ditherOffsetY ?? 0) + recordedLayerY - offsetY) % 8) + 8) % 8
      const strokeCtx = createStrokeContext({
        layer: action.layer,
        customContext: betweenCtx,
        boundaryBox,
        currentColor: action.color,
        currentModes: action.modes,
        maskSet: mask,
        seenPixelsSet: seen,
        twoColorMode: action.modes?.twoColor ?? false,
        secondaryColor: action.secondaryColor,
        ditherOffsetX: effectiveDitherOffsetX,
        ditherOffsetY: effectiveDitherOffsetY,
        ditherPattern: pattern,
        densityMap: buildUpDensityMap,
        buildUpSteps,
      })
      for (const p of action.points) {
        brushDirection = calculateBrushDirection(
          p.x + offsetX,
          p.y + offsetY,
          previousX,
          previousY,
        )
        // Update per-point brushSize (timeline supports variable sizes per point)
        const isCustomStamp = action.brushType === 'custom'
        strokeCtx.brushSize = isCustomStamp ? 32 : p.brushSize
        const stamp = isCustomStamp
          ? action.customStampEntry[brushDirection]
          : brushStamps[action.brushType][p.brushSize][brushDirection]
        if (isBuildUp) {
          actionBuildUpDitherDraw(
            p.x + offsetX,
            p.y + offsetY,
            stamp,
            strokeCtx,
          )
        } else {
          actionDitherDraw(p.x + offsetX, p.y + offsetY, stamp, strokeCtx)
        }
        previousX = p.x + offsetX
        previousY = p.y + offsetY
        //If points are saved as individual pixels instead of the cursor points so that the brushStamp does not need to be iterated over, it is much faster. But it sacrifices flexibility with points.
      }
      break
    }
    case 'fill':
    case 'curve':
    case 'ellipse':
    case 'polygon':
    case 'vectorPaste':
      renderActionVectors(action, betweenCtx, cropDX, cropDY)
      break
    case 'cut': {
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x
      const offsetY = action.layer.y
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX + cropDX
        boundaryBox.xMax += offsetX + cropDX
        boundaryBox.yMin += offsetY + cropDY
        boundaryBox.yMax += offsetY + cropDY
      }
      let activeCtx = betweenCtx ? betweenCtx : action.layer.ctx
      if (action.maskSet && action.maskSet.length > 0) {
        // maskSet pixels are stored as offscreen canvas coords at the time of the cut.
        // Recover the original bounding box origin in offscreen canvas coords so that
        // each maskSet pixel's relative position is preserved even after layer moves.
        const origXMin = action.boundaryBox.xMin + (action.originalLayerX ?? 0)
        const origYMin = action.boundaryBox.yMin + (action.originalLayerY ?? 0)
        const w = boundaryBox.xMax - boundaryBox.xMin
        const h = boundaryBox.yMax - boundaryBox.yMin
        const imageData = activeCtx.getImageData(
          boundaryBox.xMin,
          boundaryBox.yMin,
          w,
          h,
        )
        const { data } = imageData
        for (const key of action.maskSet) {
          const bx = (key & 0xffff) - origXMin
          const by = ((key >> 16) & 0xffff) - origYMin
          if (bx >= 0 && bx < w && by >= 0 && by < h) {
            const idx = (by * w + bx) * 4
            data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0
          }
        }
        activeCtx.putImageData(imageData, boundaryBox.xMin, boundaryBox.yMin)
      } else {
        //Clear boundaryBox area
        activeCtx.clearRect(
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin,
        )
      }
      break
    }
    case 'paste': {
      //render paste action
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x
      const offsetY = action.layer.y
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX + cropDX
        boundaryBox.xMax += offsetX + cropDX
        boundaryBox.yMin += offsetY + cropDY
        boundaryBox.yMax += offsetY + cropDY
      }
      // Determine if the action is the last unconfirmed 'paste' action in the undoStack
      const isLastPasteAction = action === lastPasteAction
      //if action is latest paste action and not confirmed, render it (account for actions that may be later but do not have the tool name "paste")
      if (action.confirmed) {
        let activeCtx = betweenCtx ? betweenCtx : action.layer.ctx
        activeCtx.drawImage(
          action.canvas,
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin,
        )
      } else if (
        canvas.tempLayer === canvas.currentLayer && //only render if the current layer is the temp layer (active paste action)
        isLastPasteAction //only render if this action is the last paste action in the stack
      ) {
        action.layer.ctx.drawImage(
          action.canvas,
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin,
        )
      }
      break
    }
    case 'transform': {
      if (
        canvas.tempLayer === canvas.currentLayer &&
        action.pastedImageKey === globalState.clipboard.currentPastedImageKey
      ) {
        if (action === lastTransformAction) {
          //Correct action coordinates with layer offsets
          const offsetX = action.layer.x
          const offsetY = action.layer.y
          //correct boundary box for offsets
          const boundaryBox = { ...action.boundaryBox }
          if (boundaryBox.xMax !== null) {
            boundaryBox.xMin += offsetX + cropDX
            boundaryBox.xMax += offsetX + cropDX
            boundaryBox.yMin += offsetY + cropDY
            boundaryBox.yMax += offsetY + cropDY
          }
          //put transformed image data onto canvas (ok to use put image data because the layer should not have anything else on it at this point)
          transformRasterContent(
            action.layer,
            globalState.clipboard.pastedImages[action.pastedImageKey].imageData,
            boundaryBox,
            action.transformationRotationDegrees % 360,
            action.isMirroredHorizontally,
            action.isMirroredVertically,
          )
        }
      }
      break
    }
    default:
    //do nothing
  }
}
