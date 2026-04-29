import './menu/events.js'
import './swatch/events.js'
import './tools/events.js'
import { vectorGui } from './gui/vector.js'
import { registerVectorGui } from './context/state.js'

// Register dependencies that would otherwise create circular imports in globalState.js
registerVectorGui(vectorGui)
