import { TRANSLATE, ROTATE, SCALE } from "../utils/constants.js"
import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

dom.vectorTransformModeContainer.addEventListener("click", (e) => {
  //check for button click on translate, rotate or scale by checking e.target.id
  switch (e.target.id) {
    case TRANSLATE:
      //remove selected class from button (child of vectorTransformModeContainer) with id matching current vectorTransformMode
      dom.vectorTransformModeContainer
        .querySelector(`#${state.vectorTransformMode}`)
        .classList.remove("selected")
      state.vectorTransformMode = TRANSLATE
      //add selected class to button clicked
      dom.vectorTransformModeContainer
        .querySelector(`#${TRANSLATE}`)
        .classList.add("selected")
      break
    case ROTATE:
      dom.vectorTransformModeContainer
        .querySelector(`#${state.vectorTransformMode}`)
        .classList.remove("selected")
      state.vectorTransformMode = ROTATE
      dom.vectorTransformModeContainer
        .querySelector(`#${ROTATE}`)
        .classList.add("selected")
      break
    case SCALE:
      dom.vectorTransformModeContainer
        .querySelector(`#${state.vectorTransformMode}`)
        .classList.remove("selected")
      state.vectorTransformMode = SCALE
      dom.vectorTransformModeContainer
        .querySelector(`#${SCALE}`)
        .classList.add("selected")
      break
  }
})
