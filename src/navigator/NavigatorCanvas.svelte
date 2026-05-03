<script>
  /**
   * @component
   * Creates and manages an overlay canvas stack for the navigator. Appends a
   * div to `.bg-space` that holds the navigator layer's onscreen canvas.
   * Visibility mirrors `navigatorOpen`. Canvas dimensions are copied from
   * `canvas.vectorGuiCVS` rather than `offsetWidth/Height` so they are
   * correct even while the overlay is hidden (hidden elements return 0).
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
    // Read navigatorOpen unconditionally so Svelte tracks it as a dependency
    // even on the first effect run, when overlayEl is still null (onMount
    // hasn't fired yet).
    const isOpen = globalState.ui.navigatorOpen
    if (overlayEl) {
      overlayEl.style.display = isOpen ? 'block' : 'none'
    }
  })

  function setupNavCanvases() {
    const w = canvas.offScreenCVS.width
    const h = canvas.offScreenCVS.height

    // Use vectorGuiCVS pixel dimensions — already set to offsetWidth * sharpness
    // by CanvasArea. Reading offsetWidth here would return 0 because overlayEl
    // is display:none at setup time.
    const pw = canvas.vectorGuiCVS.width
    const ph = canvas.vectorGuiCVS.height
    const t = canvas.sharpness * canvas.zoom

    // Offscreen composite canvas (mirrors canvas.offScreenCVS role)
    const offScreenCVS = document.createElement('canvas')
    offScreenCVS.width = w
    offScreenCVS.height = h
    const offScreenCTX = offScreenCVS.getContext('2d', {
      willReadFrequently: true,
    })

    // Offscreen canvas for the nav raster layer (pixel data storage)
    const layerCVS = document.createElement('canvas')
    layerCVS.width = w
    layerCVS.height = h
    const layerCTX = layerCVS.getContext('2d', { willReadFrequently: true })

    // Background canvas — must be first child so it sits behind the layer canvas.
    // The bg-canvas CSS class gives it the diagonal-stripe background-image;
    // renderBackgroundCanvas() then draws the gray surround + transparent hole
    // on top of that CSS pattern, exactly replicating the real canvas background.
    const bgCVS = document.createElement('canvas')
    bgCVS.className = 'bg-canvas'
    overlayEl.appendChild(bgCVS)
    bgCVS.width = pw
    bgCVS.height = ph
    const bgCTX = bgCVS.getContext('2d', { desynchronized: true })
    bgCTX.setTransform(t, 0, 0, t, 0, 0)

    // Onscreen display canvas for the nav raster layer — lives in our overlay
    const onscreenCVS = document.createElement('canvas')
    onscreenCVS.className = 'onscreen-canvas'
    overlayEl.appendChild(onscreenCVS)
    onscreenCVS.width = pw
    onscreenCVS.height = ph
    const onscreenCTX = onscreenCVS.getContext('2d', { desynchronized: true })
    onscreenCTX.setTransform(t, 0, 0, t, 0, 0)

    // Offscreen canvas for navigator preview strokes (live feedback)
    const previewCVS = document.createElement('canvas')
    previewCVS.width = w
    previewCVS.height = h
    const previewCTX = previewCVS.getContext('2d', { willReadFrequently: true })

    // Onscreen canvas for navigator preview — the tool system appends/removes
    // this to dom.canvasLayers during an active stroke, same as tempLayer.
    const prevOnscreenCVS = document.createElement('canvas')
    prevOnscreenCVS.className = 'onscreen-canvas'
    prevOnscreenCVS.width = pw
    prevOnscreenCVS.height = ph
    const prevOnscreenCTX = prevOnscreenCVS.getContext('2d', {
      desynchronized: true,
    })
    prevOnscreenCTX.setTransform(t, 0, 0, t, 0, 0)

    // GUI overlay canvases — mirror the cursor, selection-gui, and vector-gui
    // canvases from CanvasArea so that GUI rendering during a nav session goes
    // to the overlay instead of the real (hidden-under-overlay) canvases.
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

    // Simulated cursor — appended to body with position:fixed so it can travel
    // outside the canvas overlay to reach UI elements. Shape is set dynamically
    // by player-event.js at playback start.
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
