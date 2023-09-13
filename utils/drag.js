import { state } from "../Context/state.js"

export const initializeDragger = (dragTarget) => {
  const dragBtn = dragTarget.querySelector(".dragger")
  if (dragBtn) {
    dragBtn.addEventListener("pointerdown", (e) => dragStart(e, dragTarget))
    dragBtn.addEventListener("pointerup", dragStop)
    dragBtn.addEventListener("pointermove", dragMove)
  }
}

export const initializeCollapser = (collapseTarget) => {
  const collapseBtn = collapseTarget.querySelector(".collapse-checkbox")
  const collapsibleArea = collapseTarget.querySelector(".collapsible")
  if (collapseBtn && collapsibleArea) {
    collapseBtn.addEventListener("click", (e) => {
      if (collapseBtn.checked) {
        // collapsibleArea.style.height = 0
        collapsibleArea.style.display = "none"
      } else {
        // collapsibleArea.style.height = "100%"
        collapsibleArea.style.display = "flex"
      }
    })
  }
}

export const initializeDialogBox = (dialogBoxTarget) => {
  initializeDragger(dialogBoxTarget)
  initializeCollapser(dialogBoxTarget)
}

//Drag
export const dragStart = (e, dragTarget) => {
  if (!dragTarget.className.includes("locked")) {
    e.target.setPointerCapture(e.pointerId)
    state.dragging = true
    state.dragTarget = dragTarget
    if (state.dragTarget) {
      state.dragTarget.classList.add("dragging")
      state.dragX = e.clientX - state.dragTarget.offsetLeft
      state.dragY = e.clientY - state.dragTarget.offsetTop
    }
  }
}

export const dragStop = (e) => {
  state.dragging = false
  if (state.dragTarget) {
    state.dragTarget.classList.remove("dragging")
    if (!state.dragTarget.className.includes("free")) {
      state.dragTarget.style.position = "relative"
      state.dragTarget.style.top = "unset"
    }
    state.dragTarget = null
  }
}
export const dragMove = (e) => {
  //TODO: when moving over sibling elements, change the sibling elements to position absolute and set it's x and y values to match its position while it was relative. Move all elements after current hovered element to make space for dragged element
  if (state.dragTarget) {
    const parentElement = state.dragTarget.parentElement
    const siblingElements = parentElement.children
    /**
     * TODO:
     * 1. find target's current position in the order
     * 2. set all siblings style.top to current coords for each
     * 3. set all siblings to style.position = "absolute"
     * 4. find sibling at current pointer coordinates
     * 5. if hovered sibling is more than half of bottom overlapped, shift it down by height of dragTarget,
     * if more than half top overlapped, shift up
     * 6. update the order of all children to reflect new physical positions
     * 7. When stop dragging, set all children style.position to relative and style.top = unset
     */
    // siblingElements[0].style.order = "4"
    // siblingElement.style.position = "absolute"
    if (state.dragTarget.className.includes("h-drag")) {
      state.dragTarget.style.left = e.clientX - state.dragX + "px"
    }
    if (state.dragTarget.className.includes("v-drag")) {
      state.dragTarget.style.top = e.clientY - state.dragY + "px"
    }
    state.dragTarget.style.position = "absolute"
    let pRect = parentElement.getBoundingClientRect()
    let tgtRect = state.dragTarget.getBoundingClientRect()
    //Constrain draggable element inside window, include box shadow border
    if (tgtRect.left < pRect.left) state.dragTarget.style.left = 0 + "px"
    if (tgtRect.top < pRect.top + 2) state.dragTarget.style.top = 0 + "px"
    if (tgtRect.right > pRect.right)
      state.dragTarget.style.left = pRect.width - tgtRect.width - 4 + "px"
    if (tgtRect.bottom > pRect.bottom - 2) {
      state.dragTarget.style.top = pRect.height - tgtRect.height - 4 + "px"
    }
  }
}
