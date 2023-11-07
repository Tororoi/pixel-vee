// * Buttons * //

/**
 * @param {Object} action
 * @param {Boolean} isSelected
 * @returns {Element}
 */
export const createToolElement = (action, isSelected) => {
  let tool = document.createElement("div")
  tool.className = "tool"
  tool.classList.add(action.tool.name)
  if (isSelected) {
    tool.classList.add("selected")
  }
  return tool
}

/**
 * @param {Object} action
 * @returns {Element}
 */
export const createColorElement = (action) => {
  let color = document.createElement("div")
  color.className = "actionColor"
  let colorSwatch = document.createElement("div")
  colorSwatch.className = "swatch"
  colorSwatch.style.background = action.color.color
  color.appendChild(colorSwatch)
  return color
}

/**
 * @param {Boolean} hidden
 * @returns {Element}
 */
export const createHideElement = (hidden = false) => {
  let hide = document.createElement("div")
  hide.className = "hide"
  let hideIcon = document.createElement("div")
  hideIcon.className = "eye"
  hidden
    ? hideIcon.classList.add("eyeclosed")
    : hideIcon.classList.add("eyeopen")
  hide.appendChild(hideIcon)
  return hide
}

/**
 * @param {Object} action
 * @returns {Element}
 */
export const createTrashElement = () => {
  let trash = document.createElement("button")
  trash.type = "button"
  trash.className = "trash"
  return trash
}
