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
