import { testBrushAction } from "./brushTest.js"

export function testAction(toolName) {
  switch (toolName) {
    case "brush":
      testBrushAction()
      break

    default:
      break
  }
}
