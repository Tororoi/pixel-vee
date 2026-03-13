import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { keys } from "../Shortcuts/keys.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { renderCanvas } from "../Canvas/render.js"

//==========================================//
//=== * * * Magic Wand Controller * * * ===//
//==========================================//

/**
 * Flood-fill starting at (startX, startY), returns a Set of packed (y << 16) | x integers.
 * Matches pixels with identical RGBA. Transparent pixels (a=0) are all treated as the same
 * color regardless of their RGB values (premultiplied alpha clears RGB on transparent pixels).
 * @param {number} startX
 * @param {number} startY
 * @param {Set<number>|null} containMask - When provided, the existing selection maskSet acts as
 *   a boundary wall. The flood fill is confined to pixels on the same side (selected vs unselected)
 *   as the start pixel, so the selection boundary cannot be crossed.
 * @returns {Set<number>}
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
  const tr = data[startIdx]
  const tg = data[startIdx + 1]
  const tb = data[startIdx + 2]
  const ta = data[startIdx + 3]

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
    if (ta === 0) {
      if (data[i + 3] !== 0) continue
    } else {
      if (
        data[i] !== tr ||
        data[i + 1] !== tg ||
        data[i + 2] !== tb ||
        data[i + 3] !== ta
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
 * @param {Set<number>} maskSet
 * @returns {{ xMin: number, yMin: number, xMax: number, yMax: number }}
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
    case "pointerdown": {
      const x = state.cursor.x
      const y = state.cursor.y
      const w = canvas.offScreenCVS.width
      const h = canvas.offScreenCVS.height
      if (x < 0 || x >= w || y < 0 || y >= h) return

      const isShift = keys.ShiftLeft || keys.ShiftRight
      const isAlt = keys.AltLeft || keys.AltRight
      //When modifying an existing selection, pass it as a containment boundary so the
      //flood fill cannot cross the selection edge (selected pixels wall off unselected ones)
      const containMask =
        (isShift || isAlt) && state.selection.maskSet
          ? state.selection.maskSet
          : null
      const newSet = floodFill(x, y, containMask)
      let changed = false

      if (isShift && state.selection.maskSet) {
        //Add to existing selection — changed only if newSet contributes new pixels
        for (const k of newSet) {
          if (!state.selection.maskSet.has(k)) {
            changed = true
            state.selection.maskSet.add(k)
          }
        }
      } else if (isAlt && state.selection.maskSet) {
        //Remove from existing selection — changed only if newSet overlaps current selection
        for (const k of newSet) {
          if (state.selection.maskSet.has(k)) {
            changed = true
            state.selection.maskSet.delete(k)
          }
        }
        if (state.selection.maskSet.size === 0) state.selection.maskSet = null
      } else {
        //Replace selection — changed if new set differs from current
        const old = state.selection.maskSet
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
        state.selection.maskSet = newSet.size > 0 ? newSet : null
      }

      //Update selection properties and boundary box
      if (state.selection.maskSet) {
        const bb = boundaryBoxFromMaskSet(state.selection.maskSet)
        state.selection.properties.px1 = bb.xMin
        state.selection.properties.py1 = bb.yMin
        state.selection.properties.px2 = bb.xMax
        state.selection.properties.py2 = bb.yMax
        state.selection.setBoundaryBox(state.selection.properties)
      } else {
        state.selection.resetProperties()
        state.selection.setBoundaryBox(state.selection.properties)
      }

      if (!changed) break

      addToTimeline({
        tool: state.tool.current.name,
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
  name: "magicWand",
  fn: magicWandSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: {},
  modes: {},
  type: "utility",
  cursor: "default",
  activeCursor: "default",
}
