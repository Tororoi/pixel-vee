import { globalState } from '../context/state.js'
import { restoreToolsState } from '../tools/index.js'
import { restoreSwatches } from '../context/swatch.svelte.js'
import { swatches } from '../context/swatch.js'
import { switchTool } from '../tools/toolbox.js'
import { vectorGui } from '../gui/vector.js'

// Restores tool settings captured at record time so each played-back stroke
// uses exactly the same tool, modes, brush size/type, and colors as when it
// was originally drawn — regardless of what is currently active at playback.
export function applySnapshot(snapshot) {
  if (!snapshot) return

  // Support both the new store-based format ({ selectedName, toolsState, swatches })
  // and the legacy per-property format ({ toolName, modes, brushSize, ... }) so that
  // scripts recorded before this refactor continue to play back correctly.
  if (snapshot.toolsState) {
    const name = snapshot.selectedName
    // Only call switchTool when the tool actually changes. switchTool calls
    // globalState.reset() which zeroes clickCounter — calling it mid-sequence
    // for a multi-click tool like curve would restart the click counter and
    // prevent the curve from ever reaching its second or third control point.
    if (globalState.tool.selectedName !== name) {
      switchTool(name)
    }
    restoreToolsState(snapshot.toolsState)
    restoreSwatches(snapshot.swatches)
    // Restore the active vector so the curve tool targets the right control
    // points. Without this, playback always operates on the last-created
    // vector, causing chained curve adjustments to hit the wrong vector when
    // two curves share an endpoint position.
    if (snapshot.vectorCurrentIndex != null) {
      const vec = globalState.vector.all[snapshot.vectorCurrentIndex]
      if (vec) vectorGui.setVectorProperties(vec)
    }
    // Restore the grabbed control point so vectorGui.render() computes
    // selectedCollisionPresent correctly before handlePointerDown fires.
    // Clears both fields when no point was grabbed (no-op or new stroke).
    if (snapshot.selectedCollisionPoint) {
      vectorGui.collidedPoint = { ...snapshot.selectedCollisionPoint }
      vectorGui.selectedPoint = { ...snapshot.selectedCollisionPoint }
    } else {
      vectorGui.collidedPoint = { xKey: null, yKey: null }
      vectorGui.selectedPoint = { xKey: null, yKey: null }
    }
  } else {
    // Legacy format: manually apply individual properties for backwards compatibility.
    const { toolName, modes, brushSize, brushType, ditherPatternIndex, primaryColor, secondaryColor } = snapshot
    if (globalState.tool.selectedName !== toolName) {
      switchTool(toolName)
    }
    const toolObj = globalState.tool.current
    if (toolObj?.modes && modes) Object.assign(toolObj.modes, modes)
    if (brushSize != null && toolObj) toolObj.brushSize = brushSize
    if (brushType != null && toolObj) toolObj.brushType = brushType
    if (ditherPatternIndex != null && toolObj) toolObj.ditherPatternIndex = ditherPatternIndex
    if (primaryColor) Object.assign(swatches.primary.color, primaryColor)
    if (secondaryColor) Object.assign(swatches.secondary.color, secondaryColor)
  }
}
