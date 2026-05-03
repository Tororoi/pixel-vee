import { globalState } from '../context/state.js'
import { swatches } from '../context/swatch.js'
import { tools } from '../tools/index.js'
import { switchTool } from '../tools/toolbox.js'

// Restores tool settings captured at record time so each played-back stroke
// uses exactly the same tool, modes, brush size/type, and colors as when it
// was originally drawn — regardless of what is currently active at playback.
export function applySnapshot(snapshot) {
  if (!snapshot) return

  // Only call switchTool when the tool actually changes. switchTool calls
  // globalState.reset() which zeroes clickCounter — calling it mid-sequence
  // for a multi-click tool like curve would restart the click counter and
  // prevent the curve from ever reaching its second or third control point.
  if (globalState.tool.selectedName !== snapshot.toolName) {
    switchTool(snapshot.toolName)
  }

  const toolObj = tools[snapshot.toolName]
  if (toolObj?.modes && snapshot.modes) {
    for (const [key, value] of Object.entries(snapshot.modes)) {
      toolObj.modes[key] = value
      if (globalState.tool.current?.modes?.[key] !== undefined) {
        globalState.tool.current.modes[key] = value
      }
    }
  }

  if (snapshot.brushSize != null) {
    if (toolObj) toolObj.brushSize = snapshot.brushSize
    if (globalState.tool.current) globalState.tool.current.brushSize = snapshot.brushSize
  }
  if (snapshot.brushType != null) {
    if (toolObj) toolObj.brushType = snapshot.brushType
    if (globalState.tool.current) globalState.tool.current.brushType = snapshot.brushType
  }
  if (snapshot.ditherPatternIndex != null) {
    if (toolObj) toolObj.ditherPatternIndex = snapshot.ditherPatternIndex
    if (globalState.tool.current)
      globalState.tool.current.ditherPatternIndex = snapshot.ditherPatternIndex
  }

  if (snapshot.primaryColor) {
    Object.assign(swatches.primary.color, snapshot.primaryColor)
  }
  if (snapshot.secondaryColor) {
    Object.assign(swatches.secondary.color, snapshot.secondaryColor)
  }
}
