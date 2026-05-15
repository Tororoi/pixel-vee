<script>
  /**
   * @component
   * Button that renders the active dither pattern for a given tool as
   * an inline SVG preview. Reacts to changes in pattern index, offset,
   * two-color mode, and primary/secondary swatch colors. A fresh SVG
   * element is constructed on each derive so color attributes always
   * reflect the current swatch values; serializing a stale cached
   * element would produce incorrect colors after a swatch change.
   */
  import { createDitherPatternSVG } from '../../../utils/ditherPreview.js'
  import { ditherPatterns } from '../../../context/ditherPatterns.js'
  import { swatches } from '../../../context/swatch.js'
  import { TOOLTIPS } from '../../../utils/tooltips.js'

  const { tool, onclick } = $props()

  // A fresh SVG element is constructed on each derive so color
  // attributes always reflect the current swatch values. Serializing a
  // stale cached element would produce incorrect colors after a swatch
  // change without re-generating the markup.
  const svgMarkup = $derived.by(() => {
    const pattern = ditherPatterns[tool.ditherPatternIndex ?? 63]
    const offsetX = tool.ditherOffsetX ?? 0
    const offsetY = tool.ditherOffsetY ?? 0
    const twoColor = tool.modes?.twoColor ?? false
    const svgEl = createDitherPatternSVG(pattern, offsetX, offsetY)
    if (twoColor) {
      const bg = svgEl.querySelector('.dither-bg-rect')
      if (bg) bg.setAttribute('fill', swatches.secondary.color.color)
    }
    return new XMLSerializer().serializeToString(svgEl)
  })
</script>

<button
  type="button"
  class="dither-preview btn"
  data-tooltip={TOOLTIPS.ditherPreview.tooltip}
  {onclick}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html svgMarkup}
</button>
