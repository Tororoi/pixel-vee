import { state } from "../Context/state.js"

const fullPage = document.querySelector(".full-page")

export const activateDragger = (dragTarget) => {
  const dragBtn = dragTarget.querySelector(".dragger")
  if (dragBtn) {
    dragBtn.addEventListener("pointerdown", (e) => dragStart(e, dragTarget))
    dragBtn.addEventListener("pointerup", dragStop)
    dragBtn.addEventListener("pointermove", dragMove)
  }
}

//Drag
export const dragStart = (e, dragTarget) => {
  e.target.setPointerCapture(e.pointerId)
  state.dragging = true
  state.dragTarget = dragTarget
  if (state.dragTarget) {
    state.dragTarget.classList.add("dragging")
    state.dragX = e.clientX - state.dragTarget.offsetLeft
    state.dragY = e.clientY - state.dragTarget.offsetTop
  }
}
export const dragStop = (e) => {
  state.dragging = false
  if (state.dragTarget) {
    state.dragTarget.classList.remove("dragging")
    state.dragTarget = null
  }
}
export const dragMove = (e) => {
  if (state.dragTarget) {
    state.dragTarget.style.left = e.clientX - state.dragX + "px"
    state.dragTarget.style.top = e.clientY - state.dragY + "px"
    const parentElement = state.dragTarget.parentElement
    let pRect = parentElement.getBoundingClientRect()
    // console.log(pRect)
    let tgtRect = state.dragTarget.getBoundingClientRect()
    // console.log(pRect, tgtRect)
    //Constrain draggable element inside window, include box shadow border
    if (tgtRect.left < pRect.left)
      state.dragTarget.style.left = 0 + "px"
    if (tgtRect.top < pRect.top) state.dragTarget.style.top = 0 + "px"
    if (tgtRect.right > pRect.right)
      state.dragTarget.style.left = pRect.width - tgtRect.width - 4 + "px"
    if (tgtRect.bottom > pRect.bottom) {
      state.dragTarget.style.top =
        pRect.height - tgtRect.height - 4 + "px"
    }
  }
}
