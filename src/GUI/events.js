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
    .querySelector(`#${state.vector.transformMode}`)
    .classList.remove("selected")
  state.vector.transformMode = mode
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
      state.selection.resetProperties()
      state.selection.resetBoundaryBox()
      switchVectorTransformMode(TRANSLATE)
      break
    case ROTATE:
      state.selection.resetProperties()
      state.selection.resetBoundaryBox()
      switchVectorTransformMode(ROTATE)
      break
    case SCALE: {
      // //Update shape boundary box
      // const shapeBoundaryBox = findVectorShapeBoundaryBox(
      //   state.vector.selectedIndices,
      //   state.vector.all
      // )
      // state.selection.properties.px1 = shapeBoundaryBox.xMin
      // state.selection.properties.py1 = shapeBoundaryBox.yMin
      // state.selection.properties.px2 = shapeBoundaryBox.xMax
      // state.selection.properties.py2 = shapeBoundaryBox.yMax
      // state.selection.setBoundaryBox(state.selection.properties)
      setVectorShapeBoundaryBox()
      switchVectorTransformMode(SCALE)
      break
    }
    default:
    //do nothing
  }
})
