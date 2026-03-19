import { dom } from '../Context/dom.js'
import { state } from '../Context/state.js'
import { brushStamps } from '../Context/brushStamps.js'
import { updateBrushPreview } from '../utils/brushHelpers.js'
import { createOptionToggle } from '../utils/optionsInterfaceHelpers.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { swatches } from '../Context/swatch.js'

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

  //iterate through object keys in state.tool.current.modes
  for (const [key, value] of Object.entries(state.tool.current.modes)) {
    // twoColor and buildUpDither live in the dither dialog, not the modes row
    if (key === 'twoColor' || key === 'buildUpDither') continue
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

  const ditherTools = ['brush', 'line', 'quadCurve', 'cubicCurve', 'ellipse']
  if (ditherTools.includes(state.tool.current.name)) {
    ditherSection.style.display = ''
    renderDitherPreviewSVG()
    updateDitherPickerColors()
    renderDitherControlsToDOM()
  } else {
    ditherSection.style.display = 'none'
  }
}

/**
 * Sync the toggle buttons and offset sliders in the dither picker dialog
 * and the build-up dither toggle in the main toolbar.
 */
export function renderDitherControlsToDOM() {
  const twoColorBtn = document.getElementById('dither-ctrl-two-color')
  const buildUpBtn = document.getElementById('dither-ctrl-build-up')
  const isBuildUp = state.tool.current.modes?.buildUpDither ?? false
  if (twoColorBtn) {
    twoColorBtn.classList.toggle(
      'selected',
      state.tool.current.modes?.twoColor ?? false,
    )
  }
  if (buildUpBtn) {
    buildUpBtn.classList.toggle('selected', isBuildUp)
    buildUpBtn.style.display =
      state.tool.current.name === 'brush' ? '' : 'none'
  }
  renderBuildUpStepsToDOM()
  const offsetX = state.tool.current.ditherOffsetX ?? 0
  const offsetY = state.tool.current.ditherOffsetY ?? 0
  const grid = document.querySelector('.dither-grid')
  if (grid) applyDitherOffset(grid, offsetX, offsetY)
  const wrap = document.querySelector('.dither-offset-control-wrap')
  if (wrap) applyDitherOffsetControl(wrap, offsetX, offsetY)
}

/**
 * Render the build-up step slot buttons in the dither picker dialog.
 * Shows or hides the whole .build-up-steps section based on whether the mode is active.
 */
export function renderBuildUpStepsToDOM() {
  const section = document.querySelector('.build-up-steps')
  if (!section) return
  const isBuildUp = state.tool.current.modes?.buildUpDither ?? false
  section.style.display = isBuildUp ? '' : 'none'
  if (!isBuildUp) return

  // Sync mode selector buttons
  const buildUpMode = state.tool.current.buildUpMode ?? 'custom'
  section.querySelectorAll('.build-up-mode-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.mode === buildUpMode)
  })

  // Only render step slot thumbnails in custom mode
  const slots = section.querySelector('.build-up-step-slots')
  if (!slots) return
  slots.innerHTML = ''
  if (buildUpMode !== 'custom') return

  const buildUpSteps = state.tool.current.buildUpSteps ?? [16, 32, 48, 64]
  const activeSlot = state.tool.current.buildUpActiveStepSlot
  const offsetX = state.tool.current.ditherOffsetX ?? 0
  const offsetY = state.tool.current.ditherOffsetY ?? 0
  buildUpSteps.forEach((patternIndex, i) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'build-up-step-btn'
    btn.dataset.stepSlot = i
    btn.dataset.tooltip = `Step ${i + 1}: pattern ${patternIndex + 1}/65`
    if (i === activeSlot) btn.classList.add('selected')
    btn.appendChild(createDitherPatternSVG(ditherPatterns[patternIndex], offsetX, offsetY))
    slots.appendChild(btn)
  })
  updateDitherPickerColors()
}

/**
 * Render the current dither pattern as an SVG in the brush dialog preview area.
 * Replaces any existing SVG so the pattern updates when selection changes.
 */
function renderDitherPreviewSVG() {
  const previewContainer = document.querySelector('.dither-preview')
  if (!previewContainer) return
  const existing = previewContainer.querySelector('.dither-grid-svg')
  if (existing) existing.remove()
  const pattern = ditherPatterns[state.tool.current.ditherPatternIndex]
  const offsetX = state.tool.current.ditherOffsetX ?? 0
  const offsetY = state.tool.current.ditherOffsetY ?? 0
  previewContainer.appendChild(createDitherPatternSVG(pattern, offsetX, offsetY))
}

const SVG_NS = 'http://www.w3.org/2000/svg'

let _ditherSvgCounter = 0

/**
 * Build an SVG thumbnail for a dither pattern.
 * Uses a <pattern> element so the tile offset can be updated cheaply
 * by changing the pattern's x/y attributes without rebuilding the SVG.
 * @param {object} pattern - pattern from ditherPatterns
 * @param {number} [offsetX=0] - dither X offset (0–7)
 * @param {number} [offsetY=0] - dither Y offset (0–7)
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

  let d = ''
  for (let y = 0; y < 8; y++) {
    let runStart = -1
    for (let x = 0; x < 8; x++) {
      if (pattern.data[y * 8 + x] === 1) {
        if (runStart === -1) runStart = x
      } else if (runStart !== -1) {
        d += `M${runStart} ${y + 0.5}h${x - runStart}`
        runStart = -1
      }
    }
    if (runStart !== -1) {
      d += `M${runStart} ${y + 0.5}h${8 - runStart}`
    }
  }
  const path = document.createElementNS(SVG_NS, 'path')
  const primaryColor = swatches.primary.color.color
  path.setAttribute('stroke', primaryColor)
  path.setAttribute('d', d)
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
 * @returns {SVGElement}
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

  const ringColors = ['rgb(255,255,255)', 'rgb(131,131,131)', 'rgb(61,61,61)', 'rgb(31,31,31)', 'rgb(0,0,0)']
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
 * @param {number} offsetX
 * @param {number} offsetY
 */
export function applyDitherOffsetControl(container, offsetX, offsetY) {
  const pattern = container.querySelector('.dither-offset-ring-pattern')
  if (pattern) {
    pattern.setAttribute('x', String(-offsetX))
    pattern.setAttribute('y', String(-offsetY))
  }
}

/**
 * Update all dither picker SVG thumbnails to reflect current primary/secondary colors
 * and two-color mode. Call whenever colors change or two-color mode is toggled.
 */
export function updateDitherPickerColors() {
  const primaryColor = swatches.primary.color.color
  const secondaryColor = swatches.secondary.color.color
  const twoColor = state.tool.current.modes?.twoColor ?? false
  const bgFill = twoColor ? secondaryColor : 'none'
  document.querySelectorAll('.dither-bg-rect').forEach((rect) => {
    rect.setAttribute('fill', bgFill)
  })
  document.querySelectorAll('.dither-on-path').forEach((path) => {
    path.setAttribute('stroke', primaryColor)
  })
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
    btn.dataset.tooltip = i === 32 ? '33/65: Checkerboard' : `${i + 1}/65`
    btn.appendChild(createDitherPatternSVG(ditherPatterns[i]))
    grid.appendChild(btn)
  }
  const wrap = document.querySelector('.dither-offset-control-wrap')
  if (wrap) {
    const control = document.createElement('div')
    control.className = 'dither-offset-control'
    control.dataset.tooltip = 'Drag to set dither offset'
    control.appendChild(createDitherOffsetControlSVG())
    wrap.appendChild(control)
  }
  highlightSelectedDitherPattern()
}

/**
 * Highlight the currently selected pattern in the dither picker grid
 * @param {number} [patternIndex] - Pattern index to highlight; defaults to active tool's index
 */
export function highlightSelectedDitherPattern(
  patternIndex = state.tool.current.ditherPatternIndex
) {
  const grid = document.querySelector('.dither-grid')
  if (!grid) return
  const buttons = grid.querySelectorAll('.dither-grid-btn')
  buttons.forEach((btn) => {
    btn.classList.toggle(
      'selected',
      parseInt(btn.dataset.patternIndex) === patternIndex
    )
  })
}
