// * Buttons * //

/**
 *
 * @param {string} modeKey
 * @param {boolean} isSelected
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
 * @param {object} action
 * @param {boolean} isSelected
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
 * @param {object} action
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
 * @param {boolean} hidden
 * @param {string} tooltipText
 * @returns {Element}
 */
export const createHideElement = (hidden = false, tooltipText) => {
  let hide = document.createElement("button")
  hide.type = "button"
  hide.className = "hide"
  hide.ariaLabel = tooltipText
  hide.dataset.tooltip = tooltipText
  hidden ? hide.classList.add("eyeclosed") : hide.classList.add("eyeopen")
  return hide
}

/**
 * @param {string} tooltipText
 * @returns {Element}
 */
export const createTrashElement = (tooltipText) => {
  let trash = document.createElement("button")
  trash.type = "button"
  trash.className = "trash"
  trash.ariaLabel = tooltipText
  trash.dataset.tooltip = tooltipText
  return trash
}

/**
 * @param {string} tooltipText
 * @returns {Element}
 */
export const createSettingsElement = (tooltipText) => {
  let gear = document.createElement("button")
  gear.type = "button"
  gear.className = "gear"
  gear.ariaLabel = tooltipText
  gear.dataset.tooltip = tooltipText
  return gear
}
