function camelCaseToWords(str) {
  // Add a space before any uppercase letter
  let result = str.replace(/([A-Z])/g, " $1")

  // Trim any leading space and capitalize the first letter of the string
  result = result.charAt(0).toUpperCase() + result.slice(1)

  return result.trim()
}

/**
 *
 * @param {String} optionName
 * @param {Boolean} optionSelected
 * @param {String} tooltipText
 * @returns {Element}
 */
export function createOptionToggle(
  optionName,
  optionSelected,
  tooltipText = null
) {
  // Create label element
  const label = document.createElement("label")
  label.htmlFor = optionName + "-toggle"
  label.id = optionName
  label.className = "toggle"
  if (tooltipText) {
    label.setAttribute("data-tooltip", tooltipText)
  }

  // Create input (checkbox) element
  const input = document.createElement("input")
  input.type = "checkbox"
  input.id = optionName + "-toggle"
  input.checked = optionSelected

  // Create span for the checkmark
  const span = document.createElement("span")
  span.className = "checkmark"

  // Create capitalized text node
  const text = document.createTextNode(camelCaseToWords(optionName))

  // Append input, span, and text to the label
  label.appendChild(input)
  label.appendChild(span)
  label.appendChild(text)

  return label
}
