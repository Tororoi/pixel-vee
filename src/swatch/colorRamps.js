import { HSLToRGB } from '../utils/colorConversion.js'

//=========================================//
//===== * * * Color Ramp Helpers * * * ====//
//=========================================//

/**
 * Wrap hue value to 0-359 range
 * @param {number} h - Hue value in degrees (may be outside 0-359)
 * @returns {number} Hue normalized to the 0-359 range
 */
function wrapHue(h) {
  return ((h % 360) + 360) % 360
}

/**
 * Clamp value between min and max
 * @param {number} v - The value to clamp
 * @param {number} min - The lower bound
 * @param {number} max - The upper bound
 * @returns {number} The clamped value
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/**
 * Convert HSL + alpha to a color object {r, g, b, a}
 * @param {number} hue - Hue in degrees (0-359)
 * @param {number} saturation - Saturation percentage (0-100)
 * @param {number} lightness - Lightness percentage (0-100)
 * @param {number} a - Alpha channel value (0-255)
 * @returns {{r: number, g: number, b: number, a: number}} The resulting color object
 */
function hslToColor(hue, saturation, lightness, a) {
  const {
    red: r,
    green: g,
    blue: b,
  } = HSLToRGB({
    hue: wrapHue(hue),
    saturation: clamp(saturation, 0, 100),
    lightness: clamp(lightness, 0, 100),
  })
  return { r, g, b, a }
}

/**
 * Linearly interpolate between two color objects
 * @param {{r,g,b,a}} c1 - The start color
 * @param {{r,g,b,a}} c2 - The end color
 * @param {number} t - Interpolation factor from 0 (c1) to 1 (c2)
 * @returns {{r,g,b,a}} The interpolated color
 */
function lerpColor(c1, c2, t) {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
    a: Math.round(c1.a + (c2.a - c1.a) * t),
  }
}

//=========================================//
//===== * * * Ramp Calculations * * * =====//
//=========================================//

/**
 * Generate a 7-color shadow/highlight ramp.
 * Shadow direction (left): darker, less saturated, hue shifts toward blue (240°).
 * Highlight direction (right): lighter, more saturated, hue shifts toward warm (30°).
 * @param {{hue: number, saturation: number, lightness: number}} hsl - The base color in HSL
 * @param {number} a - Alpha channel value (0-255)
 * @returns {Array<{r,g,b,a}>} 7 colors, index 3 is the base
 */
export function calcShadowHighlightRamp(hsl, a) {
  const { hue: h, saturation: s, lightness: l } = hsl

  /**
   * Interpolate hue toward a target by a ratio, taking the shortest arc.
   * @param {number} from - Starting hue in degrees
   * @param {number} target - Target hue in degrees
   * @param {number} t - Interpolation factor from 0 to 1
   * @returns {number} The interpolated hue in degrees
   */
  function shiftHueToward(from, target, t) {
    let diff = target - from
    // Take shortest arc
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    return wrapHue(from + diff * t)
  }

  const SHADOW_HUE = 240
  const HIGHLIGHT_HUE = 30

  return [
    hslToColor(shiftHueToward(h, SHADOW_HUE, 0.3), s - 30, l - 36, a),
    hslToColor(shiftHueToward(h, SHADOW_HUE, 0.2), s - 20, l - 24, a),
    hslToColor(shiftHueToward(h, SHADOW_HUE, 0.1), s - 10, l - 12, a),
    hslToColor(h, s, l, a),
    hslToColor(shiftHueToward(h, HIGHLIGHT_HUE, 0.1), s + 10, l + 12, a),
    hslToColor(shiftHueToward(h, HIGHLIGHT_HUE, 0.2), s + 20, l + 24, a),
    hslToColor(shiftHueToward(h, HIGHLIGHT_HUE, 0.3), s + 30, l + 36, a),
  ]
}

/**
 * Generate a 7-color custom ramp by interpolating between start, mid, and end key colors.
 * Colors at indices 0,3,6 are the key colors; 1,2 interpolate start→mid; 4,5 interpolate mid→end.
 * @param {{r,g,b,a}} start - The first key color (index 0)
 * @param {{r,g,b,a}} mid - The middle key color (index 3)
 * @param {{r,g,b,a}} end - The last key color (index 6)
 * @returns {Array<{r,g,b,a}>} 7 colors
 */
export function interpolateCustomRamp(start, mid, end) {
  return [
    start,
    lerpColor(start, mid, 1 / 3),
    lerpColor(start, mid, 2 / 3),
    mid,
    lerpColor(mid, end, 1 / 3),
    lerpColor(mid, end, 2 / 3),
    end,
  ]
}

/**
 * Build a color object from rgb+a values (convenience wrapper)
 * @param {number} r - Red channel (0-255)
 * @param {number} g - Green channel (0-255)
 * @param {number} b - Blue channel (0-255)
 * @param {number} a - Alpha channel (0-255)
 * @returns {{r,g,b,a}} The assembled color object
 */
export function makeColor(r, g, b, a) {
  return { r, g, b, a }
}
