<script>
  /**
   * @component
   * Creates and manages an overlay canvas stack for the navigator. Appends a
   * transparent div to `.bg-space` that holds the navigator layer's onscreen
   * canvas. Visibility mirrors `navigatorOpen` so the overlay disappears when
   * the dialog is closed. No pointer events are intercepted here — all input
   * still flows through vectorGuiCVS; drawing is redirected by canvasSwap.js.
   */
  import { onMount } from 'svelte'
  import { canvas } from '../context/canvas.js'
  import { globalState } from '../context/state.js'
  import { navigatorState } from './navigatorState.js'

  let overlayEl = null

  onMount(() => {
    overlayEl = document.createElement('div')
    overlayEl.className = 'nav-canvas-overlay'
    overlayEl.style.display = 'none'

    const bgSpace = document.querySelector('.bg-space')
    if (bgSpace) bgSpace.appendChild(overlayEl)

    // canvas.offScreenCVS is set by CanvasArea.svelte's onMount, which runs
    // before this onMount because CanvasArea appears first in App.svelte.
    // The fallback poll handles any edge cases where order differs.
    if (canvas.offScreenCVS) {
      setupNavCanvases()
    } else {
      const id = setInterval(() => {
        if (canvas.offScreenCVS) {
          clearInterval(id)
          setupNavCanvases()
        }
      }, 50)
    }

    return () => {
      overlayEl?.remove()
    }
  })

  $effect(() => {
    if (overlayEl) {
      overlayEl.style.display = globalState.ui.navigatorOpen ? 'block' : 'none'
    }
  })

  function setupNavCanvases() {
    const w = canvas.offScreenCVS.width
    const h = canvas.offScreenCVS.height

    // Offscreen composite canvas (mirrors canvas.offScreenCVS role)
    const offScreenCVS = document.createElement('canvas')
    offScreenCVS.width = w
    offScreenCVS.height = h
    const offScreenCTX = offScreenCVS.getContext('2d', {
      willReadFrequently: true,
    })

    // Offscreen canvas for the nav raster layer (pixel data)
    const layerCVS = document.createElement('canvas')
    layerCVS.width = w
    layerCVS.height = h
    const layerCTX = layerCVS.getContext('2d', { willReadFrequently: true })

    // Onscreen display canvas for the nav raster layer
    const onscreenCVS = document.createElement('canvas')
    onscreenCVS.className = 'onscreen-canvas'
    overlayEl.appendChild(onscreenCVS)
    onscreenCVS.width = onscreenCVS.offsetWidth * canvas.sharpness
    onscreenCVS.height = onscreenCVS.offsetHeight * canvas.sharpness
    const onscreenCTX = onscreenCVS.getContext('2d', { desynchronized: true })
    onscreenCTX.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )

    // Offscreen canvas for navigator preview (live stroke feedback)
    const previewCVS = document.createElement('canvas')
    previewCVS.width = w
    previewCVS.height = h
    const previewCTX = previewCVS.getContext('2d', { willReadFrequently: true })

    // Onscreen canvas for navigator preview — the tool system appends/removes
    // this to dom.canvasLayers during an active stroke, just like tempLayer.
    const prevOnscreenCVS = document.createElement('canvas')
    prevOnscreenCVS.className = 'onscreen-canvas'
    prevOnscreenCVS.width = onscreenCVS.width
    prevOnscreenCVS.height = onscreenCVS.height
    const prevOnscreenCTX = prevOnscreenCVS.getContext('2d', {
      desynchronized: true,
    })
    prevOnscreenCTX.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )

    navigatorState.layer = {
      id: 1,
      type: 'raster',
      title: 'Navigator Layer',
      cvs: layerCVS,
      ctx: layerCTX,
      onscreenCvs: onscreenCVS,
      onscreenCtx: onscreenCTX,
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      inactiveTools: [],
      hidden: false,
      removed: false,
    }

    navigatorState.previewLayer = {
      id: 0,
      type: 'raster',
      title: 'Preview Layer',
      cvs: previewCVS,
      ctx: previewCTX,
      onscreenCvs: prevOnscreenCVS,
      onscreenCtx: prevOnscreenCTX,
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      inactiveTools: ['brush', 'fill', 'curve', 'ellipse', 'select'],
      hidden: false,
      removed: false,
      isPreview: true,
    }

    navigatorState.offScreenCVS = offScreenCVS
    navigatorState.offScreenCTX = offScreenCTX
    navigatorState.previewCVS = previewCVS
    navigatorState.previewCTX = previewCTX
  }
</script>
