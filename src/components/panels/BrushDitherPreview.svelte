<script>
  import { getVersion } from '../../hooks/appState.svelte.js'
  import { createDitherPatternSVG } from '../../DOM/renderBrush.js'
  import { ditherPatterns } from '../../Context/ditherPatterns.js'

  const { tool, onclick } = $props()

  let ref = $state(null)

  // Re-run whenever tool props change or bump() fires
  $effect(() => {
    getVersion()
    if (!ref) return
    ref.innerHTML = ''
    const pattern = ditherPatterns[tool.ditherPatternIndex ?? 63]
    const offsetX = tool.ditherOffsetX ?? 0
    const offsetY = tool.ditherOffsetY ?? 0
    ref.appendChild(createDitherPatternSVG(pattern, offsetX, offsetY))
  })
</script>

<div
  bind:this={ref}
  class="dither-preview btn"
  data-tooltip="Click to select dither pattern"
  {onclick}
></div>
