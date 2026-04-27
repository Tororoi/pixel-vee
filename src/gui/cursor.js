import { brushStamps } from '../context/brushStamps.js'
import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { swatches } from '../context/swatch.js'
import {
  actionDraw,
  actionDitherDraw,
  actionBuildUpDitherDraw,
} from '../actions/pointer/draw.js'
import { createStrokeContext } from '../actions/pointer/strokeContext.js'
import { vectorGui } from './vector.js'
import { renderCanvas } from '../canvas/render.js'
import { isOutOfBounds } from '../utils/canvasHelpers.js'
import { getGuiLineWidth, doubleStroke } from '../utils/guiHelpers.js'
import { ditherPatterns, isDitherOn } from '../context/ditherPatterns.js'
import { brush, rebuildBuildUpDensityMap } from '../tools/brush.js'

/**
 * Returns the active brush stamp entry and effective brush size. Custom
 * stamps always occupy a fixed 32×32 tile regardless of the user-selected
 * brush size, so they bypass the regular size-keyed stamp table.
 * @returns {{ entry: object, brushSize: number }} Stamp entry and size
 */
function getActiveBrushStampEntry() {
  if (globalState.tool.current.brushType === 'custom') {
    return { entry: brushStamps.custom, brushSize: 32 }
  }
  const brushSize = globalState.tool.current.brushSize
  return {
    entry: brushStamps[globalState.tool.current.brushType][brushSize],
    brushSize,
  }
}

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

/**
 * Routes cursor rendering based on the active tool and current vector
 * interaction state. Grab, select, and move suppress the cursor because
 * they provide their own visual feedback; the eyedropper always shows a
 * box outline. For drawing tools, an active vector collision takes
 * priority — when a control point is under the cursor the pixel preview
 * is suppressed to avoid implying paint will be applied. The dither-active
 * check spans two conditions because build-up dither mode does not use a
 * static pattern index.
 * TODO: (Low Priority) Render vectorGui cursor for vector tools with
 * remaining control points indicator
 */
export function renderCursor() {
  switch (globalState.tool.current.name) {
    case 'grab':
      break
    case 'eyedropper':
      drawCursorBox(0.5)
      break
    case 'select':
      break
    case 'move':
      break
    default:
      if (
        !vectorGui.selectedCollisionPresent &&
        !globalState.vector.collidedIndex &&
        globalState.vector.selectedIndices.size === 0
      ) {
        // patternIndex 63 is the "dither off" sentinel; buildUpDither
        // also activates dither behavior without a static pattern index.
        const isDitherActive =
          (globalState.tool.current.ditherPatternIndex !== undefined &&
            globalState.tool.current.ditherPatternIndex < 63) ||
          (globalState.tool.current.modes?.buildUpDither ?? false)
        if (globalState.tool.current.modes?.eraser) {
          if (vectorGui.showCursorPreview) {
            if (isDitherActive) {
              drawDitherInjectPreview()
            } else {
              drawInjectPreview()
            }
          }
          // Always show the box outline for eraser so the affected
          // area is visible even when preview is off.
          drawCursorBox(0.5)
        } else if (vectorGui.showCursorPreview) {
          if (isDitherActive) {
            if (
              globalState.tool.current.modes?.inject ||
              globalState.tool.current.modes?.buildUpDither
            ) {
              drawDitherInjectPreview()
            } else {
              drawDitherPreview()
            }
          } else if (globalState.tool.current.modes?.inject) {
            drawInjectPreview()
          } else {
            drawNormalPreview()
          }
        } else {
          // No preview: fall back to box outline so the cursor is
          // still visible without writing any layer pixels.
          drawCursorBox(0.5)
        }
      } else {
        clearLayerPreviewIfNeeded()
      }
  }
}

/**
 * Renders a preview of the inject draw operation directly on the layer's
 * onscreen context. The layer is re-blitted first to wipe the previous
 * frame's preview; inject compositing (clearRect + fillRect) must happen
 * against real layer data rather than the isolated cursor canvas.
 */
function drawInjectPreview() {
  // Re-blit committed layer pixels to wipe the prior preview frame;
  // inject draws on layer.onscreenCtx so it can't self-clear.
  renderCanvas(canvas.currentLayer)
  const { entry, brushSize } = getActiveBrushStampEntry()
  actionDraw(
    globalState.cursor.x,
    globalState.cursor.y,
    entry['0,0'],
    createStrokeContext({
      layer: canvas.currentLayer,
      isPreview: true,
      excludeFromSet: true,
      boundaryBox: globalState.selection.boundaryBox,
      currentColor: swatches.primary.color,
      currentModes: globalState.tool.current.modes,
      maskSet: globalState.selection.maskSet,
      seenPixelsSet: globalState.selection.seenPixelsSet,
      brushSize,
    }),
  )
}

/**
 * Renders the dither or build-up dither preview on the layer's onscreen
 * context, where inject compositing must happen against real pixel data.
 * The density map is rebuilt lazily here rather than on every settings
 * change to avoid redundant work during rapid parameter adjustments.
 */
function drawDitherInjectPreview() {
  // Density map is built lazily to avoid thrashing during rapid
  // brush-settings changes.
  if (brush._buildUpDensityMap === null) {
    rebuildBuildUpDensityMap()
  }
  // Re-blit to wipe the prior preview frame before painting.
  renderCanvas(canvas.currentLayer)
  const { entry, brushSize } = getActiveBrushStampEntry()
  const stamp = entry['0,0']
  const ctx = createStrokeContext({
    layer: canvas.currentLayer,
    isPreview: true,
    excludeFromSet: true,
    boundaryBox: globalState.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: globalState.tool.current.modes,
    maskSet: globalState.selection.maskSet,
    seenPixelsSet: globalState.selection.seenPixelsSet,
    brushSize,
    ditherPattern: ditherPatterns[globalState.tool.current.ditherPatternIndex],
    twoColorMode: globalState.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: globalState.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: globalState.tool.current.ditherOffsetY ?? 0,
    densityMap: brush._buildUpDensityMap,
    buildUpSteps: brush.buildUpSteps,
  })
  if (globalState.tool.current.modes?.buildUpDither) {
    actionBuildUpDitherDraw(
      globalState.cursor.x,
      globalState.cursor.y,
      stamp,
      ctx,
    )
  } else {
    actionDitherDraw(globalState.cursor.x, globalState.cursor.y, stamp, ctx)
  }
}

/**
 * Paints the brush stamp preview directly onto the cursor canvas rather
 * than the layer. This is safe because vectorGui.render() already cleared
 * the cursor canvas on every frame, so no layer re-blit is needed.
 * Pixels are written individually instead of delegating to actionDraw so
 * the operation targets the cursor canvas without touching layer data.
 */
function drawNormalPreview() {
  const { entry, brushSize } = getActiveBrushStampEntry()
  const stamp = entry['0,0']
  const baseX = Math.ceil(globalState.cursor.x - brushSize / 2)
  const baseY = Math.ceil(globalState.cursor.y - brushSize / 2)
  canvas.cursorCTX.fillStyle = swatches.primary.color.color
  for (const pixel of stamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (
      isOutOfBounds(
        x,
        y,
        0,
        canvas.currentLayer,
        globalState.selection.boundaryBox,
      )
    )
      continue
    // maskSet uses the same (y << 16) | x encoding for O(1) lookup.
    if (
      globalState.selection.maskSet &&
      !globalState.selection.maskSet.has((y << 16) | x)
    )
      continue
    canvas.cursorCTX.fillRect(x + canvas.xOffset, y + canvas.yOffset, 1, 1)
  }
}

/**
 * Paints the dithered brush stamp preview onto the cursor canvas. Like
 * drawNormalPreview, it writes directly to the cursor canvas so no layer
 * re-blit is needed. In build-up dither mode the pattern tier is resolved
 * per pixel from the density map because each canvas position can have a
 * different accumulated stroke count, requiring a different threshold.
 */
function drawDitherPreview() {
  const { entry, brushSize } = getActiveBrushStampEntry()
  const stamp = entry['0,0']
  const baseX = Math.ceil(globalState.cursor.x - brushSize / 2)
  const baseY = Math.ceil(globalState.cursor.y - brushSize / 2)
  const twoColor = globalState.tool.current.modes?.twoColor ?? false
  const ditherOffsetX = globalState.tool.current.ditherOffsetX ?? 0
  const ditherOffsetY = globalState.tool.current.ditherOffsetY ?? 0
  const isBuildUp = globalState.tool.current.modes?.buildUpDither ?? false
  if (isBuildUp && brush._buildUpDensityMap === null) {
    // Rebuild lazily; rapid settings changes would thrash the map if
    // rebuilt on every parameter update.
    rebuildBuildUpDensityMap()
  }
  const densityMap = isBuildUp ? brush._buildUpDensityMap : null
  const buildUpSteps = brush.buildUpSteps
  const basePattern = isBuildUp
    ? null
    : ditherPatterns[globalState.tool.current.ditherPatternIndex]
  for (const pixel of stamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (
      isOutOfBounds(
        x,
        y,
        0,
        canvas.currentLayer,
        globalState.selection.boundaryBox,
      )
    )
      continue
    if (
      globalState.selection.maskSet &&
      !globalState.selection.maskSet.has((y << 16) | x)
    )
      continue
    let pattern
    if (isBuildUp) {
      const count = densityMap
        ? densityMap[y * canvas.offScreenCVS.width + x] || 0
        : 0
      // Clamp so strokes beyond peak density don't exceed array bounds.
      const stepIndex = Math.min(count, buildUpSteps.length - 1)
      pattern = ditherPatterns[buildUpSteps[stepIndex]]
    } else {
      pattern = basePattern
    }
    // Absolute canvas coords ensure the pattern tiles continuously
    // across the canvas, not relative to each brush stamp position.
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
 * Clears any stale preview painted on the layer's onscreen context by
 * re-blitting the committed layer data. Only eraser, inject, and
 * build-up dither write their previews to the layer's onscreen context;
 * other preview modes use the auto-cleared cursor canvas or vectorGuiCTX,
 * so no cleanup is needed for those.
 */
function clearLayerPreviewIfNeeded() {
  if (
    vectorGui.showCursorPreview &&
    (globalState.tool.current.modes?.eraser ||
      globalState.tool.current.modes?.inject ||
      globalState.tool.current.modes?.buildUpDither)
  ) {
    renderCanvas(canvas.currentLayer)
  }
}

/**
 * Renders an outline tracing the visible perimeter of the brush stamp
 * by stroking only the exposed edges of each stamp pixel, so the outline
 * hugs the actual brush shape rather than its bounding box. Edge
 * detection queries a pre-built pixelSet using bit-packed coordinates for
 * O(1) neighbor lookups. The outline is drawn into vectorGuiCTX so it
 * composites with vector GUI elements and is auto-cleared each frame. A
 * double stroke (black then white) ensures visibility over any background.
 * @param {number} lineWeight - Stroke weight multiplier (float)
 */
function drawCursorBox(lineWeight) {
  const lineWidth = getGuiLineWidth(lineWeight)
  const { entry, brushSize: activeBrushSize } = getActiveBrushStampEntry()
  let brushOffset = Math.floor(activeBrushSize / 2)
  // Half-width offset centers the stroke on the pixel boundary rather
  // than bleeding it into the pixel interior or exterior.
  let lineOffsetToCenter = lineWidth / 2

  const pixelSet = entry.pixelSet

  canvas.vectorGuiCTX.beginPath()

  for (const pixel of entry['0,0']) {
    const x = globalState.cursor.x + canvas.xOffset + pixel.x - brushOffset
    const y = globalState.cursor.y + canvas.yOffset + pixel.y - brushOffset

    // Bit-packing into a single int mirrors how pixelSet was built,
    // giving O(1) membership checks for each of the four neighbors.
    const hasTopNeighbor = pixelSet.has(((pixel.y - 1) << 16) | pixel.x)
    const hasRightNeighbor = pixelSet.has((pixel.y << 16) | (pixel.x + 1))
    const hasBottomNeighbor = pixelSet.has(((pixel.y + 1) << 16) | pixel.x)
    const hasLeftNeighbor = pixelSet.has((pixel.y << 16) | (pixel.x - 1))

    if (!hasTopNeighbor) {
      canvas.vectorGuiCTX.moveTo(x, y - lineOffsetToCenter)
      canvas.vectorGuiCTX.lineTo(x + 1, y - lineOffsetToCenter)
    }
    if (!hasRightNeighbor) {
      canvas.vectorGuiCTX.moveTo(x + 1 + lineOffsetToCenter, y)
      canvas.vectorGuiCTX.lineTo(x + 1 + lineOffsetToCenter, y + 1)
    }
    if (!hasBottomNeighbor) {
      canvas.vectorGuiCTX.moveTo(x, y + 1 + lineOffsetToCenter)
      canvas.vectorGuiCTX.lineTo(x + 1, y + 1 + lineOffsetToCenter)
    }
    if (!hasLeftNeighbor) {
      canvas.vectorGuiCTX.moveTo(x - lineOffsetToCenter, y)
      canvas.vectorGuiCTX.lineTo(x - lineOffsetToCenter, y + 1)
    }
  }

  // Double stroke (black + white) keeps the cursor visible over any
  // background color.
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
