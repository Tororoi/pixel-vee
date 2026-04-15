<script>
  import { getVersion } from '../../hooks/appState.svelte.js'
  import { createDitherPatternSVG } from '../../DOM/renderBrush.js'
  import { ditherPatterns } from '../../Context/ditherPatterns.js'

  const { tool, onclick } = $props()

  const svgMarkup = $derived.by(() => {
    getVersion()
    const pattern = ditherPatterns[tool.ditherPatternIndex ?? 63]
    const offsetX = tool.ditherOffsetX ?? 0
    const offsetY = tool.ditherOffsetY ?? 0
    const svgEl = createDitherPatternSVG(pattern, offsetX, offsetY)
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
