<script>
  import { onMount } from 'svelte'
  import {
    bump,
    getVersion,
    getDitherVectorTarget,
    setDitherVectorTarget,
  } from '../../hooks/appState.svelte.js'
  import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
  import { globalState } from '../../Context/state.js'
  import { dom } from '../../Context/dom.js'
  import { brush, rebuildBuildUpDensityMap, BAYER_STEPS } from '../../Tools/brush.js'
  import { renderCanvas } from '../../Canvas/render.js'
  import {
    applyDitherOffset,
    applyDitherOffsetControl,
    createDitherPatternSVG,
    createDitherOffsetControlSVG,
  } from '../../DOM/renderBrush.js'
  import { ditherPatterns } from '../../Context/ditherPatterns.js'
  import { swatches } from '../../Context/swatch.js'
  import { changeActionVectorDitherPattern, changeActionVectorDitherOffset } from '../../Actions/modifyTimeline/modifyTimeline.js'

  const DITHER_TOOLS = ['brush', 'curve', 'ellipse']

  let ref = $state(null)

  // Reactive state replacing all render*ToDOM calls.
  // Each derived reads getVersion() directly so bump() always forces re-evaluation,
  // even when globalState.tool.current is the same object reference.
  const vectorTarget = $derived(getDitherVectorTarget())

  const activePatternIndex = $derived(
    getVersion() >= 0 &&
      (vectorTarget?.ditherPatternIndex ?? globalState.tool.current?.ditherPatternIndex),
  )
  const twoColorActive = $derived(
    getVersion() >= 0 &&
      !!(vectorTarget ? vectorTarget.modes?.twoColor : globalState.tool.current?.modes?.twoColor),
  )
  const buildUpActive = $derived(
    getVersion() >= 0 && !vectorTarget && !!(globalState.tool.current?.modes?.buildUpDither),
  )
  const showBuildUpBtn = $derived(
    getVersion() >= 0 && !vectorTarget && globalState.tool.current?.name === 'brush',
  )
  const buildUpMode = $derived(
    getVersion() >= 0 ? (globalState.tool.current?.buildUpMode ?? 'custom') : 'custom',
  )
  const buildUpSteps = $derived.by(() => {
    getVersion()
    return [...(globalState.tool.current?.buildUpSteps ?? [15, 31, 47, 63])]
  })
  const buildUpActiveSlot = $derived(
    getVersion() >= 0 ? (globalState.tool.current?.buildUpActiveStepSlot ?? null) : null,
  )
  const ditherOffsetX = $derived(
    getVersion() >= 0
      ? ((vectorTarget ?? globalState.tool.current)?.ditherOffsetX ?? 0)
      : 0,
  )
  const ditherOffsetY = $derived(
    getVersion() >= 0
      ? ((vectorTarget ?? globalState.tool.current)?.ditherOffsetY ?? 0)
      : 0,
  )

  // Sync offset to SVG attributes for state-driven changes.
  // Drag still calls applyDitherOffset directly for immediate feedback.
  $effect(() => {
    const x = ditherOffsetX
    const y = ditherOffsetY
    if (!ref) return
    ref.querySelectorAll('.dither-tile-pattern').forEach((p) => {
      p.setAttribute('x', String(-x))
      p.setAttribute('y', String(-y))
    })
    const ring = ref.querySelector('.dither-offset-ring-pattern')
    if (ring) {
      ring.setAttribute('x', String(-x))
      ring.setAttribute('y', String(-y))
    }
  })

  // Sync SVG colors whenever swatches or two-color mode changes
  $effect(() => {
    getVersion()
    if (!ref) return
    const primary = swatches.primary.color.color
    const secondary = swatches.secondary.color.color
    const bgFill = twoColorActive ? secondary : 'none'
    ref.querySelectorAll('.dither-bg-rect').forEach((r) => r.setAttribute('fill', bgFill))
    ref.querySelectorAll('.dither-on-path').forEach((p) => p.setAttribute('stroke', primary))
  })

  function appendPatternSVG(node, pattern) {
    node.appendChild(createDitherPatternSVG(pattern))
    return {}
  }

  function appendOffsetControlSVG(node) {
    node.appendChild(createDitherOffsetControlSVG())
    return {}
  }

  function serializePatternSVG(pattern, ox = 0, oy = 0) {
    return new XMLSerializer().serializeToString(createDitherPatternSVG(pattern, ox, oy))
  }

  function handleStepSlotClick(slotIndex) {
    brush.buildUpActiveStepSlot = brush.buildUpActiveStepSlot === slotIndex ? null : slotIndex
    bump()
  }

  onMount(() => {
    if (!ref) return
    const el = ref
    // Patch dom reference — dom.js queried this at module load before Svelte rendered
    dom.ditherPickerContainer = el
    el.style.display = 'none'
    initializeDragger(el)
    initializeCollapser(el)

    // Close button
    el.querySelector('.close-btn')?.addEventListener('click', () => {
      setDitherVectorTarget(null)
      el.style.display = 'none'
    })

    // Dither grid — pattern selection
    el.querySelector('.dither-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.dither-grid-btn')
      if (!btn) return
      const patternIndex = parseInt(btn.dataset.patternIndex)
      const vt = getDitherVectorTarget()
      if (vt) {
        const oldPatternIndex = vt.ditherPatternIndex
        vt.ditherPatternIndex = patternIndex
        renderCanvas(vt.layer, true)
        if (oldPatternIndex !== patternIndex) {
          changeActionVectorDitherPattern(vt, oldPatternIndex, patternIndex)
          globalState.clearRedoStack()
        }
        bump()
        return
      }
      if (!DITHER_TOOLS.includes(globalState.tool.current?.name)) return
      if (brush.buildUpActiveStepSlot !== null) {
        brush.buildUpSteps[brush.buildUpActiveStepSlot] = patternIndex
        brush.buildUpActiveStepSlot = null
      } else {
        globalState.tool.current.ditherPatternIndex = patternIndex
      }
      bump()
    })

    // Two-color toggle
    el.querySelector('#dither-ctrl-two-color')?.addEventListener('click', () => {
      const vt = getDitherVectorTarget()
      if (vt) {
        if (!vt.modes) vt.modes = {}
        vt.modes.twoColor = !vt.modes.twoColor
        renderCanvas(vt.layer, true)
        bump()
        return
      }
      if (!DITHER_TOOLS.includes(globalState.tool.current?.name)) return
      globalState.tool.current.modes.twoColor = !globalState.tool.current.modes.twoColor
      bump()
    })

    // Build-up dither toggle
    el.querySelector('#dither-ctrl-build-up')?.addEventListener('click', () => {
      if (globalState.tool.current?.name !== 'brush') return
      brush.modes.buildUpDither = !brush.modes.buildUpDither
      if (brush.modes.buildUpDither) {
        rebuildBuildUpDensityMap()
      } else {
        brush._buildUpDensityMap = new Map()
        brush.buildUpActiveStepSlot = null
      }
      bump()
    })

    // Build-up reset
    el.querySelector('#dither-ctrl-build-up-reset')?.addEventListener('click', () => {
      if (globalState.tool.current?.name !== 'brush') return
      brush._buildUpResetAtIndex = globalState.timeline.undoStack.length
      brush._buildUpDensityMap = new Map()
    })

    // Build-up mode selector
    el.querySelector('.build-up-mode-selector')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.build-up-mode-btn')
      if (!btn || globalState.tool.current?.name !== 'brush') return
      const mode = btn.dataset.mode
      if (brush.buildUpMode === 'custom' && mode !== 'custom') {
        brush._customBuildUpSteps = [...brush.buildUpSteps]
      }
      brush.buildUpMode = mode
      if (mode === 'custom') {
        brush.buildUpSteps = [...brush._customBuildUpSteps]
      } else {
        brush.buildUpSteps = BAYER_STEPS[mode] ? [...BAYER_STEPS[mode]] : brush.buildUpSteps
      }
      bump()
    })

    // Dither offset drag
    el.addEventListener('pointerdown', (e) => {
      const control = e.target.closest('.dither-offset-control')
      if (!control) return
      const vt = getDitherVectorTarget()
      if (!vt && !DITHER_TOOLS.includes(globalState.tool.current?.name)) return
      control.setPointerCapture(e.pointerId)
      const startX = e.clientX
      const startY = e.clientY

      if (vt) {
        // Vector branch — accounts for layer position, records timeline action on release
        const currentLayerX = vt.layer?.x ?? 0
        const currentLayerY = vt.layer?.y ?? 0
        const recordedLayerX = vt.recordedLayerX ?? currentLayerX
        const recordedLayerY = vt.recordedLayerY ?? currentLayerY
        const startEffectiveX = ((((vt.ditherOffsetX ?? 0) + recordedLayerX - currentLayerX) % 8) + 8) % 8
        const startEffectiveY = ((((vt.ditherOffsetY ?? 0) + recordedLayerY - currentLayerY) % 8) + 8) % 8
        const fromOffset = { x: vt.ditherOffsetX ?? 0, y: vt.ditherOffsetY ?? 0 }
        const onMove = (ev) => {
          const newEffectiveX = (((startEffectiveX - Math.round((ev.clientX - startX) / 4)) % 8) + 8) % 8
          const newEffectiveY = (((startEffectiveY - Math.round((ev.clientY - startY) / 4)) % 8) + 8) % 8
          vt.ditherOffsetX = (((newEffectiveX - recordedLayerX + currentLayerX) % 8) + 8) % 8
          vt.ditherOffsetY = (((newEffectiveY - recordedLayerY + currentLayerY) % 8) + 8) % 8
          renderCanvas(vt.layer, true)
          applyDitherOffset(el, vt.ditherOffsetX, vt.ditherOffsetY)
          const vectorPreview = document.querySelector('.vector-dither-preview')
          if (vectorPreview) applyDitherOffset(vectorPreview, vt.ditherOffsetX, vt.ditherOffsetY)
          applyDitherOffsetControl(control.parentElement, vt.ditherOffsetX, vt.ditherOffsetY)
        }
        control.addEventListener('pointermove', onMove)
        control.addEventListener(
          'pointerup',
          () => {
            control.removeEventListener('pointermove', onMove)
            const toOffset = { x: vt.ditherOffsetX ?? 0, y: vt.ditherOffsetY ?? 0 }
            if (fromOffset.x !== toOffset.x || fromOffset.y !== toOffset.y) {
              changeActionVectorDitherOffset(vt, fromOffset, toOffset)
              globalState.clearRedoStack()
            }
            bump()
          },
          { once: true },
        )
      } else {
        // Tool branch — no timeline recording needed
        const target = globalState.tool.current
        const startOffsetX = target.ditherOffsetX ?? 0
        const startOffsetY = target.ditherOffsetY ?? 0
        const onMove = (ev) => {
          const ox = (((startOffsetX - Math.round((ev.clientX - startX) / 4)) % 8) + 8) % 8
          const oy = (((startOffsetY - Math.round((ev.clientY - startY) / 4)) % 8) + 8) % 8
          target.ditherOffsetX = ox
          target.ditherOffsetY = oy
          applyDitherOffset(el, ox, oy)
          const preview = document.querySelector('.dither-preview')
          if (preview) applyDitherOffset(preview, ox, oy)
          applyDitherOffsetControl(control.parentElement, ox, oy)
        }
        control.addEventListener('pointermove', onMove)
        control.addEventListener(
          'pointerup',
          () => {
            control.removeEventListener('pointermove', onMove)
            bump()
          },
          { once: true },
        )
      }
    })

    return () => {
      delete el.dataset.dragInitialized
    }
  })
</script>

<div
  bind:this={ref}
  class="dither-picker-container dialog-box draggable v-drag h-drag free"
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Dither Pattern
    <button type="button" class="close-btn" aria-label="Close" data-tooltip="Close"></button>
  </div>
  <div class="collapsible">
    <div class="dither-controls">
      <button
        type="button"
        class="dither-toggle twoColor"
        id="dither-ctrl-two-color"
        aria-label="Two-Color"
        data-tooltip="Two-Color"
        class:selected={twoColorActive}
      ></button>
      <button
        type="button"
        class="dither-toggle buildUpDither"
        id="dither-ctrl-build-up"
        aria-label="Build-Up Dither"
        data-tooltip="Build-Up Dither&#10;&#10;Automatically increase dither density on overlapping strokes"
        class:selected={buildUpActive}
        style:display={showBuildUpBtn ? '' : 'none'}
      ></button>
      <div class="dither-offset-control-wrap">
        <div
          class="dither-offset-control"
          data-tooltip="Drag to set dither offset"
          use:appendOffsetControlSVG
        ></div>
        <div class="dither-offset-values">
          <span>X: {ditherOffsetX}</span><span>Y: {ditherOffsetY}</span>
        </div>
      </div>
    </div>
    <div class="build-up-steps" style:display={buildUpActive ? 'flex' : 'none'}>
      <span class="build-up-steps-label">Build-Up Steps</span>
      <div class="build-up-mode-selector">
        <button
          type="button"
          class="build-up-mode-btn"
          class:selected={buildUpMode === 'custom'}
          data-mode="custom"
          data-tooltip="Custom build-up steps"
        >Custom</button>
        <button
          type="button"
          class="build-up-mode-btn"
          class:selected={buildUpMode === '2x2'}
          data-mode="2x2"
          data-tooltip="4 steps from a 2x2 Bayer Matrix"
        >2×2</button>
        <button
          type="button"
          class="build-up-mode-btn"
          class:selected={buildUpMode === '4x4'}
          data-mode="4x4"
          data-tooltip="16 steps from a 4x4 Bayer Matrix"
        >4×4</button>
        <button
          type="button"
          class="build-up-mode-btn"
          class:selected={buildUpMode === '8x8'}
          data-mode="8x8"
          data-tooltip="64 steps from an 8x8 Bayer Matrix"
        >8×8</button>
      </div>
      <div class="build-up-step-slots">
        {#if buildUpMode === 'custom'}
          {#each buildUpSteps as patternIndex, i}
            <button
              type="button"
              class="build-up-step-btn"
              class:selected={i === buildUpActiveSlot}
              data-step-slot={i}
              data-tooltip="Step {i + 1}: pattern {patternIndex + 1}/64"
              aria-label="Step {i + 1}: pattern {patternIndex + 1}/64"
              onclick={() => handleStepSlotClick(i)}
            >
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html serializePatternSVG(ditherPatterns[patternIndex], ditherOffsetX, ditherOffsetY)}
            </button>
          {/each}
        {/if}
      </div>
      <button
        type="button"
        id="dither-ctrl-build-up-reset"
        class="btn build-up-reset-btn"
        data-tooltip="Reset build-up density"
      >
        Reset Density Map
      </button>
    </div>
    <div class="dither-grid">
      {#each ditherPatterns as pattern, i}
        <button
          type="button"
          class="dither-grid-btn"
          class:selected={i === activePatternIndex}
          data-pattern-index={i}
          data-tooltip={i === 31 ? '32/64: Checkerboard' : `${i + 1}/64`}
          aria-label={i === 31 ? '32/64: Checkerboard' : `${i + 1}/64`}
          use:appendPatternSVG={pattern}
        ></button>
      {/each}
    </div>
  </div>
</div>
