import { globalState } from '../Context/state.js'
import { swatches } from '../Context/swatch.js'

/**
 * Brush stamp display — React reads globalState.tool.current via useAppState().
 */
export function renderBrushStampToDOM() {
}

/**
 * Brush modes row — React reads globalState.tool.current.modes via useAppState().
 */
export const renderBrushModesToDOM = () => {
}

/**
 * Tool options row — React reads globalState.tool.current.options via useAppState().
 */
export function renderToolOptionsToDOM() {
}

const SVG_NS = 'http://www.w3.org/2000/svg'

let _ditherSvgCounter = 0

/**
 * Build an SVG thumbnail for a dither pattern.
 * Uses a <pattern> element so the tile offset can be updated cheaply
 * by changing the pattern's x/y attributes without rebuilding the SVG.
 * @param {object} pattern - pattern from ditherPatterns
 * @param {number} [offsetX] - dither X offset (0–7)
 * @param {number} [offsetY] - dither Y offset (0–7)
 * @returns {SVGElement} SVG thumbnail element
 */
export function createDitherPatternSVG(pattern, offsetX = 0, offsetY = 0) {
  const id = `dtp-${_ditherSvgCounter++}`
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 8 8')
  svg.setAttribute('shape-rendering', 'crispEdges')
  svg.classList.add('dither-grid-svg')

  const defs = document.createElementNS(SVG_NS, 'defs')
  const patternEl = document.createElementNS(SVG_NS, 'pattern')
  patternEl.setAttribute('id', id)
  patternEl.setAttribute('patternUnits', 'userSpaceOnUse')
  patternEl.setAttribute('x', String(-offsetX))
  patternEl.setAttribute('y', String(-offsetY))
  patternEl.setAttribute('width', '8')
  patternEl.setAttribute('height', '8')
  patternEl.classList.add('dither-tile-pattern')

  const bg = document.createElementNS(SVG_NS, 'rect')
  bg.setAttribute('x', '0')
  bg.setAttribute('y', '0')
  bg.setAttribute('width', '8')
  bg.setAttribute('height', '8')
  bg.setAttribute('fill', 'none')
  bg.classList.add('dither-bg-rect')
  patternEl.appendChild(bg)

  let pathData = ''
  for (let y = 0; y < 8; y++) {
    let runStart = -1
    for (let x = 0; x < 8; x++) {
      if (pattern.data[y * 8 + x] === 1) {
        if (runStart === -1) runStart = x
      } else if (runStart !== -1) {
        pathData += `M${runStart} ${y + 0.5}h${x - runStart}`
        runStart = -1
      }
    }
    if (runStart !== -1) {
      pathData += `M${runStart} ${y + 0.5}h${8 - runStart}`
    }
  }
  const path = document.createElementNS(SVG_NS, 'path')
  const primaryColor = swatches.primary.color.color
  path.setAttribute('stroke', primaryColor)
  path.setAttribute('d', pathData)
  path.classList.add('dither-on-path')
  patternEl.appendChild(path)

  defs.appendChild(patternEl)
  svg.appendChild(defs)

  const displayRect = document.createElementNS(SVG_NS, 'rect')
  displayRect.setAttribute('x', '0')
  displayRect.setAttribute('y', '0')
  displayRect.setAttribute('width', '8')
  displayRect.setAttribute('height', '8')
  displayRect.setAttribute('fill', `url(#${id})`)
  svg.appendChild(displayRect)

  return svg
}

/**
 * Update the dither tile offset on all pattern elements within a container.
 * Sets pattern x/y attributes to -offsetX/-offsetY for correct visual shift.
 * @param {Element} container - DOM element to search within
 * @param {number} offsetX - dither X offset (0–7)
 * @param {number} offsetY - dither Y offset (0–7)
 */
export function applyDitherOffset(container, offsetX, offsetY) {
  container.querySelectorAll('.dither-tile-pattern').forEach((p) => {
    p.setAttribute('x', String(-offsetX))
    p.setAttribute('y', String(-offsetY))
  })
}

let _offsetControlCounter = 0

/**
 * Build the 2D offset control SVG — an 8×8 ring pattern where pixels at even
 * toroidal Chebyshev distance from (0,0) are drawn in the primary color.
 * The pattern element's x/y attributes are updated by applyDitherOffsetControl
 * to shift which pixel appears as the "center" without rebuilding the SVG.
 * @returns {SVGElement} The constructed dither offset control SVG element
 */
export function createDitherOffsetControlSVG() {
  const id = `dor-${_offsetControlCounter++}`
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 8 8')
  svg.setAttribute('shape-rendering', 'crispEdges')
  svg.classList.add('dither-offset-svg')

  const defs = document.createElementNS(SVG_NS, 'defs')
  const patternEl = document.createElementNS(SVG_NS, 'pattern')
  patternEl.setAttribute('id', id)
  patternEl.setAttribute('patternUnits', 'userSpaceOnUse')
  patternEl.setAttribute('x', '0')
  patternEl.setAttribute('y', '0')
  patternEl.setAttribute('width', '8')
  patternEl.setAttribute('height', '8')
  patternEl.classList.add('dither-offset-ring-pattern')

  const ringColors = [
    'rgb(255,255,255)',
    'rgb(131,131,131)',
    'rgb(61,61,61)',
    'rgb(31,31,31)',
    'rgb(0,0,0)',
  ]
  const ringPaths = ['', '', '', '', '']
  for (let y = 0; y < 8; y++) {
    const dy = Math.min(y, 8 - y)
    const runs = [[], [], [], [], []]
    let curDist = -1
    let runStart = -1
    for (let x = 0; x <= 8; x++) {
      const dist = x < 8 ? Math.max(Math.min(x, 8 - x), dy) : -1
      if (dist === curDist) continue
      if (runStart !== -1) runs[curDist].push([runStart, x])
      runStart = x < 8 ? x : -1
      curDist = dist
    }
    for (let dist = 0; dist <= 4; dist++) {
      for (const [start, end] of runs[dist]) {
        ringPaths[dist] += `M${start} ${y + 0.5}h${end - start}`
      }
    }
  }
  for (let dist = 0; dist <= 4; dist++) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('stroke', ringColors[dist])
    path.setAttribute('d', ringPaths[dist])
    patternEl.appendChild(path)
  }

  defs.appendChild(patternEl)
  svg.appendChild(defs)

  const displayRect = document.createElementNS(SVG_NS, 'rect')
  displayRect.setAttribute('x', '0')
  displayRect.setAttribute('y', '0')
  displayRect.setAttribute('width', '8')
  displayRect.setAttribute('height', '8')
  displayRect.setAttribute('fill', `url(#${id})`)
  svg.appendChild(displayRect)

  return svg
}

/**
 * Update the offset control's ring pattern phase.
 * Setting x=offsetX, y=offsetY makes the dist=0 pixel appear at (offsetX, offsetY).
 * @param {Element} container - element containing the control
 * @param {number} offsetX - Horizontal offset value to apply to the ring pattern
 * @param {number} offsetY - Vertical offset value to apply to the ring pattern
 */
export function applyDitherOffsetControl(container, offsetX, offsetY) {
  const pattern = container.querySelector('.dither-offset-ring-pattern')
  if (pattern) {
    pattern.setAttribute('x', String(-offsetX))
    pattern.setAttribute('y', String(-offsetY))
  }
  const spans = container.querySelectorAll('.dither-offset-values span')
  if (spans.length === 2) {
    spans[0].textContent = `X: ${offsetX}`
    spans[1].textContent = `Y: ${offsetY}`
  }
}

/**
 * Update all dither picker SVG thumbnails to reflect current primary/secondary colors
 * and two-color mode. Call whenever colors change or two-color mode is toggled.
 */
export function updateDitherPickerColors() {
  const primaryColor = swatches.primary.color.color
  const secondaryColor = swatches.secondary.color.color
  const twoColor = globalState.tool.current.modes?.twoColor ?? false
  const bgFill = twoColor ? secondaryColor : 'none'
  document.querySelectorAll('.dither-bg-rect').forEach((rect) => {
    rect.setAttribute('fill', bgFill)
  })
  document.querySelectorAll('.dither-on-path').forEach((path) => {
    path.setAttribute('stroke', primaryColor)
  })
}
