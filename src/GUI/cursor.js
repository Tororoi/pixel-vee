import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { actionDraw } from '../Actions/pointerActions.js'
import { vectorGui } from './vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { isOutOfBounds } from '../utils/canvasHelpers.js'

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
      drawCursorBox(2)
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
        if (
          !state.tool.current.modes?.eraser &&
          !state.tool.current.modes?.inject
        ) {
          // Normal mode: draw preview on cursor canvas.
          // vectorGui.render() already cleared it, so no layer blit needed.
          const brushSize = state.tool.current.brushSize
          const stamp =
            brushStamps[state.tool.current.brushType][brushSize]['0,0']
          const baseX = Math.ceil(state.cursor.x - brushSize / 2)
          const baseY = Math.ceil(state.cursor.y - brushSize / 2)
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
                state.selection.boundaryBox,
              )
            )
              continue
            if (
              state.selection.maskSet &&
              !state.selection.maskSet.has((y << 16) | x)
            )
              continue
            canvas.cursorCTX.fillRect(
              x + canvas.xOffset,
              y + canvas.yOffset,
              1,
              1,
            )
          }
        } else {
          // Eraser / inject: accurate preview requires drawing on the layer
          // canvas so transparency and compositing behave correctly.
          renderCanvas(canvas.currentLayer)
          actionDraw(
            state.cursor.x,
            state.cursor.y,
            state.selection.boundaryBox,
            swatches.primary.color,
            brushStamps[state.tool.current.brushType][
              state.tool.current.brushSize
            ]['0,0'],
            state.tool.current.brushSize,
            canvas.currentLayer,
            state.tool.current.modes,
            state.selection.maskSet,
            state.selection.seenPixelsSet,
            null,
            true,
            true,
          )
          if (state.tool.current.modes?.eraser) {
            drawCursorBox(1)
          }
        }
      } else {
        // Collision present — no cursor preview drawn.
        // For eraser/inject the preview is on layer.onscreenCtx, so we need
        // to blit the layer to clear any leftover preview pixel.
        if (
          state.tool.current.modes?.eraser ||
          state.tool.current.modes?.inject
        ) {
          renderCanvas(canvas.currentLayer)
        }
        // Normal mode cursor lives on the cursor canvas which is already
        // cleared by vectorGui.render(), so nothing extra needed.
      }
  }
}

/**
 * Used to render eyedropper cursor and eraser
 * @param {number} lineWeight - (Float)
 */
function drawCursorBox(lineWeight) {
  let lineWidth =
    canvas.zoom <= 8 ? lineWeight / canvas.zoom : 0.125 * lineWeight
  let brushOffset = Math.floor(state.tool.current.brushSize / 2)
  let ol = lineWidth / 2 // line offset to stroke off-center

  const pixelSet =
    brushStamps[state.tool.current.brushType][state.tool.current.brushSize]
      .pixelSet

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = 'white'

  for (const pixel of brushStamps[state.tool.current.brushType][
    state.tool.current.brushSize
  ]['0,0']) {
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

  canvas.vectorGuiCTX.stroke()
}
