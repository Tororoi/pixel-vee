import { state } from '../Context/state.js'

/**
 * Initialize dragger
 * @param {HTMLElement} dragTarget - The element to drag
 */
export const initializeDragger = (dragTarget) => {
  const dragBtn = dragTarget.querySelector('.dragger')
  if (dragBtn) {
    dragBtn.addEventListener('pointerdown', (e) => dragStart(e, dragTarget))
    dragBtn.addEventListener('pointerup', dragStop)
    dragBtn.addEventListener('pointerout', dragStop)
    dragBtn.addEventListener('pointermove', dragMove)
  }
}

/**
 * Initialize collapser
 * @param {HTMLElement} collapseTarget - The element to collapse
 * @param {boolean} startCollapsed - Whether to start collapsed
 */
export const initializeCollapser = (collapseTarget, startCollapsed) => {
  const collapseBtn = collapseTarget.querySelector('.collapse-checkbox')
  const collapsibleArea = collapseTarget.querySelector('.collapsible')
  if (collapseBtn && collapsibleArea) {
    collapseBtn.addEventListener('click', () => {
      if (collapseBtn.checked) {
        // collapsibleArea.style.height = 0
        collapseTarget.style.minHeight = '20px'
        collapseTarget.style.flexGrow = '0'
        // collapseTarget.style.minWidth = "20px"
        // NOTE: to perform horizontal shrinking, resizeOnScreenCanvas must be called any time the canvas container size changes
        collapsibleArea.style.display = 'none'
      } else {
        // collapsibleArea.style.height = "100%"
        collapseTarget.style.minHeight = '' //reset to default value
        collapseTarget.style.flexGrow = ''
        // collapseTarget.style.minWidth = ""
        collapsibleArea.style.display = 'flex'
      }
    })
    if (startCollapsed) {
      collapseBtn.click()
    }
  }
}

/**
 * Initialize closer
 * @param {HTMLElement} closeTarget - The element to close
 * @param {Function} closerFn - The function to call when closing
 */
export const initializeCloser = (closeTarget, closerFn) => {
  const closeBtn = closeTarget.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeTarget.style.display = 'none'
      if (closerFn) {
        closerFn()
      }
    })
  }
}

/**
 * Initialize dialog box
 * @param {HTMLElement} dialogBoxTarget - The dialog box
 * @param {boolean} startCollapsed - Whether to start collapsed
 * @param {Function} closerFn - The function to call when closing
 */
export const initializeDialogBox = (
  dialogBoxTarget,
  startCollapsed = false,
  closerFn = null,
) => {
  initializeDragger(dialogBoxTarget)
  initializeCollapser(dialogBoxTarget, startCollapsed)
  initializeCloser(dialogBoxTarget, closerFn)
}

/**
 * Set drag siblings
 */
function setDragSiblings() {
  const parentElement = state.ui.dragTarget.parentElement
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
  let dragTargetMargin = 0
  if (state.ui.dragTarget.className.includes('dialog-box')) {
    dragTargetMargin = 2
  }
  for (let i = 0; i < siblingArray.length; i++) {
    let newSiblingProperties = {}
    let bounds = siblingArray[i].getBoundingClientRect()
    newSiblingProperties.height = bounds.height
    newSiblingProperties.top = siblingArray[i].offsetTop - dragTargetMargin
    newSiblingProperties.element = siblingArray[i]
    state.ui.dragSiblings.push(newSiblingProperties)
  }
  //set properties
  parentElement.style.height = parentElement.offsetHeight + 'px'
  parentElement.style.background = 'transparent'
  for (let i = 0; i < state.ui.dragSiblings.length; i++) {
    state.ui.dragSiblings[i].element.style.position = 'absolute'
    state.ui.dragSiblings[i].element.style.top =
      state.ui.dragSiblings[i].top + 'px'
    state.ui.dragSiblings[i].element.style.maxHeight =
      state.ui.dragSiblings[i].height + 'px'
  }
}

/**
 * Reorder elements
 * @param {PointerEvent} e - The pointer event
 */
function reorderElements(e) {
  //fix siblings in place
  let dragTargetIndex = 0
  //set properties
  for (let i = 0; i < state.ui.dragSiblings.length; i++) {
    if (state.ui.dragSiblings[i].element === state.ui.dragTarget) {
      dragTargetIndex = i
    }
  }
  let dragTargetMargin = 0
  if (state.ui.dragTarget.className.includes('dialog-box')) {
    dragTargetMargin = 2
  }
  //check location of drag target and reorder elements
  for (let i = 0; i < state.ui.dragSiblings.length; i++) {
    if (state.ui.dragSiblings[i].element !== state.ui.dragTarget) {
      let dragTop = e.clientY - state.ui.dragY
      //if drag top less than halfway height and greater than previous sibling's halfway height, set dragTarget's css order property to siblingArray[i]'s order and iterate back through higher siblings to increase their order
      //move dragTarget up
      //TODO: (Medium Priority) Instead of colliding with valid insertion point, write this check to find the nearest overlapping element to dragTop
      let collision =
        dragTop > state.ui.dragSiblings[i].top - 10 &&
        dragTop < state.ui.dragSiblings[i].top + 10
      if (collision) {
        let dragTarget = state.ui.dragSiblings[dragTargetIndex]
        state.ui.dragSiblings.splice(dragTargetIndex, 1)
        state.ui.dragSiblings.splice(i, 0, dragTarget)

        // recalculate all elements positions
        let offset = 0
        for (let j = 0; j < state.ui.dragSiblings.length; j++) {
          state.ui.dragSiblings[j].element.style.order = j + 1
          if (state.ui.dragSiblings[j].element !== state.ui.dragTarget) {
            state.ui.dragSiblings[j].element.style.top = offset + 'px'
            state.ui.dragSiblings[j].top = offset
          }
          offset += state.ui.dragSiblings[j].height + 2 * dragTargetMargin
        }
        break
      }
    }
  }
}

/**
 * @param {PointerEvent} e - The pointer event
 * @param {HTMLElement} dragTarget - The element to drag
 */
export const dragStart = (e, dragTarget) => {
  if (!dragTarget.className.includes('locked')) {
    e.target.setPointerCapture(e.pointerId)
    state.ui.dragging = true
    state.ui.dragTarget = dragTarget
    if (state.ui.dragTarget) {
      state.ui.dragTarget.classList.add('dragging')
      state.ui.dragX = e.clientX - state.ui.dragTarget.offsetLeft
      state.ui.dragY = e.clientY - state.ui.dragTarget.offsetTop
      //push each element to state.ui.dragSiblings with bounding box
      if (!state.ui.dragTarget.className.includes('h-drag')) {
        setDragSiblings()
      }
    }
  }
}

/**
 * Drag stop
 */
export const dragStop = () => {
  state.ui.dragging = false
  if (state.ui.dragTarget) {
    state.ui.dragTarget.classList.remove('dragging')
    if (!state.ui.dragTarget.className.includes('free')) {
      //NOTE: currently only works for vertical dragging of horizontally locked elements
      const parentElement = state.ui.dragTarget.parentElement
      if (!state.ui.dragTarget.className.includes('h-drag')) {
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

        parentElement.style.background = ''

        for (let i = 0; i < siblingArray.length; i++) {
          if (siblingArray[i] !== state.ui.dragTarget) {
            siblingArray[i].style.zIndex = ''
            siblingArray[i].style.top = ''
            siblingArray[i].style.maxHeight = ''
            siblingArray[i].style.position = 'relative'
          }
        }
      }
      state.ui.dragTarget.style.top = ''
      state.ui.dragTarget.style.maxHeight = '' //reset to default
      state.ui.dragTarget.style.position = 'relative'
      parentElement.style.height = '' //reset to default
    }
    state.ui.dragSiblings = []
    state.ui.dragTarget = null
  }
}

/**
 * Drag move
 * @param {PointerEvent} e - The pointer event
 */
export const dragMove = (e) => {
  if (state.ui.dragTarget) {
    const parentElement = state.ui.dragTarget.parentElement
    //For vertical drag and replace, fix siblings in place
    if (!state.ui.dragTarget.className.includes('h-drag')) {
      reorderElements(e)
      state.ui.dragTarget.style.maxHeight =
        state.ui.dragTarget.offsetHeight + 'px' //NOTE: May need to be placed elsewhere
    }
    state.ui.dragTarget.style.position = 'absolute'
    if (state.ui.dragTarget.className.includes('h-drag')) {
      state.ui.dragTarget.style.left = e.clientX - state.ui.dragX + 'px'
    }
    if (state.ui.dragTarget.className.includes('v-drag')) {
      state.ui.dragTarget.style.top = e.clientY - state.ui.dragY + 'px'
    }
    let pRect = parentElement.getBoundingClientRect()
    let tgtRect = state.ui.dragTarget.getBoundingClientRect()
    let dragTargetMargin = 0
    if (state.ui.dragTarget.className.includes('dialog-box')) {
      dragTargetMargin = 2
    }
    //Constrain draggable element inside window, include box shadow border
    if (state.ui.dragTarget.className.includes('h-drag')) {
      if (tgtRect.left - dragTargetMargin < pRect.left)
        state.ui.dragTarget.style.left = 0 + 'px'
      if (tgtRect.right + dragTargetMargin > pRect.right)
        state.ui.dragTarget.style.left =
          pRect.width - tgtRect.width - 2 * dragTargetMargin + 'px'
    }
    if (state.ui.dragTarget.className.includes('v-drag')) {
      if (tgtRect.top - dragTargetMargin < pRect.top)
        state.ui.dragTarget.style.top = 0 + 'px'
      if (tgtRect.bottom + dragTargetMargin > pRect.bottom) {
        state.ui.dragTarget.style.top =
          pRect.height - tgtRect.height - 2 * dragTargetMargin + 'px'
      }
    }
  }
}
