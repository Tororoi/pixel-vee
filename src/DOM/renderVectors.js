import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { getAngle } from "../utils/trig.js"
import {
  createModeElement,
  createToolElement,
  createColorElement,
  createHideElement,
  createTrashElement,
  createSettingsElement,
} from "../utils/actionInterfaceHelpers.js"
import { ditherPatterns } from "../Context/ditherPatterns.js"

/**
 * Render vectors interface in DOM
 */
export const renderVectorsToDOM = () => {
  dom.vectorsThumbnails.innerHTML = ""
  // Build once per render so isValidVector can use O(1) Set.has() instead of O(n) Array.includes()
  const undoStackSet = new Set(state.timeline.undoStack)
  for (let vector of Object.values(state.vector.all)) {
    if (isValidVector(vector, undoStackSet)) {
      renderVectorElement(vector)
    }
  }

  //active paste happening, disable vector interface
  if (canvas.pastedLayer) {
    dom.vectorsInterfaceContainer.classList.add("disabled")
  } else {
    dom.vectorsInterfaceContainer.classList.remove("disabled")
  }
}

/**
 * Check if action should be rendered in the vectors interface
 * @param {object} vector - The vector to be checked
 * @param {Set} undoStackSet - Pre-built Set of undoStack actions for O(1) lookup
 * @returns {boolean} - True if the vector should be rendered
 */
const isValidVector = (vector, undoStackSet) =>
  !vector.removed &&
  !vector.layer?.removed &&
  undoStackSet.has(vector.action) &&
  (vector.layer === canvas.currentLayer ||
    (vector.layer === canvas.pastedLayer && canvas.currentLayer.isPreview))

/**
 * Render a vector element
 * @param {object} vector - The vector to be rendered
 */
const renderVectorElement = (vector) => {
  // const isSelected = vector.index === state.vector.currentIndex
  const isSelected = state.vector.selectedIndices.has(vector.index) //TODO: (Low Priority) Need better way to mark selected vs current vector in vector interface
  const isCurrentVector = vector.index === state.vector.currentIndex
  const vectorElement = createVectorElement(vector)

  const thumb = createThumbnailImage(vector, isSelected)
  vectorElement.appendChild(thumb)

  // Left side: tool type, color swatch, hide/show, trash
  const left = document.createElement("div")
  left.className = "left"
  left.appendChild(createToolElement(vector.vectorProperties.type, isCurrentVector))
  left.appendChild(createColorElement(vector.color))
  left.appendChild(createHideElement(vector.hidden, "Hide/Show Vector"))
  left.appendChild(createTrashElement("Remove Vector"))
  vectorElement.appendChild(left)

  // Right side: settings gear
  vectorElement.appendChild(createSettingsElement("Vector Settings"))

  vectorElement.style.background = isSelected ? "rgb(0, 0, 0)" : "rgb(51, 51, 51)"

  dom.vectorsThumbnails.appendChild(vectorElement)
  //associate object
  vectorElement.vectorObj = vector
}

/**
 * Build the vector settings dialog for the given vector element and position it.
 * @param {HTMLElement} domVector - The .vector DOM element whose gear was clicked
 */
export function renderVectorSettingsToDOM(domVector) {
  const vector = domVector.vectorObj
  dom.vectorSettingsContainer.innerHTML = ""

  // Header
  const header = document.createElement("div")
  header.className = "header"
  const dragBtn = document.createElement("div")
  dragBtn.className = "drag-btn locked"
  const grip = document.createElement("div")
  grip.className = "grip"
  dragBtn.appendChild(grip)
  header.appendChild(dragBtn)
  const headerTitle = document.createElement("span")
  headerTitle.textContent = "Vector Settings"
  header.appendChild(headerTitle)
  const headerCloseBtn = document.createElement("button")
  headerCloseBtn.type = "button"
  headerCloseBtn.className = "close-btn"
  headerCloseBtn.ariaLabel = "Close"
  header.appendChild(headerCloseBtn)
  dom.vectorSettingsContainer.appendChild(header)

  // Mode toggles
  const modesRow = document.createElement("div")
  modesRow.className = "vector-settings-modes"
  const modeTooltips = { eraser: "Eraser", inject: "Inject", twoColor: "Two-Color" }
  for (const modeKey of ["eraser", "inject", "twoColor"]) {
    if (!(modeKey in vector.modes)) continue
    const btn = createModeElement(modeKey, vector.modes[modeKey])
    btn.dataset.tooltip = modeTooltips[modeKey]
    modesRow.appendChild(btn)
  }
  dom.vectorSettingsContainer.appendChild(modesRow)

  // Primary color
  const primaryRow = document.createElement("div")
  primaryRow.className = "vector-settings-color-row"
  const primaryLabel = document.createElement("span")
  primaryLabel.textContent = "Primary"
  const primaryBtn = createColorElement(vector.color)
  primaryBtn.classList.add("primary-color")
  primaryRow.appendChild(primaryLabel)
  primaryRow.appendChild(primaryBtn)
  dom.vectorSettingsContainer.appendChild(primaryRow)

  // Secondary color
  const secondaryRow = document.createElement("div")
  secondaryRow.className = "vector-settings-color-row"
  const secondaryLabel = document.createElement("span")
  secondaryLabel.textContent = "Secondary"
  const secColor = vector.secondaryColor ?? { r: 0, g: 0, b: 0, a: 0, color: "rgba(0,0,0,0)" }
  const secondaryBtn = createColorElement(secColor)
  secondaryBtn.classList.add("secondary-color")
  secondaryRow.appendChild(secondaryLabel)
  secondaryRow.appendChild(secondaryBtn)
  dom.vectorSettingsContainer.appendChild(secondaryRow)

  // Dither pattern
  const ditherRow = document.createElement("div")
  ditherRow.className = "vector-settings-dither-row"
  const ditherLabel = document.createElement("span")
  ditherLabel.textContent = "Dither"
  const ditherPreview = document.createElement("button")
  ditherPreview.type = "button"
  ditherPreview.className = "vector-dither-preview"
  ditherPreview.appendChild(
    createVectorDitherPatternSVG(ditherPatterns[vector.ditherPatternIndex ?? 64], vector)
  )
  ditherRow.appendChild(ditherLabel)
  ditherRow.appendChild(ditherPreview)
  dom.vectorSettingsContainer.appendChild(ditherRow)

  // Brush size
  const brushRow = document.createElement("label")
  brushRow.className = "vector-settings-brush-row"
  const brushDisplay = document.createElement("span")
  brushDisplay.className = "vector-brush-size-display"
  brushDisplay.textContent = `Size: ${vector.brushSize ?? 1}`
  const brushSlider = document.createElement("input")
  brushSlider.type = "range"
  brushSlider.min = "1"
  brushSlider.max = "32"
  brushSlider.value = String(vector.brushSize ?? 1)
  brushSlider.className = "slider vector-brush-size-slider"
  brushRow.appendChild(brushDisplay)
  brushRow.appendChild(brushSlider)
  dom.vectorSettingsContainer.appendChild(brushRow)

  // Position relative to domVector
  const rect = domVector.getBoundingClientRect()
  dom.vectorSettingsContainer.style.top = `${
    rect.top -
    dom.vectorSettingsContainer.offsetHeight / 2 +
    domVector.offsetHeight / 2
  }px`
  dom.vectorSettingsContainer.style.left = `${rect.right + 12}px`
}

/**
 * @param {object} vector - The vector to be rendered
 * @returns {Element} - The created vector element
 */
const createVectorElement = (vector) => {
  let vectorElement = document.createElement("div")
  vectorElement.className = `vector ${vector.index}`
  vectorElement.id = vector.index
  return vectorElement
}

// * Thumbnail * //

/**
 * Calculate the multiplier and offsets for transposing the main canvas onto the thumbnail canvas
 * @returns {object} - The calculated dimensions
 */
const calculateDrawingDimensions = () => {
  let border = 32
  let wd =
    canvas.thumbnailCVS.width /
    canvas.sharpness /
    (canvas.offScreenCVS.width + border)
  let hd =
    canvas.thumbnailCVS.height /
    canvas.sharpness /
    (canvas.offScreenCVS.height + border)
  let minD = Math.min(wd, hd)
  let xOffset =
    (canvas.thumbnailCVS.width / 2 -
      (minD * canvas.offScreenCVS.width * canvas.sharpness) / 2) /
    canvas.sharpness
  let yOffset =
    (canvas.thumbnailCVS.height / 2 -
      (minD * canvas.offScreenCVS.height * canvas.sharpness) / 2) /
    canvas.sharpness

  return { minD, xOffset, yOffset }
}

/**
 * Draw a vector onto a canvas context (shared thumbnailCTX by default, or a
 * per-vector ctx when creating individual thumbnail elements).
 * @param {object} vector - The vector to be drawn
 * @param {boolean} isSelected - True if the vector is selected
 * @param {CanvasRenderingContext2D} ctx - Target context (defaults to shared thumbnailCTX)
 */
const drawOnThumbnailContext = (vector, isSelected, ctx = canvas.thumbnailCTX) => {
  let { minD, xOffset, yOffset } = calculateDrawingDimensions()

  ctx.clearRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  ctx.lineWidth = 3
  ctx.fillStyle = isSelected
    ? "rgb(0, 0, 0)"
    : "rgb(51, 51, 51)"
  ctx.fillRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  ctx.clearRect(
    xOffset,
    yOffset,
    minD * canvas.offScreenCVS.width,
    minD * canvas.offScreenCVS.height
  )

  ctx.strokeStyle = "black"
  ctx.beginPath()

  let px1 = minD * (vector.vectorProperties.px1 + vector.layer.x)
  let py1 = minD * (vector.vectorProperties.py1 + vector.layer.y)
  let px2 = minD * (vector.vectorProperties.px2 + vector.layer.x)
  let py2 = minD * (vector.vectorProperties.py2 + vector.layer.y)
  let px3 = minD * (vector.vectorProperties.px3 + vector.layer.x)
  let py3 = minD * (vector.vectorProperties.py3 + vector.layer.y)
  let px4 = minD * (vector.vectorProperties.px4 + vector.layer.x)
  let py4 = minD * (vector.vectorProperties.py4 + vector.layer.y)
  switch (vector.vectorProperties.type) {
    case "fill":
      ctx.arc(
        px1 + 0.5 + xOffset,
        py1 + 0.5 + yOffset,
        1,
        0,
        2 * Math.PI,
        true
      )
      break
    case "line":
      ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      ctx.lineTo(px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
      break
    case "quadCurve":
      ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      ctx.quadraticCurveTo(
        px3 + 0.5 + xOffset,
        py3 + 0.5 + yOffset,
        px2 + 0.5 + xOffset,
        py2 + 0.5 + yOffset
      )
      break
    case "cubicCurve":
      ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      ctx.bezierCurveTo(
        px3 + 0.5 + xOffset,
        py3 + 0.5 + yOffset,
        px4 + 0.5 + xOffset,
        py4 + 0.5 + yOffset,
        px2 + 0.5 + xOffset,
        py2 + 0.5 + yOffset
      )
      break
    case "ellipse": {
      let angle = getAngle(
        vector.vectorProperties.px2 - vector.vectorProperties.px1,
        vector.vectorProperties.py2 - vector.vectorProperties.py1
      )
      ctx.ellipse(
        px1 + xOffset,
        py1 + yOffset,
        minD * vector.vectorProperties.radA,
        minD * vector.vectorProperties.radB,
        angle,
        0,
        2 * Math.PI
      )
      break
    }
    case "polygon":
      ctx.moveTo(px1 + xOffset, py1 + yOffset)
      ctx.lineTo(px2 + xOffset, py2 + yOffset)
      ctx.lineTo(px3 + xOffset, py3 + yOffset)
      ctx.lineTo(px4 + xOffset, py4 + yOffset)
      ctx.closePath()
      break
    // Add more cases if there are other drawing tools.
  }

  ctx.globalCompositeOperation = "xor"
  ctx.stroke()
}

/**
 * Create a thumbnail canvas element for the given vector.
 * Draws directly into a per-vector <canvas> instead of encoding the shared
 * thumbnailCVS to a base64 data URL, eliminating the expensive toDataURL() call.
 * @param {object} vector - The vector to be rendered
 * @param {boolean} isSelected - True if the vector is selected
 * @returns {HTMLCanvasElement} - The created thumbnail canvas
 */
const createThumbnailImage = (vector, isSelected) => {
  const cvs = document.createElement("canvas")
  cvs.width = canvas.thumbnailCVS.width
  cvs.height = canvas.thumbnailCVS.height
  const ctx = cvs.getContext("2d")
  ctx.scale(canvas.sharpness, canvas.sharpness)
  drawOnThumbnailContext(vector, isSelected, ctx)
  return cvs
}

// * Vector Dither Picker * //

const SVG_NS = "http://www.w3.org/2000/svg"

let _vectorDitherSvgCounter = 0

/**
 * Build a dither pattern SVG thumbnail using vector-specific colors.
 * Uses a <pattern> element so the tile offset can be updated cheaply
 * by changing the pattern's x/y attributes without rebuilding the SVG.
 * Uses classes vector-dither-bg-rect / vector-dither-on-path so global
 * updateDitherPickerColors() doesn't overwrite vector colors.
 * @param {object} pattern - pattern from ditherPatterns
 * @param {object} vector - the vector whose colors to use
 * @param {number} [offsetX=0] - dither X offset (0–7)
 * @param {number} [offsetY=0] - dither Y offset (0–7)
 * @returns {SVGElement} - The created SVG element
 */
const createVectorDitherPatternSVG = (pattern, vector, offsetX = 0, offsetY = 0) => {
  const primaryColor = vector.color?.color ?? "rgb(0,0,0)"
  const secondaryColor =
    vector.modes?.twoColor && vector.secondaryColor
      ? vector.secondaryColor.color
      : "none"

  const id = `vdtp-${_vectorDitherSvgCounter++}`
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("viewBox", "0 0 8 8")
  svg.setAttribute("shape-rendering", "crispEdges")
  svg.classList.add("dither-grid-svg")

  const defs = document.createElementNS(SVG_NS, "defs")
  const patternEl = document.createElementNS(SVG_NS, "pattern")
  patternEl.setAttribute("id", id)
  patternEl.setAttribute("patternUnits", "userSpaceOnUse")
  patternEl.setAttribute("x", String(-offsetX))
  patternEl.setAttribute("y", String(-offsetY))
  patternEl.setAttribute("width", "8")
  patternEl.setAttribute("height", "8")
  patternEl.classList.add("dither-tile-pattern")

  const bg = document.createElementNS(SVG_NS, "rect")
  bg.setAttribute("x", "0")
  bg.setAttribute("y", "0")
  bg.setAttribute("width", "8")
  bg.setAttribute("height", "8")
  bg.setAttribute("fill", secondaryColor)
  bg.classList.add("vector-dither-bg-rect")
  patternEl.appendChild(bg)

  let d = ""
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

  const path = document.createElementNS(SVG_NS, "path")
  path.setAttribute("stroke", primaryColor)
  path.setAttribute("d", d)
  path.classList.add("vector-dither-on-path")
  patternEl.appendChild(path)

  defs.appendChild(patternEl)
  svg.appendChild(defs)

  const displayRect = document.createElementNS(SVG_NS, "rect")
  displayRect.setAttribute("x", "0")
  displayRect.setAttribute("y", "0")
  displayRect.setAttribute("width", "8")
  displayRect.setAttribute("height", "8")
  displayRect.setAttribute("fill", `url(#${id})`)
  svg.appendChild(displayRect)

  return svg
}

/**
 * Update the dither tile offset on all pattern elements within a container.
 * @param {Element} container - DOM element to search within
 * @param {number} offsetX - dither X offset (0–7)
 * @param {number} offsetY - dither Y offset (0–7)
 */
function applyVectorDitherOffset(container, offsetX, offsetY) {
  container.querySelectorAll(".dither-tile-pattern").forEach((p) => {
    p.setAttribute("x", String(-offsetX))
    p.setAttribute("y", String(-offsetY))
  })
}

let _vectorOffsetControlCounter = 0

/**
 * Build an SVG dither offset control for vector layers.
 * @returns {SVGElement} The constructed dither offset control SVG element
 */
function createVectorDitherOffsetControlSVG() {
  const id = `vdor-${_vectorOffsetControlCounter++}`
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("viewBox", "0 0 8 8")
  svg.setAttribute("shape-rendering", "crispEdges")
  svg.classList.add("dither-offset-svg")

  const defs = document.createElementNS(SVG_NS, "defs")
  const patternEl = document.createElementNS(SVG_NS, "pattern")
  patternEl.setAttribute("id", id)
  patternEl.setAttribute("patternUnits", "userSpaceOnUse")
  patternEl.setAttribute("x", "0")
  patternEl.setAttribute("y", "0")
  patternEl.setAttribute("width", "8")
  patternEl.setAttribute("height", "8")
  patternEl.classList.add("vector-dither-offset-ring-pattern")

  const ringColors = ["rgb(255,255,255)", "rgb(131,131,131)", "rgb(61,61,61)", "rgb(31,31,31)", "rgb(0,0,0)"]
  const ringPaths = ["", "", "", "", ""]
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
    const path = document.createElementNS(SVG_NS, "path")
    path.setAttribute("stroke", ringColors[dist])
    path.setAttribute("d", ringPaths[dist])
    patternEl.appendChild(path)
  }

  defs.appendChild(patternEl)
  svg.appendChild(defs)

  const displayRect = document.createElementNS(SVG_NS, "rect")
  displayRect.setAttribute("x", "0")
  displayRect.setAttribute("y", "0")
  displayRect.setAttribute("width", "8")
  displayRect.setAttribute("height", "8")
  displayRect.setAttribute("fill", `url(#${id})`)
  svg.appendChild(displayRect)

  return svg
}

/**
 * Update the vector offset control's ring pattern phase.
 * @param {Element} container - Element containing the vector dither offset control
 * @param {number} offsetX - Horizontal offset value to apply to the ring pattern
 * @param {number} offsetY - Vertical offset value to apply to the ring pattern
 */
function applyVectorDitherOffsetControl(container, offsetX, offsetY) {
  const pattern = container.querySelector(".vector-dither-offset-ring-pattern")
  if (pattern) {
    pattern.setAttribute("x", String(-offsetX))
    pattern.setAttribute("y", String(-offsetY))
  }
  const spans = container.querySelectorAll(".dither-offset-values span")
  if (spans.length === 2) {
    spans[0].textContent = `X: ${offsetX}`
    spans[1].textContent = `Y: ${offsetY}`
  }
}

let vectorDitherPickerInitialized = false

/**
 * Populate the vector dither picker grid with 65 pattern thumbnails.
 * Called once on first open.
 * @param {object} vector - the vector whose colors to use
 */
export function initVectorDitherPicker(vector) {
  const container = dom.vectorDitherPickerContainer
  const grid = container?.querySelector(".dither-grid")
  if (!grid) return
  if (!vectorDitherPickerInitialized) {
    vectorDitherPickerInitialized = true
    for (let i = 0; i < ditherPatterns.length; i++) {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "dither-grid-btn"
      btn.dataset.patternIndex = i
      btn.dataset.tooltip = i === 32 ? "33/65: Checkerboard" : `${i + 1}/65`
      btn.appendChild(createVectorDitherPatternSVG(ditherPatterns[i], vector))
      grid.appendChild(btn)
    }
    const wrap = container.querySelector(".dither-offset-control-wrap")
    if (wrap) {
      const control = document.createElement("div")
      control.className = "dither-offset-control"
      control.dataset.tooltip = "Drag to set dither offset"
      control.appendChild(createVectorDitherOffsetControlSVG())
      wrap.appendChild(control)
      const values = document.createElement("div")
      values.className = "dither-offset-values"
      values.innerHTML = "<span>X: 0</span><span>Y: 0</span>"
      wrap.appendChild(values)
    }
  }
  updateVectorDitherPickerColors(vector)
  updateVectorDitherControls(vector)
  highlightVectorDitherPattern(vector.ditherPatternIndex ?? 64)
}

/**
 * Sync the toggle buttons and offset sliders in the vector dither picker.
 * Sliders show the effective dither offset (stored offset corrected for layer movement).
 * @param {object} vector - The vector whose settings to reflect
 */
export function updateVectorDitherControls(vector) {
  const container = dom.vectorDitherPickerContainer
  if (!container) return
  const twoColorBtn = container.querySelector('.dither-toggle.twoColor')
  if (twoColorBtn) twoColorBtn.classList.toggle('selected', vector.modes?.twoColor ?? false)
  // Show effective offset (stored offset corrected for any layer movement since recording)
  const currentLayerX = vector.layer?.x ?? 0
  const currentLayerY = vector.layer?.y ?? 0
  const recordedLayerX = vector.recordedLayerX ?? currentLayerX
  const recordedLayerY = vector.recordedLayerY ?? currentLayerY
  const effectiveOffsetX = (((vector.ditherOffsetX ?? 0) + recordedLayerX - currentLayerX) % 8 + 8) % 8
  const effectiveOffsetY = (((vector.ditherOffsetY ?? 0) + recordedLayerY - currentLayerY) % 8 + 8) % 8
  const grid = container.querySelector('.dither-grid')
  if (grid) applyVectorDitherOffset(grid, effectiveOffsetX, effectiveOffsetY)
  const wrap = container.querySelector('.dither-offset-control-wrap')
  if (wrap) applyVectorDitherOffsetControl(wrap, effectiveOffsetX, effectiveOffsetY)
}

/**
 * Update all vector dither picker SVG thumbnails to reflect the vector's colors.
 * @param {object} vector - The vector whose colors to use
 */
export function updateVectorDitherPickerColors(vector) {
  const primaryColor = vector.color?.color ?? "rgb(0,0,0)"
  const secondaryColor =
    vector.modes?.twoColor && vector.secondaryColor
      ? vector.secondaryColor.color
      : "none"
  dom.vectorDitherPickerContainer
    ?.querySelectorAll(".vector-dither-bg-rect")
    .forEach((rect) => rect.setAttribute("fill", secondaryColor))
  dom.vectorDitherPickerContainer
    ?.querySelectorAll(".vector-dither-on-path")
    .forEach((path) => path.setAttribute("stroke", primaryColor))
}

/**
 * Highlight the currently selected pattern in the vector dither picker.
 * @param {number} patternIndex - Index of the pattern to highlight
 */
export function highlightVectorDitherPattern(patternIndex) {
  const grid = dom.vectorDitherPickerContainer?.querySelector(
    ".dither-grid"
  )
  if (!grid) return
  grid.querySelectorAll(".dither-grid-btn").forEach((btn) => {
    btn.classList.toggle(
      "selected",
      parseInt(btn.dataset.patternIndex) === patternIndex
    )
  })
}

/**
 * Refresh the dither preview button in the vector settings dialog.
 * @param {object} vector - The vector whose dither pattern to preview
 */
export function updateVectorDitherPreview(vector) {
  const preview = dom.vectorSettingsContainer?.querySelector(
    ".vector-dither-preview"
  )
  if (!preview) return
  const existing = preview.querySelector(".dither-grid-svg")
  if (existing) existing.remove()
  const currentLayerX = vector.layer?.x ?? 0
  const currentLayerY = vector.layer?.y ?? 0
  const recordedLayerX = vector.recordedLayerX ?? currentLayerX
  const recordedLayerY = vector.recordedLayerY ?? currentLayerY
  const effectiveOffsetX = (((vector.ditherOffsetX ?? 0) + recordedLayerX - currentLayerX) % 8 + 8) % 8
  const effectiveOffsetY = (((vector.ditherOffsetY ?? 0) + recordedLayerY - currentLayerY) % 8 + 8) % 8
  preview.appendChild(
    createVectorDitherPatternSVG(ditherPatterns[vector.ditherPatternIndex ?? 64], vector, effectiveOffsetX, effectiveOffsetY)
  )
}
