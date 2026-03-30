import { brushStamps, buildCustomStampEntry } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import {
  actionDraw,
  actionDitherDraw,
  actionBuildUpDitherDraw,
} from '../Actions/pointer/draw.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { vectorGui } from './vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { isOutOfBounds } from '../utils/canvasHelpers.js'
import { getGuiLineWidth, doubleStroke } from '../utils/guiHelpers.js'
import { ditherPatterns, isDitherOn } from '../Context/ditherPatterns.js'

/**
 * Returns the active brush stamp entry and effective brush size.
 * Handles the custom stamp as a special case.
 * @returns {{ entry: object, brushSize: number }} The stamp entry and effective brush size to use for rendering
 */
function getActiveBrushStampEntry() {
  if (state.tool.current.brushType === 'custom') {
    return { entry: buildCustomStampEntry(), brushSize: 32 }
  }
  const brushSize = state.tool.current.brushSize
  return {
    entry: brushStamps[state.tool.current.brushType][brushSize],
    brushSize,
  }
}

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

/**
 * Render cursor based on active tool
 * TODO: (Low Priority) Render vectorGui cursor for vector tools with remaining control points indicator
 */
export function renderCursor() {
  switch (state.tool.current.name) {
    case 'grab':
      //show nothing
      break
    case 'eyedropper':
      //empty square
      drawCursorBox(0.5)
      break
    case 'select':
      //show nothing
      break
    case 'move':
      //show nothing
      break
    default:
      if (
        !vectorGui.selectedCollisionPresent &&
        !state.vector.collidedIndex &&
        state.vector.selectedIndices.size === 0
      ) {
        const isDitherActive =
          (state.tool.current.ditherPatternIndex !== undefined &&
            state.tool.current.ditherPatternIndex < 64) ||
          (state.tool.current.modes?.buildUpDither ?? false)
        if (state.tool.current.modes?.eraser) {
          if (vectorGui.showCursorPreview) {
            if (isDitherActive) {
              drawDitherInjectPreview()
            } else {
              drawInjectPreview()
            }
          }
          drawCursorBox(0.5)
        } else if (vectorGui.showCursorPreview) {
          if (isDitherActive) {
            if (state.tool.current.modes?.inject) {
              drawDitherInjectPreview()
            } else {
              drawDitherPreview()
            }
          } else if (state.tool.current.modes?.inject) {
            drawInjectPreview()
          } else {
            drawNormalPreview()
          }
        } else {
          // Cursor preview disabled (default): show box outline for all modes.
          drawCursorBox(0.5)
        }
      } else {
        clearLayerPreviewIfNeeded()
      }
  }
}

/**
 * Inject mode preview: accurate preview on layer.onscreenCtx because
 * clearRect+fillRect compositing must happen on the actual layer canvas.
 */
function drawInjectPreview() {
  renderCanvas(canvas.currentLayer)
  const { entry, brushSize } = getActiveBrushStampEntry()
  actionDraw(
    state.cursor.x,
    state.cursor.y,
    entry['0,0'],
    createStrokeContext({
      layer: canvas.currentLayer,
      isPreview: true,
      excludeFromSet: true,
      boundaryBox: state.selection.boundaryBox,
      currentColor: swatches.primary.color,
      currentModes: state.tool.current.modes,
      maskSet: state.selection.maskSet,
      seenPixelsSet: state.selection.seenPixelsSet,
      brushSize,
    }),
  )
}

/**
 * Inject/eraser preview for dither brush: blits the layer then applies
 * the appropriate dither draw in preview mode so only dither-pattern pixels are affected.
 */
function drawDitherInjectPreview() {
  renderCanvas(canvas.currentLayer)
  const { entry, brushSize } = getActiveBrushStampEntry()
  const stamp = entry['0,0']
  const ctx = createStrokeContext({
    layer: canvas.currentLayer,
    isPreview: true,
    excludeFromSet: true,
    boundaryBox: state.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: state.tool.current.modes,
    maskSet: state.selection.maskSet,
    seenPixelsSet: state.selection.seenPixelsSet,
    brushSize,
    ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
    twoColorMode: state.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
    densityMap: state.tool.current._buildUpDensityMap,
    buildUpSteps: state.tool.current.buildUpSteps,
  })
  if (state.tool.current.modes?.buildUpDither) {
    actionBuildUpDitherDraw(state.cursor.x, state.cursor.y, stamp, ctx)
  } else {
    actionDitherDraw(state.cursor.x, state.cursor.y, stamp, ctx)
  }
}

/**
 * Normal mode preview: draw brush stamp directly on the cursor canvas.
 * vectorGui.render() already cleared it — no layer blit needed.
 */
function drawNormalPreview() {
  const { entry, brushSize } = getActiveBrushStampEntry()
  const stamp = entry['0,0']
  const baseX = Math.ceil(state.cursor.x - brushSize / 2)
  const baseY = Math.ceil(state.cursor.y - brushSize / 2)
  canvas.cursorCTX.fillStyle = swatches.primary.color.color
  for (const pixel of stamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (
      isOutOfBounds(x, y, 0, canvas.currentLayer, state.selection.boundaryBox)
    )
      continue
    if (state.selection.maskSet && !state.selection.maskSet.has((y << 16) | x))
      continue
    canvas.cursorCTX.fillRect(x + canvas.xOffset, y + canvas.yOffset, 1, 1)
  }
}

/**
 * Dither brush preview: draw each stamp pixel on the cursor canvas,
 * filtering by the current dither pattern using absolute canvas coordinates.
 * In build-up dither mode, the pattern is determined per-pixel from the density map.
 */
function drawDitherPreview() {
  const { entry, brushSize } = getActiveBrushStampEntry()
  const stamp = entry['0,0']
  const baseX = Math.ceil(state.cursor.x - brushSize / 2)
  const baseY = Math.ceil(state.cursor.y - brushSize / 2)
  const twoColor = state.tool.current.modes?.twoColor ?? false
  const ditherOffsetX = state.tool.current.ditherOffsetX ?? 0
  const ditherOffsetY = state.tool.current.ditherOffsetY ?? 0
  const isBuildUp = state.tool.current.modes?.buildUpDither ?? false
  const densityMap = isBuildUp ? state.tool.current._buildUpDensityMap : null
  const buildUpSteps = state.tool.current.buildUpSteps
  const basePattern = isBuildUp
    ? null
    : ditherPatterns[state.tool.current.ditherPatternIndex]
  for (const pixel of stamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (
      isOutOfBounds(x, y, 0, canvas.currentLayer, state.selection.boundaryBox)
    )
      continue
    if (state.selection.maskSet && !state.selection.maskSet.has((y << 16) | x))
      continue
    let pattern
    if (isBuildUp) {
      const count = densityMap ? (densityMap.get((y << 16) | x) ?? 0) : 0
      const stepIndex = Math.min(count, buildUpSteps.length - 1)
      pattern = ditherPatterns[buildUpSteps[stepIndex]]
    } else {
      pattern = basePattern
    }
    if (isDitherOn(pattern, x, y, ditherOffsetX, ditherOffsetY)) {
      canvas.cursorCTX.fillStyle = swatches.primary.color.color
      canvas.cursorCTX.fillRect(x + canvas.xOffset, y + canvas.yOffset, 1, 1)
    } else if (twoColor) {
      canvas.cursorCTX.fillStyle = swatches.secondary.color.color
      canvas.cursorCTX.fillRect(x + canvas.xOffset, y + canvas.yOffset, 1, 1)
    }
  }
}

/**
 * Collision present — no cursor preview drawn.
 * If the preview was drawn on layer.onscreenCtx (eraser or inject with
 * preview enabled), blit the layer to clear it.
 * Normal mode cursor lives on the cursor canvas (auto-cleared by
 * vectorGui.render()), and box outline is on vectorGuiCTX (also
 * auto-cleared), so nothing extra needed for those cases.
 */
function clearLayerPreviewIfNeeded() {
  if (
    vectorGui.showCursorPreview &&
    (state.tool.current.modes?.eraser || state.tool.current.modes?.inject)
  ) {
    renderCanvas(canvas.currentLayer)
  }
}

/**
 * Used to render eyedropper cursor and eraser
 * @param {number} lineWeight - (Float)
 */
function drawCursorBox(lineWeight) {
  const lineWidth = getGuiLineWidth(lineWeight)
  const { entry, brushSize: activeBrushSize } = getActiveBrushStampEntry()
  let brushOffset = Math.floor(activeBrushSize / 2)
  let ol = lineWidth / 2 // line offset to stroke off-center

  const pixelSet = entry.pixelSet

  canvas.vectorGuiCTX.beginPath()

  for (const pixel of entry['0,0']) {
    const x = state.cursor.x + canvas.xOffset + pixel.x - brushOffset
    const y = state.cursor.y + canvas.yOffset + pixel.y - brushOffset

    // Check for neighboring pixels using the Set
    const hasTopNeighbor = pixelSet.has(((pixel.y - 1) << 16) | pixel.x)
    const hasRightNeighbor = pixelSet.has((pixel.y << 16) | (pixel.x + 1))
    const hasBottomNeighbor = pixelSet.has(((pixel.y + 1) << 16) | pixel.x)
    const hasLeftNeighbor = pixelSet.has((pixel.y << 16) | (pixel.x - 1))

    // Draw lines only for sides that don't have neighboring pixels
    if (!hasTopNeighbor) {
      canvas.vectorGuiCTX.moveTo(x, y - ol)
      canvas.vectorGuiCTX.lineTo(x + 1, y - ol)
    }
    if (!hasRightNeighbor) {
      canvas.vectorGuiCTX.moveTo(x + 1 + ol, y)
      canvas.vectorGuiCTX.lineTo(x + 1 + ol, y + 1)
    }
    if (!hasBottomNeighbor) {
      canvas.vectorGuiCTX.moveTo(x, y + 1 + ol)
      canvas.vectorGuiCTX.lineTo(x + 1, y + 1 + ol)
    }
    if (!hasLeftNeighbor) {
      canvas.vectorGuiCTX.moveTo(x - ol, y)
      canvas.vectorGuiCTX.lineTo(x - ol, y + 1)
    }
  }

  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
