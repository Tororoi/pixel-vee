import { testBrushAction } from "./brushTest.js"
import { testEllipseAction } from "./ellipseTest.js"

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
