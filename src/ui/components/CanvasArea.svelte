<script>
  import { onMount } from 'svelte'
  import { portal } from '../../utils/portal.js'
  import { dom } from '../../context/dom.js'
  import { canvas } from '../../context/canvas.js'
  import { setInitialZoom } from '../../utils/canvasHelpers.js'
  import { addRasterLayer } from '../../actions/layer/layerActions.js'
  import { createPreviewLayer } from '../../canvas/layers.js'
  import { renderCanvas } from '../../canvas/render.js'
  import { resizeOnScreenCanvas } from '../../canvas/events.js'
  import {
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerOut,
    handleTouchStart,
    handleMouseDown,
  } from '../../controls/events.js'

  let { pageEl } = $props()

  let backgroundCVS = $state(null)
  let vectorGuiCVS = $state(null)
  let selectionGuiCVS = $state(null)
  let resizeOverlayCVS = $state(null)
  let cursorCVS = $state(null)
  let canvasLayersDiv = $state(null)

  onMount(() => {
    // Assign on-screen element refs and their 2D contexts
    canvas.backgroundCVS = backgroundCVS
    canvas.backgroundCTX = backgroundCVS.getContext('2d', {
      desynchronized: true,
    })
    canvas.vectorGuiCVS = vectorGuiCVS
    canvas.vectorGuiCTX = vectorGuiCVS.getContext('2d', {
      desynchronized: true,
    })
    canvas.selectionGuiCVS = selectionGuiCVS
    canvas.selectionGuiCTX = selectionGuiCVS.getContext('2d', {
      desynchronized: true,
    })
    canvas.resizeOverlayCVS = resizeOverlayCVS
    canvas.resizeOverlayCTX = resizeOverlayCVS.getContext('2d', {
      desynchronized: true,
    })
    canvas.cursorCVS = cursorCVS
    canvas.cursorCTX = cursorCVS.getContext('2d', {
      desynchronized: true,
    })

    // Create off-screen canvases
    const offScreenCVS = document.createElement('canvas')
    canvas.offScreenCVS = offScreenCVS
    canvas.offScreenCTX = offScreenCVS.getContext('2d', {
      willReadFrequently: true,
    })
    const previewCVS = document.createElement('canvas')
    canvas.previewCVS = previewCVS
    canvas.previewCTX = previewCVS.getContext('2d', {
      willReadFrequently: true,
    })
    const thumbnailCVS = document.createElement('canvas')
    canvas.thumbnailCVS = thumbnailCVS
    canvas.thumbnailCTX = thumbnailCVS.getContext('2d', {
      willReadFrequently: true,
    })

    // Dimensions (from canvas.svelte.js lines 93–114)
    canvas.offScreenCVS.width = 128
    canvas.offScreenCVS.height = 128
    canvas.previewCVS.width = canvas.offScreenCVS.width
    canvas.previewCVS.height = canvas.offScreenCVS.height
    canvas.thumbnailCVS.width = 600
    canvas.thumbnailCVS.height = 256
    canvas.sharpness = window.devicePixelRatio
    canvas.vectorGuiCVS.width =
      canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
    canvas.vectorGuiCVS.height =
      canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
    canvas.selectionGuiCVS.width =
      canvas.selectionGuiCVS.offsetWidth * canvas.sharpness
    canvas.selectionGuiCVS.height =
      canvas.selectionGuiCVS.offsetHeight * canvas.sharpness
    canvas.resizeOverlayCVS.width =
      canvas.resizeOverlayCVS.offsetWidth * canvas.sharpness
    canvas.resizeOverlayCVS.height =
      canvas.resizeOverlayCVS.offsetHeight * canvas.sharpness
    canvas.cursorCVS.width = canvas.cursorCVS.offsetWidth * canvas.sharpness
    canvas.cursorCVS.height = canvas.cursorCVS.offsetHeight * canvas.sharpness
    canvas.backgroundCVS.width =
      canvas.backgroundCVS.offsetWidth * canvas.sharpness
    canvas.backgroundCVS.height =
      canvas.backgroundCVS.offsetHeight * canvas.sharpness

    // Zoom and GUI sizing (from canvas.svelte.js lines 116–127)
    canvas.zoom = setInitialZoom(
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height,
      canvas.vectorGuiCVS.offsetWidth,
      canvas.vectorGuiCVS.offsetHeight,
    )
    canvas.zoomAtLastDraw = canvas.zoom
    canvas.gui = {
      lineWidth: canvas.zoom <= 8 ? 0.5 / canvas.zoom : 0.5 / 8,
      renderRadius: 4,
      collisionRadius: canvas.zoom <= 6 ? 1 : 0.5,
    }

    // Context transforms (from canvas.svelte.js lines 128–145)
    canvas.vectorGuiCTX.scale(
      canvas.sharpness * canvas.zoom,
      canvas.sharpness * canvas.zoom,
    )
    canvas.selectionGuiCTX.scale(
      canvas.sharpness * canvas.zoom,
      canvas.sharpness * canvas.zoom,
    )
    canvas.resizeOverlayCTX.scale(
      canvas.sharpness * canvas.zoom,
      canvas.sharpness * canvas.zoom,
    )
    canvas.cursorCTX.scale(
      canvas.sharpness * canvas.zoom,
      canvas.sharpness * canvas.zoom,
    )
    canvas.backgroundCTX.scale(
      canvas.sharpness * canvas.zoom,
      canvas.sharpness * canvas.zoom,
    )
    canvas.thumbnailCTX.scale(canvas.sharpness, canvas.sharpness)

    // Guarded form-field writes (from canvas.svelte.js lines 147–149)
    if (dom.canvasWidth) dom.canvasWidth.value = canvas.offScreenCVS.width
    if (dom.canvasHeight) dom.canvasHeight.value = canvas.offScreenCVS.height
    if (dom.gridSpacing) dom.gridSpacing.value = 8

    // Must set dom.canvasLayers BEFORE addRasterLayer —
    // it calls dom.canvasLayers.appendChild immediately
    dom.canvasLayers = canvasLayersDiv

    // Layer and offset initialization (from canvas/events.js lines 117–137)
    addRasterLayer()
    canvas.currentLayer = canvas.layers[0]
    canvas.xOffset = Math.round(
      (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
        canvas.offScreenCVS.width) /
        2,
    )
    canvas.yOffset = Math.round(
      (canvas.currentLayer.onscreenCvs.height /
        canvas.sharpness /
        canvas.zoom -
        canvas.offScreenCVS.height) /
        2,
    )
    canvas.previousXOffset = canvas.xOffset
    canvas.previousYOffset = canvas.yOffset
    renderCanvas(canvas.currentLayer)
    canvas.tempLayer = createPreviewLayer()
  })
</script>

<svelte:window onresize={resizeOnScreenCanvas} />

<div class="canvas-container" use:portal={pageEl}>
  <div class="bg-space">
    <canvas
      class="bg-canvas"
      id="background"
      bind:this={backgroundCVS}
    ></canvas>
    <div class="canvas-layers" bind:this={canvasLayersDiv}></div>
    <canvas
      class="onscreen-canvas"
      id="cursor-canvas"
      bind:this={cursorCVS}
    ></canvas>
    <canvas
      class="onscreen-canvas"
      id="selection-gui-canvas"
      bind:this={selectionGuiCVS}
    ></canvas>
    <canvas
      class="onscreen-canvas"
      id="resize-overlay-canvas"
      bind:this={resizeOverlayCVS}
    ></canvas>
    <canvas
      class="onscreen-canvas"
      id="vector-gui-canvas"
      bind:this={vectorGuiCVS}
      onpointermove={handlePointerMove}
      onpointerdown={handlePointerDown}
      onpointerup={handlePointerUp}
      onpointerout={handlePointerOut}
      onwheel={handleWheel}
      ontouchstart={handleTouchStart}
      onmousedown={handleMouseDown}
    ></canvas>
  </div>
</div>
