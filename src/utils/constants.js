// Define the constants
const TRANSLATE = 'translate'
const ROTATE = 'rotate'
const SCALE = 'scale'
const ZOOM_LEVELS = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24, 28, 32]
const WHEEL_THRESHOLD = 20 // accumulated pixels required to trigger each zoom step after the first
const MINIMUM_DIMENSION = 8 // minimum canvas width or height in pixels
const MAXIMUM_DIMENSION = 1024 // maximum canvas width or height in pixels
const CURVE_TYPES = ['line', 'quadCurve', 'cubicCurve']

// Export the constants
export {
  TRANSLATE,
  ROTATE,
  SCALE,
  ZOOM_LEVELS,
  WHEEL_THRESHOLD,
  MINIMUM_DIMENSION,
  MAXIMUM_DIMENSION,
  CURVE_TYPES,
}
