<script>
  /**
   * @component
   * Creates and manages the full overlay canvas stack the navigator uses to
   * replay pixel-art sessions without touching the real canvas area. On mount
   * it appends a `.nav-canvas-overlay` div to `.bg-space` and populates it
   * with background, layer, preview, and GUI canvases that mirror CanvasArea's
   * structure, registering every canvas and context on `navigatorState`. A
   * `$effect` keeps the overlay's CSS `display` in sync with `navigatorOpen`.
   * Canvas pixel dimensions are read from `canvas.offScreenCVS` (logical art
   * size) and `canvas.vectorGuiCVS` (physical, already DPR-scaled) rather
   * than the overlay's own layout metrics, which return zero while the
   * element is `display:none`.
   */
  import { onMount } from 'svelte'
  import { canvas } from '../../context/canvas.js'
  import { globalState } from '../../context/state.js'
  import { navigatorState } from '../../navigator/navigatorState.js'

  let overlayEl = null

  onMount(() => {
    overlayEl = document.createElement('div')
    overlayEl.className = 'nav-canvas-overlay'
    overlayEl.style.display = 'none'
    navigatorState.overlayEl = overlayEl

    const bgSpace = document.querySelector('.bg-space')
    if (bgSpace) bgSpace.appendChild(overlayEl)

    // CanvasArea.svelte mounts before NavigatorCanvas in App.svelte, so
    // canvas.offScreenCVS is typically already set here. The interval fallback
    // handles any edge case where mount order differs.
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
      navigatorState.simCursorEl?.remove()
      navigatorState.simCursorEl = null
    }
  })

  $effect(() => {
    // Mirrors navigatorOpen to the overlay's CSS display. isOpen is read
    // before the guard so Svelte tracks navigatorOpen as a reactive
    // dependency on the very first synchronous run, when overlayEl is
    // still null because onMount has not yet fired.
    const isOpen = globalState.ui.navigatorOpen
    if (overlayEl) {
      overlayEl.style.display = isOpen ? 'block' : 'none'
    }
  })

  /**
   * Builds every canvas and context the navigator needs and registers them
   * on `navigatorState`. Called once from `onMount` after
   * `canvas.offScreenCVS` is confirmed available — the overlay's layout
   * metrics are all zero at that point because it is still `display:none`,
   * so pixel dimensions must come from the offscreen canvas (logical art
   * size) and `canvas.vectorGuiCVS` (physical, already DPR-scaled).
   * Children are appended in deliberate order — bgCVS first, then the
   * navCanvasLayers container, then GUI overlay canvases — so CSS paint
   * order matches the real canvas area's stacking without explicit
   * `z-index` values. `navigatorState.layer` and `.previewLayer` are
   * plain objects rather than reactive state so the rendering pipeline
   * treats them identically to normal raster layers.
   */
  function setupNavCanvases() {
    const w = canvas.offScreenCVS.width
    const h = canvas.offScreenCVS.height

    // vectorGuiCVS dimensions are already offsetWidth * sharpness, set by
    // CanvasArea. Reading offsetWidth on overlayEl would return 0 because
    // the overlay is display:none at setup time.
    const pw = canvas.vectorGuiCVS.width
    const ph = canvas.vectorGuiCVS.height
    const t = canvas.sharpness * canvas.zoom

    // Needs its own compositing target so navigator rendering stays isolated
    // from canvas.offScreenCVS, which the main editor owns.
    const offScreenCVS = document.createElement('canvas')
    offScreenCVS.width = w
    offScreenCVS.height = h
    const offScreenCTX = offScreenCVS.getContext('2d', {
      willReadFrequently: true,
    })

    // willReadFrequently because tool code calls getImageData on layer.cvs
    // during stroke operations, same as on the main editor's layer canvases.
    const layerCVS = document.createElement('canvas')
    layerCVS.width = w
    layerCVS.height = h
    const layerCTX = layerCVS.getContext('2d', { willReadFrequently: true })

    // Must be first child so it sits behind the layer canvas in paint
    // order. The bg-canvas CSS class gives it the diagonal-stripe
    // background-image; renderBackgroundCanvas() then draws the gray
    // surround and transparent hole on top, replicating the real canvas
    // background without needing a separate DOM layer.
    const bgCVS = document.createElement('canvas')
    bgCVS.className = 'bg-canvas'
    overlayEl.appendChild(bgCVS)
    bgCVS.width = pw
    bgCVS.height = ph
    const bgCTX = bgCVS.getContext('2d', { desynchronized: true })
    bgCTX.setTransform(t, 0, 0, t, 0, 0)

    // Mirrors dom.canvasLayers so that all layer DOM operations
    // (append/remove of onscreen canvases) target the overlay instead of
    // the real canvas area. canvasSwap.js swaps dom.canvasLayers to this
    // div for the duration of each navigator session.
    const navCanvasLayers = document.createElement('div')
    navCanvasLayers.style.position = 'absolute'
    navCanvasLayers.style.width = '100%'
    navCanvasLayers.style.height = '100%'
    overlayEl.appendChild(navCanvasLayers)
    navigatorState.navCanvasLayers = navCanvasLayers

    // Lives inside navCanvasLayers so it participates in the
    // dom.canvasLayers swap the same way any other layer's onscreen canvas
    // does, keeping the navigator's render loop agnostic to whether it is
    // in normal or navigator mode.
    const onscreenCVS = document.createElement('canvas')
    onscreenCVS.className = 'onscreen-canvas'
    navCanvasLayers.appendChild(onscreenCVS)
    onscreenCVS.width = pw
    onscreenCVS.height = ph
    const onscreenCTX = onscreenCVS.getContext('2d', { desynchronized: true })
    onscreenCTX.setTransform(t, 0, 0, t, 0, 0)

    // willReadFrequently because live-stroke compositing reads preview
    // pixel data during playback, matching the main editor's previewCVS.
    const previewCVS = document.createElement('canvas')
    previewCVS.width = w
    previewCVS.height = h
    const previewCTX = previewCVS.getContext('2d', { willReadFrequently: true })

    // The tool system appends and removes this from dom.canvasLayers
    // during an active stroke, exactly as it does for the main tempLayer,
    // so no tool-side changes are needed when running in navigator mode.
    const prevOnscreenCVS = document.createElement('canvas')
    prevOnscreenCVS.className = 'onscreen-canvas'
    prevOnscreenCVS.width = pw
    prevOnscreenCVS.height = ph
    const prevOnscreenCTX = prevOnscreenCVS.getContext('2d', {
      desynchronized: true,
    })
    prevOnscreenCTX.setTransform(t, 0, 0, t, 0, 0)

    // Mirror the cursor, selection-gui, and vector-gui canvases from
    // CanvasArea so GUI rendering during a navigator session targets the
    // overlay instead of the real (hidden-under-overlay) canvases.
    const navCursorCVS = document.createElement('canvas')
    navCursorCVS.className = 'onscreen-canvas'
    navCursorCVS.width = pw
    navCursorCVS.height = ph
    const navCursorCTX = navCursorCVS.getContext('2d', { desynchronized: true })
    navCursorCTX.setTransform(t, 0, 0, t, 0, 0)
    overlayEl.appendChild(navCursorCVS)

    const navSelectionGuiCVS = document.createElement('canvas')
    navSelectionGuiCVS.className = 'onscreen-canvas'
    navSelectionGuiCVS.width = pw
    navSelectionGuiCVS.height = ph
    const navSelectionGuiCTX = navSelectionGuiCVS.getContext('2d', {
      desynchronized: true,
    })
    navSelectionGuiCTX.setTransform(t, 0, 0, t, 0, 0)
    overlayEl.appendChild(navSelectionGuiCVS)

    const navVectorGuiCVS = document.createElement('canvas')
    navVectorGuiCVS.className = 'onscreen-canvas'
    navVectorGuiCVS.width = pw
    navVectorGuiCVS.height = ph
    const navVectorGuiCTX = navVectorGuiCVS.getContext('2d', {
      desynchronized: true,
    })
    navVectorGuiCTX.setTransform(t, 0, 0, t, 0, 0)
    overlayEl.appendChild(navVectorGuiCVS)

    navigatorState.backgroundCVS = bgCVS
    navigatorState.backgroundCTX = bgCTX

    navigatorState.cursorCVS = navCursorCVS
    navigatorState.cursorCTX = navCursorCTX
    navigatorState.selectionGuiCVS = navSelectionGuiCVS
    navigatorState.selectionGuiCTX = navSelectionGuiCTX
    navigatorState.vectorGuiCTX = navVectorGuiCTX

    // Appended to document.body with position:fixed so it can travel
    // outside the canvas overlay to reach UI elements during playback.
    // Shape is set dynamically by player-event.js at playback start.
    const simCursor = document.createElement('div')
    simCursor.className = 'nav-sim-cursor'
    document.body.appendChild(simCursor)
    navigatorState.simCursorEl = simCursor

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
