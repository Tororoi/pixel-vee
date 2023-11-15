import { testBrushAction } from "./brushTest.js"
import { testEllipseAction } from "./ellipseTest.js"

/**
 * End-to-End performance tests rely on capturing actual user input and replaying it.
 * The tests are not automated. 
 * @param {String} toolName
 */
export function testAction(toolName) {
  switch (toolName) {
    case "brush":
      testBrushAction()
      break
    case "ellipse":
      testEllipseAction()
      break
    default:
      break
  }
}
