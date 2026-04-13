import { createRoot } from 'react-dom/client'
import { state, registerVectorGui, registerDOMHelpers } from './Context/state.js'
import { tools } from './Tools/index.js'
import { vectorGui } from './GUI/vector.js'
import { bump } from './hooks/useAppState.js'
// Canvas / input event wiring — these run addRasterLayer() + attach listeners at module load
import './Canvas/events.js'
import './Controls/events.js'
import './GUI/events.js'
import App from './App.jsx'

// Register circular-dep helpers (safe to call after canvas init — used only on interaction)
registerVectorGui(vectorGui)
registerDOMHelpers({
  disableActionsForNoSelection: bump,
  enableActionsForSelection: bump,
})

// Default tool (Tools/events.js is retired; set here instead)
state.tool.current = tools.brush
state.tool.selectedName = 'brush'

createRoot(document.getElementById('root')).render(<App />)
