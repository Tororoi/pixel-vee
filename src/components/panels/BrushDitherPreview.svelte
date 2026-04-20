<script>
  import { createDitherPatternSVG } from '../../DOM/renderBrush.js'
  import { ditherPatterns } from '../../Context/ditherPatterns.js'
  import { swatches } from '../../Context/swatch.js'

  const { tool, onclick } = $props()

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
  data-tooltip="Click to select dither pattern"
  {onclick}
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html svgMarkup}
</button>
