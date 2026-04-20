import './Menu/events.js'
import './Swatch/events.js'
import './Canvas/events.js'
import './Tools/events.js'
import './Controls/events.js'
import './GUI/events.js'
import { vectorGui } from './GUI/vector.js'
import { registerVectorGui } from './Context/state.js'

// Register dependencies that would otherwise create circular imports in globalState.js
registerVectorGui(vectorGui)

