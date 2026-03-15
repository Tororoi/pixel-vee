import { dom } from '../Context/dom.js'
import { state } from '../Context/state.js'
import { brushStamps } from '../Context/brushStamps.js'
import { updateBrushPreview } from '../utils/brushHelpers.js'
import { createOptionToggle } from '../utils/optionsInterfaceHelpers.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'

/**
 * update brush stamp in dom
 */
export function renderBrushStampToDOM() {
  dom.lineWeight.textContent = state.tool.current.brushSize
  dom.brushPreview.style.width = state.tool.current.brushSize * 2 + 'px'
  dom.brushPreview.style.height = state.tool.current.brushSize * 2 + 'px'
  updateBrushPreview(
    brushStamps[state.tool.current.brushType][state.tool.current.brushSize][
      '0,0'
    ],
    state.tool.current.brushSize,
  )
}

/**
 * Render palette interface in DOM
 */
export const renderBrushModesToDOM = () => {
  dom.modesContainer.innerHTML = ''

  //iterate through object keys in state.tool.current.options
  for (const [key, value] of Object.entries(state.tool.current.modes)) {
    const mode = document.createElement('button')
    mode.type = 'button'
    mode.className = `mode ${key}`
    mode.id = key
    switch (key) {
      case 'eraser':
        //add aria label
        mode.ariaLabel = 'Eraser (E)'
        mode.dataset.tooltip = 'Eraser (E)'
        break
      case 'perfect':
        mode.ariaLabel = 'Pixel Perfect (P)'
        mode.dataset.tooltip = 'Pixel Perfect (P)'
        break
      case 'inject':
        mode.ariaLabel = 'Inject (I)'
        mode.dataset.tooltip =
          'Inject (I) \n\nTranslucent colors will be applied directly'
        break
      case 'colorMask':
        mode.ariaLabel = 'Color Mask (M)'
        mode.dataset.tooltip =
          'Color Mask (M) \n\nOnly draw over selected secondary swatch color'
        break
      case 'twoColor':
        mode.ariaLabel = 'Two-Color'
        mode.dataset.tooltip =
          'Two-Color \n\nUse secondary color instead of transparency for dither'
        break
      default:
      //
    }
    // mode.innerHTML = key
    if (value) mode.classList.add('selected')
    dom.modesContainer.appendChild(mode)
  }
}

/**
 *
 */
export function renderToolOptionsToDOM() {
  dom.toolOptions.innerHTML = ''
  if (
    ['line', 'quadCurve', 'cubicCurve', 'ellipse', 'select'].includes(
      state.tool.current.name,
    )
  ) {
    //render cubic curve options to menu
    Object.entries(state.tool.current.options).forEach(([name, option]) => {
      let optionToggle = createOptionToggle(name, option)
      dom.toolOptions.appendChild(optionToggle)
    })
  }
}

/**
 * Show or hide dither-specific options based on active tool.
 * Also updates the preview canvas to show the current pattern.
 */
export function renderDitherOptionsToDOM() {
  const ditherSection = document.querySelector('.dither-options')
  if (!ditherSection) return

  if (state.tool.current.name === 'ditherBrush') {
    ditherSection.style.display = ''
    renderDitherPreviewCanvas()
    const checkbox = document.getElementById('dither-two-color')
    if (checkbox) {
      checkbox.checked = state.tool.current.modes?.twoColor ?? false
    }
  } else {
    ditherSection.style.display = 'none'
  }
}

/**
 * Draw the current dither pattern on the preview canvas in the brush dialog
 */
function renderDitherPreviewCanvas() {
  const previewCanvas = document.querySelector('.dither-preview-canvas')
  if (!previewCanvas) return
  const ctx = previewCanvas.getContext('2d')
  const pattern = ditherPatterns[state.tool.current.ditherPatternIndex]
  ctx.clearRect(0, 0, 8, 8)
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (pattern.data[y * 8 + x] === 1) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x, y, 1, 1)
      } else {
        ctx.fillStyle = '#333333'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Build an SVG thumbnail for a dither pattern.
 * Uses a background rect and a single stroke path for "on" pixels,
 * matching the horizontal-run format used by brush stamp icons.
 * @param {object} pattern - pattern from ditherPatterns
 * @returns {SVGElement}
 */
function createDitherPatternSVG(pattern) {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 -0.5 8 8')
  svg.setAttribute('shape-rendering', 'crispEdges')
  svg.classList.add('dither-grid-svg')

  // const bg = document.createElementNS(SVG_NS, "rect")
  // bg.setAttribute("width", "8")
  // bg.setAttribute("height", "8")
  // bg.setAttribute("fill", "#333333")
  // svg.appendChild(bg)

  let d = ''
  for (let y = 0; y < 8; y++) {
    let runStart = -1
    for (let x = 0; x < 8; x++) {
      if (pattern.data[y * 8 + x] === 1) {
        if (runStart === -1) runStart = x
      } else if (runStart !== -1) {
        d += `M${runStart} ${y}h${x - runStart}`
        runStart = -1
      }
    }
    if (runStart !== -1) {
      d += `M${runStart} ${y}h${8 - runStart}`
    }
  }
  if (d) {
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('stroke', '#ffffff')
    path.setAttribute('d', d)
    svg.appendChild(path)
  }
  return svg
}

let ditherPickerInitialized = false

/**
 * Populate the dither picker grid with 65 pattern thumbnails.
 * Called once on first open.
 */
export function initDitherPicker() {
  if (ditherPickerInitialized) return
  ditherPickerInitialized = true
  const grid = document.querySelector('.dither-grid')
  if (!grid) return
  for (let i = 0; i < ditherPatterns.length; i++) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'dither-grid-btn'
    btn.dataset.patternIndex = i
    btn.dataset.tooltip = `${Math.round((i / 64) * 100)}%`
    btn.appendChild(createDitherPatternSVG(ditherPatterns[i]))
    grid.appendChild(btn)
  }
  highlightSelectedDitherPattern()
}

/**
 * Highlight the currently selected pattern in the dither picker grid
 */
export function highlightSelectedDitherPattern() {
  const grid = document.querySelector('.dither-grid')
  if (!grid) return
  const buttons = grid.querySelectorAll('.dither-grid-btn')
  buttons.forEach((btn) => {
    if (
      parseInt(btn.dataset.patternIndex) ===
      state.tool.current.ditherPatternIndex
    ) {
      btn.classList.add('selected')
    } else {
      btn.classList.remove('selected')
    }
  })
}
