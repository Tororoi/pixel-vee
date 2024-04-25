import { TRANSLATE, ROTATE, SCALE } from "../utils/constants.js"
import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"

/**
 * Switches the vector transform mode
 * @param {string} mode - translate, rotate, or scale
 */
function switchVectorTransformMode(mode) {
  //remove selected class from button (child of vectorTransformModeContainer) with id matching current vectorTransformMode
  dom.vectorTransformModeContainer
    .querySelector(`#${state.vectorTransformMode}`)
    .classList.remove("selected")
  state.vectorTransformMode = mode
  vectorGui.render()
  //add selected class to button clicked
  dom.vectorTransformModeContainer
    .querySelector(`#${mode}`)
    .classList.add("selected")
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

dom.vectorTransformModeContainer.addEventListener("click", (e) => {
  //check for button click on translate, rotate or scale by checking e.target.id
  switch (e.target.id) {
    case TRANSLATE:
      switchVectorTransformMode(TRANSLATE)
      break
    case ROTATE:
      switchVectorTransformMode(ROTATE)
      break
    case SCALE:
      switchVectorTransformMode(SCALE)
      break
    default:
    //do nothing
  }
})
