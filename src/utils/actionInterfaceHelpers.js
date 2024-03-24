// * Buttons * //

/**
 * @param {string} modeKey - The mode key
 * @param {boolean} isSelected - whether the mode is selected
 * @returns {HTMLElement} - mode button
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
 * @param {string} toolName - The tool name
 * @param {boolean} isSelected - whether the tool is selected
 * @returns {HTMLElement} - tool button
 */
export const createToolElement = (toolName, isSelected) => {
  let tool = document.createElement("button")
  tool.type = "button"
  tool.className = "tool"
  tool.ariaLabel = toolName
  tool.classList.add(toolName)
  if (isSelected) {
    tool.classList.add("selected")
  }
  return tool
}

/**
 * @param {object} brushColor - The color object
 * @returns {HTMLElement} - color button
 */
export const createColorElement = (brushColor) => {
  let color = document.createElement("button")
  color.type = "button"
  color.className = "actionColor"
  color.ariaLabel = "Action color"
  let colorSwatch = document.createElement("div")
  colorSwatch.className = "swatch"
  colorSwatch.style.backgroundColor = brushColor.color
  color.appendChild(colorSwatch)
  return color
}

/**
 * @param {boolean} hidden - whether the element is hidden
 * @param {string} tooltipText - The tooltip text
 * @returns {HTMLElement} - hide button
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
 * @param {string} tooltipText - The tooltip text
 * @returns {HTMLElement} - trash button
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
 * @param {string} tooltipText - The tooltip text
 * @returns {HTMLElement} - settings button
 */
export const createSettingsElement = (tooltipText) => {
  let gear = document.createElement("button")
  gear.type = "button"
  gear.className = "gear"
  gear.ariaLabel = tooltipText
  gear.dataset.tooltip = tooltipText
  return gear
}
