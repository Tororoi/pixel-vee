// * Buttons * //

/**
 *
 * @param {String} modeKey
 * @param {Boolean} isSelected
 * @returns {Element}
 */
export const createModeElement = (modeKey, isSelected) => {
  let mode = document.createElement("button")
  mode.type = "button"
  mode.className = "mode"
  mode.classList.add(modeKey)
  if (isSelected) {
    mode.classList.add("selected")
  }
  return mode
}

/**
 * @param {Object} action
 * @param {Boolean} isSelected
 * @returns {Element}
 */
export const createToolElement = (action, isSelected) => {
  let tool = document.createElement("button")
  tool.type = "button"
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
  let color = document.createElement("button")
  color.type = "button"
  color.className = "actionColor"
  let colorSwatch = document.createElement("div")
  colorSwatch.className = "swatch"
  colorSwatch.style.backgroundColor = action.color.color
  color.appendChild(colorSwatch)
  return color
}

/**
 * @param {Boolean} hidden
 * @returns {Element}
 */
export const createHideElement = (hidden = false) => {
  let hide = document.createElement("button")
  hide.type = "button"
  hide.className = "hide"
  hidden ? hide.classList.add("eyeclosed") : hide.classList.add("eyeopen")
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
