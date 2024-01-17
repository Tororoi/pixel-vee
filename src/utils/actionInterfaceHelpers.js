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
  mode.ariaLabel = modeKey
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
  tool.ariaLabel = action.tool.name
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
  color.ariaLabel = "Action color"
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
  hide.ariaLabel = "Hide/Show action"
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
  trash.ariaLabel = "Delete action"
  return trash
}

/**
 * @param {Object} action
 * @returns {Element}
 */
export const createSettingsElement = () => {
  let gear = document.createElement("button")
  gear.type = "button"
  gear.className = "gear"
  gear.ariaLabel = "Adjust Layer Settings"
  return gear
}
