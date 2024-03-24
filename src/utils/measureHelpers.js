/**
 * @param {string} text - The text to measure
 * @param {string} font - The font to use
 * @returns {number} - The width of the text in pixels
 */
export function measureTextWidth(text, font) {
  // Create a temporary element
  const tempElement = document.createElement("span")
  tempElement.style.visibility = "hidden" // Hide the element
  tempElement.style.position = "absolute" // Avoid affecting layout
  tempElement.style.font = font // Set the same font properties
  tempElement.textContent = text // Set the text to measure
  tempElement.innerHTML = text.replace(/ /g, "&nbsp;") // Replace spaces with non-breaking spaces

  // Add the element to the body to measure it
  document.body.appendChild(tempElement)

  // Get the width of the element
  const width = tempElement.offsetWidth

  // Remove the element from the body
  document.body.removeChild(tempElement)

  return width
}
