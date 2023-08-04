import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  actionDraw,
  actionLine,
  actionPerfectPixels,
  actionReplace,
  actionFill,
  actionQuadraticCurve,
} from "./actions.js"
import { renderCursor, drawCurrentPixel } from "../GUI/index.js"

//====================================//
//=== * * * Tool Controllers * * * ===//
//====================================//

//"Steps" functions are controllers for the process

/**
 * Supported modes: "draw, erase, perfect",
 */
export function drawSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //set colorlayer, then for each brushpoint, alter colorlayer and add each to timeline
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      //for perfect pixels
      state.lastDrawnX = state.cursorX
      state.lastDrawnY = state.cursorY
      state.waitingPixelX = state.cursorX
      state.waitingPixelY = state.cursorY
      if (state.tool.name !== "replace") {
        state.addToTimeline(
          state.tool.name,
          state.cursorX,
          state.cursorY,
          canvas.currentLayer
        )
      }
      canvas.draw()
      break
    case "pointermove":
      if (state.mode === "perfect") {
        drawCurrentPixel(state, canvas, swatches)
      }
      if (
        state.previousX !== state.cursorX ||
        state.previousY !== state.cursorY
      ) {
        //draw between points when drawing fast
        if (
          Math.abs(state.cursorX - state.previousX) > 1 ||
          Math.abs(state.cursorY - state.previousY) > 1
        ) {
          actionLine(
            state.previousX,
            state.previousY,
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          if (state.tool.name !== "replace") {
            state.addToTimeline(
              "line",
              { x1: state.previousX, x2: state.cursorX },
              { y1: state.previousY, y2: state.cursorY },
              canvas.currentLayer
            )
          }
          canvas.draw()
        } else {
          //FIX: perfect will be option, not mode
          if (state.mode === "perfect") {
            canvas.draw()
            drawCurrentPixel(state, canvas, swatches)
            actionPerfectPixels(state.cursorX, state.cursorY)
          } else {
            actionDraw(
              state.cursorX,
              state.cursorY,
              swatches.primary.color,
              state.brushStamp,
              state.tool.brushSize,
              canvas.currentLayer.ctx,
              state.mode
            )
            if (state.tool.name !== "replace") {
              state.addToTimeline(
                state.tool.name,
                state.cursorX,
                state.cursorY,
                canvas.currentLayer
              )
            }
            canvas.draw()
          }
        }
      }
      // save last point
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      break
    case "pointerup":
      //only needed if perfect pixels option is on
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      if (state.tool.name !== "replace") {
        state.addToTimeline(
          state.tool.name,
          state.cursorX,
          state.cursorY,
          canvas.currentLayer
        )
      }
      canvas.draw()
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase, perfect",
 */
export function replaceSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      actionReplace()
      drawSteps()
      break
    case "pointermove":
      drawSteps()
      break
    case "pointerup":
      drawSteps()
      actionReplace()
      break
    case "pointerout":
      actionReplace()
      break
    default:
    //do nothing
  }
}

/**
 * TODO: Work in progress
 * GOAL: create a dynamic selectable area, allowing the user to restrict the areas of the canvas that accept changes
 */
export function selectSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //1. set drag origin
      //2. save context
      break
    case "pointermove":
      //1. if state.clicked create strokeable path using drag origin and current x/y as opposite corners of rectangle
      //2. stroke outline path with animated "marching ants".
      break
    case "pointerup":
      //1. create clip mask using drag origin and current x/y as opposite corners of rectangle
      break
    case "pointerout":
      //1. create clip mask using drag origin and last x/y as opposite corners of rectangle
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase",
 */
export function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        canvas.onScreenCTX.clearRect(
          0,
          0,
          canvas.offScreenCVS.width / canvas.zoom,
          canvas.offScreenCVS.height / canvas.zoom
        )
        canvas.draw()
        actionLine(
          state.previousX +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.previousY +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.cursorWithCanvasOffsetX,
          state.cursorWithCanvasOffsetY,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    case "pointerup":
      actionLine(
        state.previousX,
        state.previousY,
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        canvas.currentLayer.ctx,
        state.mode,
        state.brushStamp,
        state.tool.brushSize
      )
      state.addToTimeline(
        state.tool.name,
        { x1: state.previousX, x2: state.cursorX },
        { y1: state.previousY, y2: state.cursorY },
        canvas.currentLayer
      )
      canvas.draw()
      break
    default:
    //do nothing
  }
}

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase",
 */
export function fillSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      actionFill(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        canvas.currentLayer.ctx,
        state.mode
      )
      //For undo ability, store starting coords and settings and pass them into actionFill
      state.addToTimeline(
        state.tool.name,
        state.cursorX,
        state.cursorY,
        canvas.currentLayer
      )
      canvas.draw()
      break
    case "pointerup":
      //redraw canvas to allow onscreen cursor to render
      canvas.draw()
    default:
    //do nothing
  }
}

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
export function curveSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 3) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          state.px1 = state.cursorX
          state.py1 = state.cursorY
          break
        case 2:
          if (!state.touch) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
          }
          break
        default:
        //do nothing
      }
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //normalize pointermove to pixelgrid
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        // canvas.onScreenCTX.clearRect(0, 0, canvas.offScreenCVS.width / canvas.zoom, canvas.offScreenCVS.height / canvas.zoom);
        canvas.draw()
        //onscreen preview
        actionQuadraticCurve(
          state.px1 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py1 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.px2 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py2 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.px3 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py3 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.clickCounter,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    case "pointerup":
      //For touchscreens
      if (state.touch) {
        if (state.clickCounter === 1) {
          state.px2 = state.cursorX
          state.py2 = state.cursorY
        }
        if (state.clickCounter === 2) {
          state.clickCounter += 1
        }
      }
      //Solidify curve
      if (state.clickCounter === 3) {
        //solidify control point
        state.px3 = state.cursorX
        state.py3 = state.cursorY
        actionQuadraticCurve(
          state.px1,
          state.py1,
          state.px2,
          state.py2,
          state.px3,
          state.py3,
          state.clickCounter + 1,
          swatches.primary.color,
          canvas.currentLayer.ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
        state.clickCounter = 0
        //store control points for timeline
        state.addToTimeline(
          state.tool.name,
          { x1: state.px1, x2: state.px2, x3: state.px3 },
          { y1: state.py1, y2: state.py2, y3: state.py3 },
          canvas.currentLayer
        )
        canvas.draw()
      }
      break
    case "pointerout":
      //cancel curve
      state.clickCounter = 0
      break
    default:
    //do nothing
  }
}

/**
 * Draw cubic bezier curves
 * Supported modes: "draw, erase",
 */
export function cubicCurveSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 3) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          state.px1 = state.cursorX
          state.py1 = state.cursorY
          break
        case 2:
          if (!state.touch) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
          }
          break
        default:
        //do nothing
      }
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //normalize pointermove to pixelgrid
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        // canvas.onScreenCTX.clearRect(0, 0, canvas.offScreenCVS.width / canvas.zoom, canvas.offScreenCVS.height / canvas.zoom);
        canvas.draw()
        //onscreen preview
        actionQuadraticCurve(
          state.px1 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py1 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.px2 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py2 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.px3 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py3 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.clickCounter,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    case "pointerup":
      //For touchscreens
      if (state.touch) {
        if (state.clickCounter === 1) {
          state.px2 = state.cursorX
          state.py2 = state.cursorY
        }
        if (state.clickCounter === 2) {
          state.clickCounter += 1
        }
      }
      //Solidify curve
      if (state.clickCounter === 3) {
        //solidify control point
        state.px3 = state.cursorX
        state.py3 = state.cursorY
        actionQuadraticCurve(
          state.px1,
          state.py1,
          state.px2,
          state.py2,
          state.px3,
          state.py3,
          state.clickCounter + 1,
          swatches.primary.color,
          canvas.currentLayer.ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
        state.clickCounter = 0
        //store control points for timeline
        state.addToTimeline(
          state.tool.name,
          { x1: state.px1, x2: state.px2, x3: state.px3 },
          { y1: state.py1, y2: state.py2, y3: state.py3 },
          canvas.currentLayer
        )
        canvas.draw()
      }
      break
    case "pointerout":
      //cancel curve
      state.clickCounter = 0
      break
    default:
    //do nothing
  }
}

//====================================//
//=== * * * Non-Action Tools * * * ===//
//====================================//

function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
}

//Eyedropper
//TODO: add magnifying glass view that shows zoomed in view of area being sampled
export function eyedropperSteps() {
  //eyedropper helper function
  function sampleColor(x, y) {
    let newColor = canvas.getColor(x, y, state.colorLayerGlobal)
    //not simply passing whole color in until random color function is refined
    swatches.setColor(newColor.r, newColor.g, newColor.b, "swatch btn")
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //get imageData
      canvas.consolidateLayers()
      state.colorLayerGlobal = canvas.offScreenCTX.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //set color
      sampleColor(state.cursorX, state.cursorY)
      break
    case "pointermove":
      //normalize pointermove to pixelgrid, get color here too
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        //get color
        sampleColor(state.cursorX, state.cursorY)
        //draw square
        canvas.draw()
        renderCursor(state, canvas, swatches)
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    default:
    //do nothing
  }
}

export function grabSteps() {
  switch (canvas.pointerEvent) {
    case "pointermove":
      canvas.xOffset =
        state.onscreenX - state.previousOnscreenX + canvas.previousXOffset
      canvas.yOffset =
        state.onscreenY - state.previousOnscreenY + canvas.previousYOffset
      canvas.draw()
      break
    case "pointerup":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      state.previousOnscreenX = state.onscreenX
      state.previousOnscreenY = state.onscreenY
      break
    case "pointerout":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    default:
    //do nothing
  }
}

//====================================//
//===== * * * Tools Object * * * =====//
//====================================//

//Tools
export const tools = {
  brush: {
    name: "brush",
    fn: drawSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
  },
  //FIX: allow replace to use different brush sizes
  replace: {
    name: "replace",
    fn: replaceSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
  },
  select: {
    name: "select",
    fn: selectSteps,
    brushSize: 1,
    disabled: false,
    options: ["magic wand"],
  },
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  line: {
    name: "line",
    fn: lineSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  fill: {
    name: "fill",
    fn: fillSteps,
    brushSize: 1,
    disabled: true,
    options: ["contiguous"],
  },
  // gradient: {
  // Create a dithered gradient
  // },
  curve: {
    name: "curve",
    fn: curveSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  cubicCurve: {
    name: "cubic curve",
    fn: cubicCurveSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  // shapes: {
  // square, circle, and custom saved shape?
  // },
  eyedropper: {
    name: "eyedropper",
    fn: eyedropperSteps,
    brushSize: 1,
    disabled: true,
    options: [],
  },
  grab: {
    name: "grab",
    fn: grabSteps,
    brushSize: 1,
    disabled: true,
    options: [],
  },
  /** move: {
    * Move a layer's coordinates independent of other layers
  } */
  /** perspective: {
   * set vanishing points.
   * Click to create a vanishing point with visible radius r.
   * Points are always visible even outside canvas area.
   * Clicking outside r will generate a new vanishing point.
   * Clicking inside r will select that vanishing point.
   * Hold shift to draw line from currently selected vanishing point to pointer location.
   * Hold control to view automatic perspective lines and click to make lines permanent.
   * NOTE: First iteration will not support curvilinear perspective. Can be approximated by combining multipoint perspective with drawing bezier curves from point to point
   * TODO: Add toggle option to snap line/ curve endpoints to vanishing point if made inside vanishing points radius.
  } */
}

//Initialize default tool
state.tool = tools.brush
