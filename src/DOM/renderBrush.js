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

  if (state.tool.current.name === 'brush') {
    ditherSection.style.display = ''
    renderDitherPreviewSVG()
    updateDitherPickerColors()
    renderDitherControlsToDOM()
  } else {
    ditherSection.style.display = 'none'
  }
}

/**
 * Sync the toggle buttons in the dither picker dialog (Two-Color, Mirror H, Mirror V)
 * and the build-up dither toggle in the main toolbar.
 */
export function renderDitherControlsToDOM() {
  const twoColorBtn = document.getElementById('dither-ctrl-two-color')
  const mirrorXBtn = document.getElementById('dither-ctrl-mirror-x')
  const mirrorYBtn = document.getElementById('dither-ctrl-mirror-y')
  const buildUpBtn = document.getElementById('dither-ctrl-build-up')
  const mirrorX = state.tool.current.mirrorX ?? false
  const mirrorY = state.tool.current.mirrorY ?? false
  const isBuildUp = state.tool.current.modes?.buildUpDither ?? false
  if (twoColorBtn) {
    twoColorBtn.classList.toggle(
      'selected',
      state.tool.current.modes?.twoColor ?? false,
    )
  }
  if (mirrorXBtn) {
    mirrorXBtn.classList.toggle('selected', mirrorX)
  }
  if (mirrorYBtn) {
    mirrorYBtn.classList.toggle('selected', mirrorY)
  }
  if (buildUpBtn) {
    buildUpBtn.classList.toggle('selected', isBuildUp)
  }
  // Mirror the SVG thumbnails in the grid and preview via CSS transforms
  const grid = document.querySelector('.dither-grid')
  if (grid) {
    grid.classList.toggle('mirror-x', mirrorX)
    grid.classList.toggle('mirror-y', mirrorY)
  }
  const preview = document.querySelector('.dither-preview')
  if (preview) {
    preview.classList.toggle('mirror-x', mirrorX)
    preview.classList.toggle('mirror-y', mirrorY)
  }
  renderBuildUpStepsToDOM()
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
  buildUpSteps.forEach((patternIndex, i) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'build-up-step-btn'
    btn.dataset.stepSlot = i
    btn.dataset.tooltip = `Step ${i + 1}: pattern ${patternIndex + 1}/65`
    if (i === activeSlot) btn.classList.add('selected')
    btn.appendChild(createDitherPatternSVG(ditherPatterns[patternIndex]))
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
  previewContainer.appendChild(createDitherPatternSVG(pattern))
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Build an SVG thumbnail for a dither pattern.
 * Uses a background rect and a single stroke path for "on" pixels,
 * matching the horizontal-run format used by brush stamp icons.
 * @param {object} pattern - pattern from ditherPatterns
 * @returns {SVGElement} SVG thumbnail element
 */
function createDitherPatternSVG(pattern) {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 -0.5 8 8')
  svg.setAttribute('shape-rendering', 'crispEdges')
  svg.classList.add('dither-grid-svg')

  const bg = document.createElementNS(SVG_NS, 'rect')
  bg.setAttribute('x', '0')
  bg.setAttribute('y', '-0.5')
  bg.setAttribute('width', '8')
  bg.setAttribute('height', '8')
  bg.setAttribute('fill', 'none')
  bg.classList.add('dither-bg-rect')
  svg.appendChild(bg)

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
  const path = document.createElementNS(SVG_NS, 'path')
  const primaryColor = swatches.primary.color.color
  path.setAttribute('stroke', primaryColor)
  path.setAttribute('d', d)
  path.classList.add('dither-on-path')
  svg.appendChild(path)

  return svg
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
