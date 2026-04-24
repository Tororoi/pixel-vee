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
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {object} strokeCtx - StrokeContext
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
 * Render a dithered stamp from the brush to the canvas.
 * Same as actionDraw but applies a dither pattern to decide per-pixel
 * whether to draw with primary color, secondary color, or skip.
 * @param {number} coordX - (Integer)
 * @param {number} coordY - (Integer)
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {object} strokeCtx - StrokeContext
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
 * Render a dithered stamp where the dither density per pixel is determined
 * by an accumulated density map (build-up dither mode).
 * @param {number} coordX - (Integer)
 * @param {number} coordY - (Integer)
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {object} strokeCtx - StrokeContext
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
