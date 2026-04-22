import { mount } from 'svelte'
import { globalState, registerVectorGui } from './Context/state.js'
import { tools } from './Tools/index.js'
import { vectorGui } from './GUI/vector.js'
import { initWasm } from './wasm.js'
// Canvas / input event wiring — these run addRasterLayer() + attach listeners at module load
import './Canvas/events.js'
import './Controls/events.js'
import App from './App.svelte'

// Register circular-dep helpers
registerVectorGui(vectorGui)

// Default tool
globalState.tool.current = tools.brush
globalState.tool.selectedName = 'brush'

// Initialize WASM before mounting so all modules can use getWasm() synchronously
initWasm().then(() => {
  mount(App, { target: document.getElementById('root') })
})
