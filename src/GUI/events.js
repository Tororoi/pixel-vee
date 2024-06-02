import { TRANSLATE, ROTATE, SCALE } from "../utils/constants.js"
import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { vectorGui } from "./vector.js"
import { setVectorShapeBoundaryBox } from "./transform.js"

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
      state.resetSelectProperties()
      state.resetBoundaryBox()
      switchVectorTransformMode(TRANSLATE)
      break
    case ROTATE:
      state.resetSelectProperties()
      state.resetBoundaryBox()
      switchVectorTransformMode(ROTATE)
      break
    case SCALE: {
      // //Update shape boundary box
      // const shapeBoundaryBox = findVectorShapeBoundaryBox(
      //   state.selectedVectorIndicesSet,
      //   state.vectors
      // )
      // state.selectProperties.px1 = shapeBoundaryBox.xMin
      // state.selectProperties.py1 = shapeBoundaryBox.yMin
      // state.selectProperties.px2 = shapeBoundaryBox.xMax
      // state.selectProperties.py2 = shapeBoundaryBox.yMax
      // state.setBoundaryBox(state.selectProperties)
      setVectorShapeBoundaryBox()
      switchVectorTransformMode(SCALE)
      break
    }
    default:
    //do nothing
  }
})
