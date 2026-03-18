import { canvas } from '../../Context/canvas.js'
import { isOutOfBounds } from '../../utils/canvasHelpers.js'
import { isDitherOn, ditherPatterns } from '../../Context/ditherPatterns.js'

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button.

/**
 * Render a stamp from the brush to the canvas
 * @param {number} coordX - (Integer)
 * @param {number} coordY - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {number} brushSize - (Integer)
 * @param {object} layer - the affected layer
 * @param {object} currentModes - {eraser, inject, perfect, colorMask}
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {Set} seenPixelsSet - set of coordinates already drawn on
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by renderCursor and perfect pixels mode
 * @param {boolean} excludeFromSet - don't add to seenPixelsSet if true
 */
export function actionDraw(
  coordX,
  coordY,
  boundaryBox,
  currentColor,
  directionalBrushStamp,
  brushSize,
  layer,
  currentModes,
  maskSet,
  seenPixelsSet,
  customContext = null,
  isPreview = false,
  excludeFromSet = false,
) {
  let offsetX = 0
  let offsetY = 0
  let ctx = layer.ctx
  if (customContext) {
    ctx = customContext
  } else if (isPreview) {
    ctx = layer.onscreenCtx
    offsetX = canvas.xOffset
    offsetY = canvas.yOffset
  }
  ctx.fillStyle = currentColor.color
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
    if (seenPixelsSet) {
      if (seenPixelsSet.has((y << 16) | x)) {
        continue // skip this point
      }
      if (!excludeFromSet) {
        seenPixelsSet.add((y << 16) | x)
      }
    }
    if (currentModes?.eraser || currentModes?.inject) {
      ctx.clearRect(x + offsetX, y + offsetY, 1, 1)
    }
    if (!currentModes?.eraser) {
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
    }
  }
}

/**
 * Render a dithered stamp from the brush to the canvas.
 * Same as actionDraw but applies a dither pattern to decide per-pixel
 * whether to draw with primary color, secondary color, or skip.
 * @param {number} coordX - (Integer)
 * @param {number} coordY - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {number} brushSize - (Integer)
 * @param {object} layer - the affected layer
 * @param {object} currentModes - {eraser, inject, perfect, colorMask, twoColor}
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {Set} seenPixelsSet - set of coordinates already drawn on
 * @param {object} ditherPattern - pattern object from ditherPatterns
 * @param {boolean} twoColorMode - if true, "off" pixels use secondaryColor
 * @param {object} secondaryColor - {color, r, g, b, a} for two-color mode
 * @param {boolean} mirrorX - flip the dither pattern horizontally
 * @param {boolean} mirrorY - flip the dither pattern vertically
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview
 * @param {boolean} excludeFromSet - don't add to seenPixelsSet if true
 */
export function actionDitherDraw(
  coordX,
  coordY,
  boundaryBox,
  currentColor,
  directionalBrushStamp,
  brushSize,
  layer,
  currentModes,
  maskSet,
  seenPixelsSet,
  ditherPattern,
  twoColorMode,
  secondaryColor,
  mirrorX = false,
  mirrorY = false,
  customContext = null,
  isPreview = false,
  excludeFromSet = false,
) {
  let offsetX = 0
  let offsetY = 0
  let ctx = layer.ctx
  if (customContext) {
    ctx = customContext
  } else if (isPreview) {
    ctx = layer.onscreenCtx
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
    const isOn = isDitherOn(ditherPattern, x, y, mirrorX, mirrorY)
    if (isOn) {
      if (currentModes?.eraser || currentModes?.inject) {
        ctx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        ctx.fillStyle = currentColor.color
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    } else if (twoColorMode && secondaryColor) {
      if (currentModes?.eraser || currentModes?.inject) {
        ctx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        ctx.fillStyle = secondaryColor.color
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    }
  }
}

/**
 * Render a dithered stamp where the dither density per pixel is determined
 * by an accumulated density map (build-up dither mode).
 * @param {number} coordX - (Integer)
 * @param {number} coordY - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {number} brushSize - (Integer)
 * @param {object} layer - the affected layer
 * @param {object} currentModes - {eraser, inject, perfect, colorMask, twoColor}
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {Set} seenPixelsSet - set of coordinates already drawn on
 * @param {Map} densityMap - Map<(y<<16)|x, count> of prior stroke coverage
 * @param {number[]} buildUpSteps - array of dither pattern indices, one per density level
 * @param {boolean} twoColorMode - if true, "off" pixels use secondaryColor
 * @param {object} secondaryColor - {color, r, g, b, a} for two-color mode
 * @param {boolean} mirrorX - flip the dither pattern horizontally
 * @param {boolean} mirrorY - flip the dither pattern vertically
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview
 * @param {boolean} excludeFromSet - don't add to seenPixelsSet if true
 */
export function actionBuildUpDitherDraw(
  coordX,
  coordY,
  boundaryBox,
  currentColor,
  directionalBrushStamp,
  brushSize,
  layer,
  currentModes,
  maskSet,
  seenPixelsSet,
  densityMap,
  buildUpSteps,
  twoColorMode,
  secondaryColor,
  mirrorX = false,
  mirrorY = false,
  customContext = null,
  isPreview = false,
  excludeFromSet = false,
) {
  let offsetX = 0
  let offsetY = 0
  let ctx = layer.ctx
  if (customContext) {
    ctx = customContext
  } else if (isPreview) {
    ctx = layer.onscreenCtx
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
    const count = densityMap ? (densityMap.get((y << 16) | x) ?? 0) : 0
    const stepIndex = Math.min(count, buildUpSteps.length - 1)
    const pattern = ditherPatterns[buildUpSteps[stepIndex]]
    const isOn = isDitherOn(pattern, x, y, mirrorX, mirrorY)
    if (isOn) {
      if (currentModes?.eraser || currentModes?.inject) {
        ctx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        ctx.fillStyle = currentColor.color
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    } else if (twoColorMode) {
      if (currentModes?.eraser || currentModes?.inject) {
        ctx.clearRect(x + offsetX, y + offsetY, 1, 1)
      }
      if (!currentModes?.eraser) {
        ctx.fillStyle = secondaryColor.color
        ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
      }
    }
  }
}
