import { dom } from '../Context/dom.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools, toolGroups } from '../Tools/index.js'
import { handleUndo, handleRedo } from '../Actions/undoRedo/undoRedo.js'
import { brush, rebuildBuildUpDensityMap } from '../Tools/brush.js'
import { customBrushStamp } from '../Context/brushStamps.js'
import { vectorGui } from '../GUI/vector.js'
import { actionClear } from '../Actions/modifyTimeline/modifyTimeline.js'
import { actionZoom, actionRecenter } from '../Actions/untracked/viewActions.js'
import { renderCanvas } from '../Canvas/render.js'
import { toggleMode, switchTool } from './toolbox.js'
import { openStampEditor } from '../DOM/stampEditor.js'
import { ZOOM_LEVELS } from '../utils/constants.js'

//Initialize default tool
globalState.tool.current = tools.brush

//=========================================//
//=== * * * Button Event Handlers * * * ===//
//=========================================//

/**
 * Handle zoom buttons
 * @param {PointerEvent} e - click event
 */
function handleZoom(e) {
  const zoomBtn = e.target.closest('.zoombtn')
  if (!zoomBtn) return
  let idx = ZOOM_LEVELS.findIndex((l) => l >= canvas.zoom)
  if (idx === -1) idx = ZOOM_LEVELS.length - 1
  const nextIdx = zoomBtn.id === 'minus' ? idx - 1 : idx + 1
  if (nextIdx < 0 || nextIdx >= ZOOM_LEVELS.length) return
  const targetZoom = ZOOM_LEVELS[nextIdx]
  // Calculate the zoom ratio between the new zoom level and the current zoom level
  const zoomRatio = targetZoom / canvas.zoom
  //get new expected centered offsets based on center of canvas
  const zoomedX = (canvas.xOffset + canvas.offScreenCVS.width / 2) / zoomRatio
  const zoomedY = (canvas.yOffset + canvas.offScreenCVS.height / 2) / zoomRatio
  const nox = zoomedX - canvas.offScreenCVS.width / 2
  const noy = zoomedY - canvas.offScreenCVS.height / 2
  actionZoom(targetZoom, nox, noy)
}

/**
 * Recenter canvas. Does not affect timeline
 */
function handleRecenter() {
  actionRecenter()
}

/**
 * Non-cursor action that affects the timeline
 */
function handleClearCanvas() {
  //Do not allow clearing if active paste is happening
  if (canvas.pastedLayer) {
    return
  }
  canvas.currentLayer.ctx.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
  globalState.selection.pointsSet = null
  globalState.selection.seenPixelsSet = null
  globalState.timeline.clearPoints()
  vectorGui.reset()
  globalState.reset()
  actionClear(canvas.currentLayer)

  globalState.clearRedoStack()
  renderCanvas(canvas.currentLayer)
}

/**
 * Switch tools
 * @param {PointerEvent} e - click event
 */
export function handleTools(e) {
  // Handle group button click — toggle popout open/closed
  const groupBtn = e?.target.closest('.tool-group-btn')
  if (groupBtn) {
    const thisGroup = groupBtn.closest('.tool-group')
    document.querySelectorAll('.tool-group.open').forEach((g) => {
      if (g !== thisGroup) g.classList.remove('open')
    })
    thisGroup?.classList.toggle('open')
    const groupName = groupBtn.dataset.group
    const activeTool = toolGroups[groupName]?.activeTool
    if (activeTool) {
      switchTool(activeTool)
    }
    return
  }
  // Handle tool click (works for both regular tools and tools inside popouts)
  const targetTool = e?.target.closest('.tool')
  if (!targetTool) return
  // Close any open popout before switching
  document
    .querySelectorAll('.tool-group.open')
    .forEach((g) => g.classList.remove('open'))
  switchTool(null, targetTool)
}

// Close open popouts when clicking outside any tool group
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tool-group')) {
    document
      .querySelectorAll('.tool-group.open')
      .forEach((g) => g.classList.remove('open'))
  }
})

/**
 * @param {PointerEvent} e - click event
 */
export function handleModes(e) {
  const targetMode = e?.target.closest('.mode')
  toggleMode(null, targetMode)
}

//=====================================//
//======== * * * Options * * * ========//
//=====================================//

/**
 * @param {PointerEvent} e - click event
 */
function switchBrush(e) {
  const current = globalState.tool.current.brushType
  if (current === 'circle') {
    globalState.tool.current.brushType = 'square'
    dom.customBrushTypeBtn?.classList.remove('active')
  } else if (current === 'square') {
    if (customBrushStamp.pixels.length === 0) {
      globalState.tool.current.brushType = 'circle'
      dom.customBrushTypeBtn?.classList.remove('active')
    } else {
      globalState.tool.current.brushType = 'custom'
      dom.customBrushTypeBtn?.classList.add('active')
    }
  } else {
    globalState.tool.current.brushType = 'circle'
    dom.customBrushTypeBtn?.classList.remove('active')
  }
}

/**
 * @param {InputEvent} e - input event
 */
function updateBrush(e) {
  switch (globalState.tool.current.name) {
    case 'brush':
    case 'colorMask':
    case 'curve':
    case 'ellipse':
    case 'polygon':
    case 'select':
      globalState.tool.current.brushSize = parseInt(e.target.value)
      break
    default:
    //do nothing for other tools
  }
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

// * Toolbox * — handled by Toolbox React component; guard until migrated
if (dom.undoBtn)
  dom.undoBtn.addEventListener('click', () => {
    handleUndo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  })
if (dom.redoBtn)
  dom.redoBtn.addEventListener('click', () => {
    handleRedo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  })

if (dom.recenterBtn) dom.recenterBtn.addEventListener('click', handleRecenter)
if (dom.clearBtn) dom.clearBtn.addEventListener('click', handleClearCanvas)

if (dom.zoomContainer) dom.zoomContainer.addEventListener('click', handleZoom)

if (dom.toolsContainer)
  dom.toolsContainer.addEventListener('click', handleTools)
if (dom.modesContainer)
  dom.modesContainer.addEventListener('click', handleModes)

// * Brush * — handled by Sidebar/BrushPanel React component; guard until migrated
if (dom.brushDisplay) dom.brushDisplay.addEventListener('click', switchBrush)
if (dom.brushSlider) dom.brushSlider.addEventListener('input', updateBrush)

// Custom stamp button: activate custom brush type and toggle the editor
dom.customBrushTypeBtn?.addEventListener('click', () => {
  brush.brushType = 'custom'
  dom.customBrushTypeBtn.classList.add('active')
  if (
    dom.stampEditorContainer.style.display === 'none' ||
    !dom.stampEditorContainer.style.display
  ) {
    openStampEditor()
  } else {
    dom.stampEditorContainer.style.display = 'none'
  }
})
