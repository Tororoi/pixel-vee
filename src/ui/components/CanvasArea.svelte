<script>
  /**
   * @component
   * Owns the full on-screen canvas stack and wires all pointer,
   * wheel, touch, and mouse events through Svelte's native event
   * binding system. The five layered canvas elements are declared
   * here so Svelte manages their lifetime; `bind:this` captures
   * each DOM reference at mount, after which they populate the
   * shared canvas singleton used by every drawing module.
   *
   * The root `.canvas-container` element is portaled directly into
   * `.page` via `use:portal` on the element itself rather than on
   * an outer wrapper. An outer `display:contents` wrapper causes
   * Chrome to misresolve CSS `height:100%` for flex children; an
   * `inset:0` absolute-positioned wrapper introduces its own
   * containing-block height quirks. Making `.canvas-container` a
   * direct flex child of `.page` reproduces the original HTML
   * layout so `offsetHeight` is correct at `onMount` time.
   * @param {HTMLElement} pageEl - The `.page` element to portal into.
   */
  import { onMount } from 'svelte'
  import { portal } from '../../utils/portal.js'
  import { dom } from '../../context/dom.js'
  import { canvas } from '../../context/canvas.js'
  import { setInitialZoom } from '../../utils/canvasHelpers.js'
  import { addRasterLayer } from '../../actions/layer/layerActions.js'
  import { createPreviewLayer } from '../../canvas/layers.js'
  import { renderCanvas } from '../../canvas/render.js'
  import { resizeOnScreenCanvas } from '../../canvas/resizeOnScreenCanvas.js'
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

  /**
   * Populates the canvas singleton, calibrates every 2D context,
   * and bootstraps the first raster layer once all canvas elements
   * are in the live DOM with committed CSS dimensions. On-screen
   * contexts receive `desynchronized:true` so the GPU can composite
   * them without blocking the main thread; off-screen contexts use
   * `willReadFrequently:true` because brush and flood-fill ops call
   * `getImageData` on every pointer event. All buffer dimensions are
   * assigned before context transforms because writing to `.width`
   * or `.height` resets the context transform to identity.
   * `dom.canvasLayers` must be wired before `addRasterLayer` because
   * `createRasterLayer` calls `dom.canvasLayers.appendChild`
   * synchronously during layer construction.
   */
  onMount(() => {
    canvas.backgroundCVS = backgroundCVS
    // desynchronized:true lets the GPU composite frames without
    // waiting for the main-thread frame boundary, eliminating
    // stalls during fast strokes. Applied to all on-screen canvases.
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

    const offScreenCVS = document.createElement('canvas')
    canvas.offScreenCVS = offScreenCVS
    // willReadFrequently:true keeps pixel data in CPU-accessible
    // memory, avoiding the GPU-to-CPU readback cost that getImageData
    // would otherwise incur on every brush and flood-fill event.
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

    canvas.offScreenCVS.width = 128
    canvas.offScreenCVS.height = 128
    canvas.previewCVS.width = canvas.offScreenCVS.width
    canvas.previewCVS.height = canvas.offScreenCVS.height
    canvas.thumbnailCVS.width = 600
    canvas.thumbnailCVS.height = 256
    // devicePixelRatio converts CSS pixels to physical pixels so
    // the buffer matches the screen's native resolution and stays
    // crisp on HiDPI (Retina) displays.
    canvas.sharpness = window.devicePixelRatio
    // Writing .width or .height resets the 2D context transform to
    // identity; all dimension assignments are grouped here so the
    // .scale() calls below operate on a freshly-reset context.
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

    // offsetWidth/offsetHeight are CSS layout dimensions and are not
    // affected by the .width buffer assignments above, so they still
    // represent the true display area for zoom calibration.
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
    // The thumbnail renders the art at native pixel density rather
    // than at the canvas zoom level, so zoom is excluded from its
    // transform.
    canvas.thumbnailCTX.scale(canvas.sharpness, canvas.sharpness)

    // CanvasSizeDialog populates dom.canvasWidth/Height in its own
    // onMount, which may not have run yet; the guards prevent a
    // null-property write if that dialog has not mounted.
    if (dom.canvasWidth) dom.canvasWidth.value = canvas.offScreenCVS.width
    if (dom.canvasHeight) dom.canvasHeight.value = canvas.offScreenCVS.height
    if (dom.gridSpacing) dom.gridSpacing.value = 8

    // createRasterLayer calls dom.canvasLayers.appendChild
    // synchronously, so the ref must be live before addRasterLayer.
    dom.canvasLayers = canvasLayersDiv

    addRasterLayer()
    canvas.currentLayer = canvas.layers[0]
    // Divide buffer pixels by sharpness×zoom to convert to logical
    // canvas coordinates, then halve the surplus to center the art
    // pixel grid within the visible display area.
    canvas.xOffset = Math.round(
      (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
        canvas.offScreenCVS.width) /
        2,
    )
    canvas.yOffset = Math.round(
      (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
        canvas.offScreenCVS.height) /
        2,
    )
    canvas.previousXOffset = canvas.xOffset
    canvas.previousYOffset = canvas.yOffset
    renderCanvas(canvas.currentLayer)
    canvas.tempLayer = createPreviewLayer()
  })
</script>

<!-- svelte:window is used instead of window.addEventListener so
     the resize handler is automatically removed if this component
     is ever destroyed. -->
<svelte:window onresize={resizeOnScreenCanvas} />

<div class="canvas-container" use:portal={pageEl}>
  <div class="bg-space">
    <canvas class="bg-canvas" id="background" bind:this={backgroundCVS}
    ></canvas>
    <div class="canvas-layers" bind:this={canvasLayersDiv}></div>
    <canvas class="onscreen-canvas" id="cursor-canvas" bind:this={cursorCVS}
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
    <!--
      vector-gui-canvas sits topmost in the z-stack, so all pointer
      events are intercepted here before reaching lower canvases.
      The other canvases are visual-only compositing surfaces and
      carry no input listeners.
    -->
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
