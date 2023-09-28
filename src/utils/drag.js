import { state } from "../Context/state.js"

export const initializeDragger = (dragTarget) => {
  const dragBtn = dragTarget.querySelector(".dragger")
  if (dragBtn) {
    dragBtn.addEventListener("pointerdown", (e) => dragStart(e, dragTarget))
    dragBtn.addEventListener("pointerup", dragStop)
    dragBtn.addEventListener("pointerout", dragStop)
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
        collapseTarget.style.minHeight = "20px"
        // collapseTarget.style.minWidth = "20px"
        // NOTE: to perform horizontal shrinking, resizeOnScreenCanvas must be called any time the canvas container size changes
        collapsibleArea.style.display = "none"
      } else {
        // collapsibleArea.style.height = "100%"
        collapseTarget.style.minHeight = "" //reset to default value
        // collapseTarget.style.minWidth = ""
        collapsibleArea.style.display = "flex"
      }
    })
  }
}

export const initializeDialogBox = (dialogBoxTarget) => {
  initializeDragger(dialogBoxTarget)
  initializeCollapser(dialogBoxTarget)
}

function setDragSiblings() {
  const parentElement = state.dragTarget.parentElement
  const siblingElements = parentElement.children
  // Convert the NodeList or HTMLCollection to an array
  let siblingArray = Array.from(siblingElements)

  // Sort the array based on the order property
  siblingArray.sort((a, b) => {
    // Get computed styles
    let styleA = window.getComputedStyle(a)
    let styleB = window.getComputedStyle(b)

    // Parse the order properties as integers (default to 0 if not set)
    let orderA = parseInt(styleA.order, 10) || 0
    let orderB = parseInt(styleB.order, 10) || 0

    return orderA - orderB // This will sort in ascending order
  })

  for (let i = 0; i < siblingArray.length; i++) {
    let newSiblingProperties = {}
    let bounds = siblingArray[i].getBoundingClientRect()
    newSiblingProperties.height = bounds.height
    newSiblingProperties.top = siblingArray[i].offsetTop - 2 //-2 is to account for 2px margin on .draggable
    newSiblingProperties.element = siblingArray[i]
    state.dragSiblings.push(newSiblingProperties)
  }
  //set properties
  parentElement.style.height = parentElement.offsetHeight + "px"
  parentElement.style.background = "white"
  for (let i = 0; i < state.dragSiblings.length; i++) {
    state.dragSiblings[i].element.style.position = "absolute"
    state.dragSiblings[i].element.style.top = state.dragSiblings[i].top + "px"
    state.dragSiblings[i].element.style.maxHeight =
      state.dragSiblings[i].height + "px"
  }
}

function reorderElements(e) {
  //fix siblings in place
  let dragTargetIndex = 0
  //set properties
  for (let i = 0; i < state.dragSiblings.length; i++) {
    if (state.dragSiblings[i].element === state.dragTarget) {
      dragTargetIndex = i
    }
  }

  //check location of drag target and reorder elements
  for (let i = 0; i < state.dragSiblings.length; i++) {
    if (state.dragSiblings[i].element !== state.dragTarget) {
      let dragTop = e.clientY - state.dragY
      //if drag top less than halfway height and greater than previous sibling's halfway height, set dragTarget's css order property to siblingArray[i]'s order and iterate back through higher siblings to increase their order
      //move dragTarget up
      //TODO: Instead of colliding with valid insertion point, write this check to find the nearest overlapping element to dragTop
      let collision =
        dragTop > state.dragSiblings[i].top - 10 &&
        dragTop < state.dragSiblings[i].top + 10
      if (collision) {
        let dragTarget = state.dragSiblings[dragTargetIndex]
        state.dragSiblings.splice(dragTargetIndex, 1)
        state.dragSiblings.splice(i, 0, dragTarget)

        // recalculate all elements positions
        let offset = 0
        for (let j = 0; j < state.dragSiblings.length; j++) {
          state.dragSiblings[j].element.style.order = j + 1
          if (state.dragSiblings[j].element !== state.dragTarget) {
            state.dragSiblings[j].element.style.top = offset + "px"
            state.dragSiblings[j].top = offset
          }
          offset += state.dragSiblings[j].height + 4
        }
        break
      }
    }
  }
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
      //push each element to state.dragSiblings with bounding box
      if (!state.dragTarget.className.includes("h-drag")) {
        setDragSiblings()
      }
    }
  }
}

export const dragStop = (e) => {
  state.dragging = false
  if (state.dragTarget) {
    state.dragTarget.classList.remove("dragging")
    if (!state.dragTarget.className.includes("free")) {
      //NOTE: currently only works for vertical dragging of horizontally locked elements
      const parentElement = state.dragTarget.parentElement
      if (!state.dragTarget.className.includes("h-drag")) {
        const siblingElements = parentElement.children
        // Convert the NodeList or HTMLCollection to an array
        let siblingArray = Array.from(siblingElements)

        // Sort the array based on the order property
        siblingArray.sort((a, b) => {
          // Get computed styles
          let styleA = window.getComputedStyle(a)
          let styleB = window.getComputedStyle(b)

          // Parse the order properties as integers (default to 0 if not set)
          let orderA = parseInt(styleA.order, 10) || 0
          let orderB = parseInt(styleB.order, 10) || 0

          return orderA - orderB // This will sort in ascending order
        })

        parentElement.style.background = ""

        for (let i = 0; i < siblingArray.length; i++) {
          if (siblingArray[i] !== state.dragTarget) {
            siblingArray[i].style.zIndex = ""
            siblingArray[i].style.top = ""
            siblingArray[i].style.maxHeight = ""
            siblingArray[i].style.position = "relative"
          }
        }
      }
      state.dragTarget.style.top = ""
      state.dragTarget.style.maxHeight = "" //reset to default
      state.dragTarget.style.position = "relative"
      parentElement.style.height = "" //reset to default
    }
    state.dragSiblings = []
    state.dragTarget = null
  }
}

export const dragMove = (e) => {
  //TODO: when moving over sibling elements, change the sibling elements to position absolute and set it's x and y values to match its position while it was relative. Move all elements after current hovered element to make space for dragged element
  if (state.dragTarget) {
    const parentElement = state.dragTarget.parentElement
    //For vertical drag and replace, fix siblings in place
    if (!state.dragTarget.className.includes("h-drag")) {
      reorderElements(e)
      state.dragTarget.style.maxHeight = state.dragTarget.offsetHeight + "px" //NOTE: May need to be placed elsewhere
    }
    state.dragTarget.style.position = "absolute"
    if (state.dragTarget.className.includes("h-drag")) {
      state.dragTarget.style.left = e.clientX - state.dragX + "px"
    }
    if (state.dragTarget.className.includes("v-drag")) {
      state.dragTarget.style.top = e.clientY - state.dragY + "px"
    }
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
