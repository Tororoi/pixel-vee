import { globalState } from '../Context/state.js'

/**
 * Initialize dragger
 * @param {HTMLElement} dragTarget - The element to drag
 */
export const initializeDragger = (dragTarget) => {
  if (!dragTarget || dragTarget.dataset.dragInitialized) return
  dragTarget.dataset.dragInitialized = 'true'
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
  const parentElement = globalState.ui.dragTarget.parentElement
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
  if (globalState.ui.dragTarget.className.includes('dialog-box')) {
    dragTargetMargin = 2
  }
  for (let i = 0; i < siblingArray.length; i++) {
    let newSiblingProperties = {}
    let bounds = siblingArray[i].getBoundingClientRect()
    newSiblingProperties.height = bounds.height
    newSiblingProperties.top = siblingArray[i].offsetTop - dragTargetMargin
    newSiblingProperties.element = siblingArray[i]
    globalState.ui.dragSiblings.push(newSiblingProperties)
  }
  //set properties
  parentElement.style.height = parentElement.offsetHeight + 'px'
  parentElement.style.background = 'white'
  for (let i = 0; i < globalState.ui.dragSiblings.length; i++) {
    globalState.ui.dragSiblings[i].element.style.position = 'absolute'
    globalState.ui.dragSiblings[i].element.style.top =
      globalState.ui.dragSiblings[i].top + 'px'
    globalState.ui.dragSiblings[i].element.style.height =
      globalState.ui.dragSiblings[i].height + 'px'
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
  for (let i = 0; i < globalState.ui.dragSiblings.length; i++) {
    if (globalState.ui.dragSiblings[i].element === globalState.ui.dragTarget) {
      dragTargetIndex = i
    }
  }
  let dragTargetMargin = 0
  if (globalState.ui.dragTarget.className.includes('dialog-box')) {
    dragTargetMargin = 2
  }
  //check location of drag target and reorder elements
  for (let i = 0; i < globalState.ui.dragSiblings.length; i++) {
    if (globalState.ui.dragSiblings[i].element !== globalState.ui.dragTarget) {
      let dragTop = e.clientY - globalState.ui.dragY
      //if drag top less than halfway height and greater than previous sibling's halfway height, set dragTarget's css order property to siblingArray[i]'s order and iterate back through higher siblings to increase their order
      //move dragTarget up
      //TODO: (Medium Priority) Instead of colliding with valid insertion point, write this check to find the nearest overlapping element to dragTop
      let collision =
        dragTop > globalState.ui.dragSiblings[i].top - 10 &&
        dragTop < globalState.ui.dragSiblings[i].top + 10
      if (collision) {
        let dragTarget = globalState.ui.dragSiblings[dragTargetIndex]
        globalState.ui.dragSiblings.splice(dragTargetIndex, 1)
        globalState.ui.dragSiblings.splice(i, 0, dragTarget)

        // recalculate all elements positions
        let offset = 0
        for (let j = 0; j < globalState.ui.dragSiblings.length; j++) {
          globalState.ui.dragSiblings[j].element.style.order = j + 1
          if (
            globalState.ui.dragSiblings[j].element !== globalState.ui.dragTarget
          ) {
            globalState.ui.dragSiblings[j].element.style.top = offset + 'px'
            globalState.ui.dragSiblings[j].top = offset
          }
          offset += globalState.ui.dragSiblings[j].height + 2 * dragTargetMargin
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
    globalState.ui.dragging = true
    globalState.ui.dragTarget = dragTarget
    if (globalState.ui.dragTarget) {
      globalState.ui.dragTarget.classList.add('dragging')
      globalState.ui.dragX = e.clientX - globalState.ui.dragTarget.offsetLeft
      globalState.ui.dragY = e.clientY - globalState.ui.dragTarget.offsetTop
      //push each element to globalState.ui.dragSiblings with bounding box
      if (!globalState.ui.dragTarget.className.includes('h-drag')) {
        setDragSiblings()
      }
    }
  }
}

/**
 * Drag stop
 */
export const dragStop = () => {
  globalState.ui.dragging = false
  if (globalState.ui.dragTarget) {
    globalState.ui.dragTarget.classList.remove('dragging')
    if (!globalState.ui.dragTarget.className.includes('free')) {
      //NOTE: currently only works for vertical dragging of horizontally locked elements
      const parentElement = globalState.ui.dragTarget.parentElement
      if (!globalState.ui.dragTarget.className.includes('h-drag')) {
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
          if (siblingArray[i] !== globalState.ui.dragTarget) {
            siblingArray[i].style.zIndex = ''
            siblingArray[i].style.top = ''
            siblingArray[i].style.height = ''
            siblingArray[i].style.position = 'relative'
          }
        }
      }
      globalState.ui.dragTarget.style.top = ''
      globalState.ui.dragTarget.style.height = '' //reset to default
      globalState.ui.dragTarget.style.maxHeight = '' //reset to default
      globalState.ui.dragTarget.style.position = 'relative'
      parentElement.style.height = '' //reset to default
    }
    globalState.ui.dragSiblings = []
    globalState.ui.dragTarget = null
  }
}

/**
 * Drag move
 * @param {PointerEvent} e - The pointer event
 */
export const dragMove = (e) => {
  if (globalState.ui.dragTarget) {
    const parentElement = globalState.ui.dragTarget.parentElement
    //For vertical drag and replace, fix siblings in place
    if (!globalState.ui.dragTarget.className.includes('h-drag')) {
      reorderElements(e)
      globalState.ui.dragTarget.style.maxHeight =
        globalState.ui.dragTarget.offsetHeight + 'px' //NOTE: May need to be placed elsewhere
    }
    globalState.ui.dragTarget.style.position = 'absolute'
    if (globalState.ui.dragTarget.className.includes('h-drag')) {
      globalState.ui.dragTarget.style.left =
        e.clientX - globalState.ui.dragX + 'px'
    }
    if (globalState.ui.dragTarget.className.includes('v-drag')) {
      globalState.ui.dragTarget.style.top =
        e.clientY - globalState.ui.dragY + 'px'
    }
    // Walk up to the first ancestor with actual dimensions — skips display:contents wrappers
    // which report a 0×0 bounding rect and would otherwise snap the dialog off-screen.
    let boundsEl = parentElement
    let pRect = boundsEl.getBoundingClientRect()
    while (boundsEl.parentElement && pRect.width === 0 && pRect.height === 0) {
      boundsEl = boundsEl.parentElement
      pRect = boundsEl.getBoundingClientRect()
    }
    let tgtRect = globalState.ui.dragTarget.getBoundingClientRect()
    let dragTargetMargin = 0
    if (globalState.ui.dragTarget.className.includes('dialog-box')) {
      dragTargetMargin = 2
    }
    //Constrain draggable element inside window, include box shadow border
    if (globalState.ui.dragTarget.className.includes('h-drag')) {
      if (tgtRect.left - dragTargetMargin < pRect.left)
        globalState.ui.dragTarget.style.left = 0 + 'px'
      if (tgtRect.right + dragTargetMargin > pRect.right)
        globalState.ui.dragTarget.style.left =
          pRect.width - tgtRect.width - 2 * dragTargetMargin + 'px'
    }
    if (globalState.ui.dragTarget.className.includes('v-drag')) {
      if (tgtRect.top - dragTargetMargin < pRect.top)
        globalState.ui.dragTarget.style.top = 0 + 'px'
      if (tgtRect.bottom + dragTargetMargin > pRect.bottom) {
        globalState.ui.dragTarget.style.top =
          pRect.height - tgtRect.height - 2 * dragTargetMargin + 'px'
      }
    }
  }
}
