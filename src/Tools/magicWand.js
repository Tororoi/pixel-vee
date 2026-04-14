import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { keys } from '../Shortcuts/keys.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { renderCanvas } from '../Canvas/render.js'

//==========================================//
//=== * * * Magic Wand Controller * * * ===//
//==========================================//

/**
 * Flood-fill starting at (startX, startY), returns a Set of packed (y << 16) | x integers.
 * Matches pixels with identical RGBA. Transparent pixels (a=0) are all treated as the same
 * color regardless of their RGB values (premultiplied alpha clears RGB on transparent pixels).
 * @param {number} startX - x coordinate to start flood fill from
 * @param {number} startY - y coordinate to start flood fill from
 * @param {Set<number>|null} containMask - When provided, the existing selection maskSet acts as
 *   a boundary wall. The flood fill is confined to pixels on the same side (selected vs unselected)
 *   as the start pixel, so the selection boundary cannot be crossed.
 * @returns {Set<number>} set of packed coordinates matching the flood fill
 */
function floodFill(startX, startY, containMask = null) {
  const imageData = canvas.currentLayer.ctx.getImageData(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
  const { data, width, height } = imageData
  const startIdx = (startY * width + startX) * 4
  const targetRed = data[startIdx]
  const targetGreen = data[startIdx + 1]
  const targetBlue = data[startIdx + 2]
  const targetAlpha = data[startIdx + 3]

  //Determine which "side" of the selection boundary the start pixel is on
  const startIsSelected =
    containMask !== null && containMask.has((startY << 16) | startX)

  const maskSet = new Set()
  const stack = [startY * width + startX]
  const visited = new Uint8Array(width * height)
  visited[startY * width + startX] = 1

  while (stack.length > 0) {
    const pos = stack.pop()
    const x = pos % width
    const y = (pos / width) | 0
    const i = pos * 4

    //Check if pixel color matches target
    if (targetAlpha === 0) {
      if (data[i + 3] !== 0) continue
    } else {
      if (
        data[i] !== targetRed ||
        data[i + 1] !== targetGreen ||
        data[i + 2] !== targetBlue ||
        data[i + 3] !== targetAlpha
      )
        continue
    }

    //Containment check: only traverse pixels on the same side of the selection boundary
    if (containMask !== null) {
      if (containMask.has((y << 16) | x) !== startIsSelected) continue
    }

    maskSet.add((y << 16) | x)

    const neighbors = [
      x > 0 ? pos - 1 : -1,
      x < width - 1 ? pos + 1 : -1,
      y > 0 ? pos - width : -1,
      y < height - 1 ? pos + width : -1,
    ]
    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        visited[n] = 1
        stack.push(n)
      }
    }
  }
  return maskSet
}

/**
 * Compute a bounding box from a maskSet.
 * @param {Set<number>} maskSet - set of packed (y << 16) | x coordinates
 * @returns {{ xMin: number, yMin: number, xMax: number, yMax: number }} bounding box
 */
export function boundaryBoxFromMaskSet(maskSet) {
  let xMin = Infinity,
    yMin = Infinity,
    xMax = -Infinity,
    yMax = -Infinity
  for (const key of maskSet) {
    const x = key & 0xffff
    const y = (key >> 16) & 0xffff
    if (x < xMin) xMin = x
    if (x > xMax) xMax = x
    if (y < yMin) yMin = y
    if (y > yMax) yMax = y
  }
  return { xMin, yMin, xMax: xMax + 1, yMax: yMax + 1 }
}

/**
 * Magic wand tool steps
 */
function magicWandSteps() {
  switch (canvas.pointerEvent) {
    case 'pointerdown': {
      const x = globalState.cursor.x
      const y = globalState.cursor.y
      const w = canvas.offScreenCVS.width
      const h = canvas.offScreenCVS.height
      if (x < 0 || x >= w || y < 0 || y >= h) return

      const isShift = keys.ShiftLeft || keys.ShiftRight
      const isAlt = keys.AltLeft || keys.AltRight
      //When modifying an existing selection, pass it as a containment boundary so the
      //flood fill cannot cross the selection edge (selected pixels wall off unselected ones)
      const containMask =
        (isShift || isAlt) && globalState.selection.maskSet
          ? globalState.selection.maskSet
          : null
      const newSet = floodFill(x, y, containMask)
      let changed = false

      if (isShift && globalState.selection.maskSet) {
        //Add to existing selection — changed only if newSet contributes new pixels
        //Create a new Set so the Path2D cache in select.js invalidates on reference change
        const merged = new Set(globalState.selection.maskSet)
        for (const k of newSet) {
          if (!merged.has(k)) {
            changed = true
            merged.add(k)
          }
        }
        if (changed) globalState.selection.maskSet = merged
      } else if (isAlt && globalState.selection.maskSet) {
        //Remove from existing selection — changed only if newSet overlaps current selection
        //Create a new Set so the Path2D cache in select.js invalidates on reference change
        const trimmed = new Set(globalState.selection.maskSet)
        for (const k of newSet) {
          if (trimmed.has(k)) {
            changed = true
            trimmed.delete(k)
          }
        }
        if (changed) globalState.selection.maskSet = trimmed.size > 0 ? trimmed : null
      } else {
        //Replace selection — changed if new set differs from current
        const old = globalState.selection.maskSet
        if (newSet.size === 0) {
          changed = old !== null && old.size > 0
        } else if (old === null || old.size !== newSet.size) {
          changed = true
        } else {
          for (const k of newSet) {
            if (!old.has(k)) {
              changed = true
              break
            }
          }
        }
        globalState.selection.maskSet = newSet.size > 0 ? newSet : null
      }

      //Update selection properties and boundary box
      if (globalState.selection.maskSet) {
        const bb = boundaryBoxFromMaskSet(globalState.selection.maskSet)
        globalState.selection.properties.px1 = bb.xMin
        globalState.selection.properties.py1 = bb.yMin
        globalState.selection.properties.px2 = bb.xMax
        globalState.selection.properties.py2 = bb.yMax
        globalState.selection.setBoundaryBox(globalState.selection.properties)
      } else {
        globalState.selection.resetProperties()
        globalState.selection.setBoundaryBox(globalState.selection.properties)
      }

      if (!changed) break

      addToTimeline({
        tool: globalState.tool.current.name,
        layer: canvas.currentLayer,
        properties: { deselect: false },
      })
      renderCanvas(canvas.currentLayer)
      break
    }
    default:
    //do nothing
  }
}

export const magicWand = {
  name: 'magicWand',
  fn: magicWandSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: true,
  options: {},
  modes: {},
  type: 'utility',
  cursor: 'default',
  activeCursor: 'default',
}
