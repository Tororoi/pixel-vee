import { globalState } from '../context/state.js'
import { restoreToolsState } from '../tools/index.js'
import { restoreSwatches } from '../context/swatch.svelte.js'
import { swatches } from '../context/swatch.js'
import { switchTool } from '../tools/toolbox.js'

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
