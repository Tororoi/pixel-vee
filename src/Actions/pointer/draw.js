import { canvas } from '../../Context/canvas.js'
import { isOutOfBounds } from '../../utils/canvasHelpers.js'
import { isDitherOn, ditherPatterns } from '../../Context/ditherPatterns.js'

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button.

/**
 * Stamp the brush shape onto the canvas at the given coordinate.
 *
 * Iterates over each pixel in `directionalBrushStamp` (a list of offsets
 * relative to the brush center) and fills or clears it on the render context.
 * The target context is determined by the stroke settings:
 *  - `customContext` overrides everything (used for off-screen compositing).
 *  - `isPreview` targets the onscreen canvas with a viewport offset applied
 *    (used for live preview while the user is still dragging).
 *  - Otherwise the layer's persistent offscreen context is used.
 *
 * Pixels are skipped when they fall outside the boundary box, are absent
 * from the mask set, or have already been seen in the current stroke (the
 * seen-pixels set prevents overdraw on overlapping brush passes).
 *
 * In eraser / inject mode the pixel is cleared with `clearRect` before
 * being filled (or left cleared if eraser-only). In normal draw mode a
 * plain `fillRect` is used. If a `customStampColorMap` is provided each
 * pixel can receive its own color (used for custom multi-color stamp tools).
 * @param {number} coordX - Canvas X coordinate of the brush center (integer).
 * @param {number} coordY - Canvas Y coordinate of the brush center (integer).
 * @param {object} directionalBrushStamp - Array of `{x, y}` pixel offsets
 *   representing the brush shape in the current movement direction.
 * @param {object} strokeCtx - StrokeContext for this render pass.
 */
export function actionDraw(coordX, coordY, directionalBrushStamp, strokeCtx) {
  const {
    layer,
    customContext,
    isPreview,
    boundaryBox,
    maskSet,
    seenPixelsSet,
    excludeFromSet,
    currentColor,
    currentModes,
    brushSize,
    customStampColorMap,
  } = strokeCtx
  let offsetX = 0
  let offsetY = 0
  let renderCtx = layer.ctx
  if (customContext) {
    renderCtx = customContext
  } else if (isPreview) {
    // Preview renders to the visible canvas; apply the viewport offset so
    // the stamp appears at the correct screen position.
    renderCtx = layer.onscreenCtx
    offsetX = canvas.xOffset
    offsetY = canvas.yOffset
  }
  // Set fillStyle once for non-colormap mode (optimization)
  if (!customStampColorMap) {
    renderCtx.fillStyle = currentColor.color
  }
  //check if brush is outside bounds
  if (isOutOfBounds(coordX, coordY, brushSize, layer, boundaryBox)) {
    //don't iterate brush outside bounds to reduce time cost of render
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of directionalBrushStamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (isOutOfBounds(x, y, 0, layer, boundaryBox)) {
      //don't draw outside bounds to reduce time cost of render
      continue
    }
    //if maskSet exists, only draw if it contains coordinates
    if (maskSet) {
      if (!maskSet.has((y << 16) | x)) {
        continue
      }
    }
    // Skip pixels already drawn during this stroke to avoid re-applying
    // color or erase operations on the same coordinate twice.
    if (seenPixelsSet) {
      if (seenPixelsSet.has((y << 16) | x)) {
        continue // skip this point
      }
      if (!excludeFromSet) {
        seenPixelsSet.add((y << 16) | x)
      }
    }
    if (currentModes?.eraser || currentModes?.inject) {
      renderCtx.clearRect(x + offsetX, y + offsetY, 1, 1)
    }
    if (!currentModes?.eraser) {
      if (customStampColorMap) {
        renderCtx.fillStyle =
          customStampColorMap.get(`${pixel.x},${pixel.y}`) ?? currentColor.color
      }
      renderCtx.fillRect(x + offsetX, y + offsetY, 1, 1)
    }
  }
}

/**
 * Stamp the brush shape with a dither pattern applied at each pixel.
 *
 * Identical to `actionDraw` in structure but each pixel is tested against a
 * repeating dither pattern before being drawn:
 *  - If the dither pattern is ON at (x, y): draw with the primary color
 *    (or clear in eraser mode).
 *  - If the dither pattern is OFF and `twoColorMode` is enabled: draw with
 *    the secondary color (or clear in eraser mode). This lets the two colors
 *    fill the complementary halves of the pattern area.
 *  - If the dither pattern is OFF and `twoColorMode` is disabled: skip
 *    the pixel entirely, leaving whatever was there before.
 *
 * The dither offset (`ditherOffsetX`, `ditherOffsetY`) shifts the pattern
 * grid so it can be aligned independently of canvas position.
 * @param {number} coordX - Canvas X coordinate of the brush center (integer).
 * @param {number} coordY - Canvas Y coordinate of the brush center (integer).
 * @param {object} directionalBrushStamp - Array of `{x, y}` pixel offsets
 *   representing the brush shape in the current movement direction.
 * @param {object} strokeCtx - StrokeContext for this render pass.
 */
export function actionDitherDraw(
  coordX,
  coordY,
  directionalBrushStamp,
  strokeCtx,
) {
  const {
    layer,
    customContext,
    isPreview,
    boundaryBox,
    maskSet,
    seenPixelsSet,
    excludeFromSet,
    currentColor,
    currentModes,
    brushSize,
    ditherPattern,
    twoColorMode,
    secondaryColor,
    ditherOffsetX,
    ditherOffsetY,
  } = strokeCtx
  let offsetX = 0
  let offsetY = 0
  let renderCtx = layer.ctx
  if (customContext) {
    renderCtx = customContext
  } else if (isPreview) {
    renderCtx = layer.onscreenCtx
    offsetX = canvas.xOffset
    offsetY = canvas.yOffset
  }
  if (isOutOfBounds(coordX, coordY, brushSize, layer, boundaryBox)) {
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of directionalBrushStamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (isOutOfBounds(x, y, 0, layer, boundaryBox)) {
      continue
    }
    if (maskSet) {
      if (!maskSet.has((y << 16) | x)) {
        continue
      }
    }
    if (seenPixelsSet) {
      if (seenPixelsSet.has((y << 16) | x)) {
        continue
      }
      if (!excludeFromSet) {
        seenPixelsSet.add((y << 16) | x)
      }
    }
    const isOn = isDitherOn(ditherPattern, x, y, ditherOffsetX, ditherOffsetY)
    if (isOn) {
      if (currentModes?.eraser || currentModes?.inject) {
        renderCtx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        renderCtx.fillStyle = currentColor.color
        renderCtx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    } else if (twoColorMode && secondaryColor) {
      if (currentModes?.eraser || currentModes?.inject) {
        renderCtx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        renderCtx.fillStyle = secondaryColor.color
        renderCtx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    }
  }
}

/**
 * Stamp the brush shape using a build-up dither mode driven by a density map.
 *
 * Rather than using a fixed dither pattern, this mode selects which pattern
 * to apply at each pixel based on how many times that pixel has been visited
 * during the current stroke (`densityMap`). As a pixel is painted over more
 * times its density count increases, and `buildUpSteps` maps those counts to
 * progressively denser dither patterns, creating an ink-build-up effect.
 *
 * At count 0 (first touch) the sparsest pattern in `buildUpSteps` is used.
 * At the maximum count the densest pattern is used. Once the density reaches
 * the fully filled step the pixel renders solid regardless of subsequent passes.
 *
 * `twoColorMode` fills OFF-pixels with the secondary color in the same way
 * as `actionDitherDraw`.
 * @param {number} coordX - Canvas X coordinate of the brush center (integer).
 * @param {number} coordY - Canvas Y coordinate of the brush center (integer).
 * @param {object} directionalBrushStamp - Array of `{x, y}` pixel offsets
 *   representing the brush shape in the current movement direction.
 * @param {object} strokeCtx - StrokeContext for this render pass. Must
 *   include `densityMap` (typed array indexed by `y * width + x`) and
 *   `buildUpSteps` (array of dither-pattern keys ordered from sparse to dense).
 */
export function actionBuildUpDitherDraw(
  coordX,
  coordY,
  directionalBrushStamp,
  strokeCtx,
) {
  const {
    layer,
    customContext,
    isPreview,
    boundaryBox,
    maskSet,
    seenPixelsSet,
    excludeFromSet,
    currentColor,
    currentModes,
    brushSize,
    twoColorMode,
    secondaryColor,
    ditherOffsetX,
    ditherOffsetY,
    densityMap,
    buildUpSteps,
  } = strokeCtx
  let offsetX = 0
  let offsetY = 0
  let renderCtx = layer.ctx
  if (customContext) {
    renderCtx = customContext
  } else if (isPreview) {
    renderCtx = layer.onscreenCtx
    offsetX = canvas.xOffset
    offsetY = canvas.yOffset
  }
  if (isOutOfBounds(coordX, coordY, brushSize, layer, boundaryBox)) {
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of directionalBrushStamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (isOutOfBounds(x, y, 0, layer, boundaryBox)) {
      continue
    }
    if (maskSet) {
      if (!maskSet.has((y << 16) | x)) {
        continue
      }
    }
    if (seenPixelsSet) {
      if (seenPixelsSet.has((y << 16) | x)) {
        continue
      }
      if (!excludeFromSet) {
        seenPixelsSet.add((y << 16) | x)
      }
    }
    // Look up how many times this pixel has been covered so far and select
    // the corresponding dither pattern from the build-up sequence.
    const count = densityMap ? densityMap[y * layer.cvs.width + x] || 0 : 0
    const stepIndex = Math.min(count, buildUpSteps.length - 1)
    const pattern = ditherPatterns[buildUpSteps[stepIndex]]
    const isOn = isDitherOn(pattern, x, y, ditherOffsetX, ditherOffsetY)
    if (isOn) {
      if (currentModes?.eraser || currentModes?.inject) {
        renderCtx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        renderCtx.fillStyle = currentColor.color
        renderCtx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    } else if (twoColorMode) {
      if (currentModes?.eraser || currentModes?.inject) {
        renderCtx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        renderCtx.fillStyle = secondaryColor.color
        renderCtx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    }
  }
}
