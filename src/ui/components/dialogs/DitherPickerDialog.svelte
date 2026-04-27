<script>
  /**
   * @component
   * Dialog for selecting and configuring dither patterns. Supports
   * pattern selection from a 64-pattern grid, two-color mode, build-up
   * dither (density accumulation across overlapping strokes), and a drag
   * control for setting the pattern's pixel offset. Works in two modes:
   * live-tool mode (mutations go to the active tool and both the reactive
   * proxy and the underlying singleton) and vector-target mode (mutations
   * go to a specific vector, triggering an immediate canvas re-render and
   * an undo-history entry). Pattern and offset SVGs are injected via
   * Svelte use-actions after mount and wired imperatively in `onMount`
   * because they are outside Svelte's reactive template tree.
   */
  import { onMount } from 'svelte'
  import { appState } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../../context/state.js'
  import DialogBox from '../DialogBox.svelte'
  import { dom } from '../../../context/dom.js'
  import {
    brush,
    rebuildBuildUpDensityMap,
    resetBuildUpDensityMap,
    BAYER_STEPS,
  } from '../../../tools/brush.js'
  import { renderCanvas } from '../../../canvas/render.js'
  import {
    applyDitherOffset,
    applyDitherOffsetControl,
    createDitherPatternSVG,
    createDitherOffsetControlSVG,
  } from '../../../utils/ditherPreview.js'
  import { ditherPatterns } from '../../../context/ditherPatterns.js'
  import { swatches } from '../../../context/swatch.js'
  import {
    changeActionVectorDitherPattern,
    changeActionVectorDitherOffset,
  } from '../../../actions/modifyTimeline/modifyTimeline.js'
  import { tools } from '../../../tools/index.js'

  const DITHER_TOOLS = ['brush', 'curve', 'ellipse', 'polygon']

  let ref = $state(null)

  const isOpen = $derived(globalState.ui.ditherPickerOpen)
  const vectorTarget = $derived(appState.ditherVectorTarget)

  const activePatternIndex = $derived(
    vectorTarget?.ditherPatternIndex ??
      globalState.tool.current?.ditherPatternIndex,
  )
  const twoColorActive = $derived(
    !!(vectorTarget
      ? vectorTarget.modes?.twoColor
      : globalState.tool.current?.modes?.twoColor),
  )
  const buildUpActive = $derived(
    !vectorTarget && !!globalState.tool.current?.modes?.buildUpDither,
  )
  const showBuildUpBtn = $derived(
    !vectorTarget && globalState.tool.current?.name === 'brush',
  )
  const buildUpMode = $derived(
    globalState.tool.current?.buildUpMode ?? 'custom',
  )
  const buildUpSteps = $derived([
    ...(globalState.tool.current?.buildUpSteps ?? [15, 31, 47, 63]),
  ])
  const buildUpActiveSlot = $derived(
    globalState.tool.current?.buildUpActiveStepSlot ?? null,
  )
  const ditherOffsetX = $derived(
    (vectorTarget ?? globalState.tool.current)?.ditherOffsetX ?? 0,
  )
  const ditherOffsetY = $derived(
    (vectorTarget ?? globalState.tool.current)?.ditherOffsetY ?? 0,
  )

  // Mirror reactive offset changes into the injected SVG DOM attributes.
  // Drag bypasses this path and calls applyDitherOffset directly for
  // immediate feedback without queuing a Svelte re-render per event.
  // State-driven changes (undo, vector-target switch) need this path
  // because they update reactive state rather than calling applyDitherOffset.
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

  // Re-colour the injected SVGs whenever swatches or two-color mode
  // changes. Because the SVGs are injected via use-actions outside
  // Svelte's template tree, attribute mutation must be done imperatively
  // rather than through reactive bindings in the template.
  $effect(() => {
    if (!ref) return
    const primary = swatches.primary.color.color
    const secondary = swatches.secondary.color.color
    const bgFill = twoColorActive ? secondary : 'none'
    ref
      .querySelectorAll('.dither-bg-rect')
      .forEach((r) => r.setAttribute('fill', bgFill))
    ref
      .querySelectorAll('.dither-on-path')
      .forEach((p) => p.setAttribute('stroke', primary))
  })

  /**
   * Svelte use-action that injects a dither pattern SVG into a grid
   * button. Called once per button at mount; Svelte passes the DOM node
   * automatically. The SVG is generated at mount time rather than stored
   * statically so that the swatch $effect can later update the embedded
   * color attributes in-place without re-generating the whole grid.
   * @param {HTMLElement} node - The element the action is attached to.
   * @param {object} pattern - Dither pattern descriptor.
   */
  function appendPatternSVG(node, pattern) {
    node.appendChild(createDitherPatternSVG(pattern))
  }

  /**
   * Svelte use-action that injects the dither offset drag-control SVG.
   * Separated from appendPatternSVG because the control is a singleton
   * UI element, not a repeated grid item, and its pointer-event handling
   * is registered separately in onMount rather than inline on the node.
   * @param {HTMLElement} node - The element the action is attached to.
   */
  function appendOffsetControlSVG(node) {
    node.appendChild(createDitherOffsetControlSVG())
  }

  /**
   * Closes the dither picker dialog and clears any pending vector target.
   * The vector target is cleared on close rather than on open so that
   * derived state (pattern index, offsets) still resolves correctly
   * during the same frame the dialog hides itself.
   */
  function handleClose() {
    appState.ditherVectorTarget = null
    globalState.ui.ditherPickerOpen = false
  }

  /**
   * Toggles two-color dither mode for the active context — either a
   * vector target or the live tool. When a vector target is present, only
   * that vector is mutated and the canvas is re-rendered immediately.
   * For live tools, both the reactive proxy (globalState.tool.current)
   * and the underlying tool object (tools[toolName]) are updated so the
   * change survives tool-switch cycles. The guard against non-dither tools
   * prevents accidental state mutation on tools that ignore this flag.
   */
  function handleTwoColorToggle() {
    const vt = appState.ditherVectorTarget
    if (vt) {
      if (!vt.modes) vt.modes = {}
      vt.modes.twoColor = !vt.modes.twoColor
      renderCanvas(vt.layer, true)
      return
    }
    if (!DITHER_TOOLS.includes(globalState.tool.current?.name)) return
    const newTwoColor = !globalState.tool.current.modes.twoColor
    globalState.tool.current.modes.twoColor = newTwoColor
    const toolName = globalState.tool.selectedName
    // Mirror to the underlying tool so the toggle survives a tool switch.
    if (tools[toolName]?.modes) tools[toolName].modes.twoColor = newTwoColor
  }

  /**
   * Toggles build-up dither mode on the brush tool. Build-up dither
   * accumulates density across overlapping strokes, so enabling it
   * triggers an immediate density-map rebuild from existing stroke data.
   * Disabling clears both the map and the active slot so the next enable
   * always starts from a blank state rather than resuming a partial
   * accumulation. This is brush-only; the guard prevents the toggle from
   * having any effect while a different tool is selected.
   */
  function handleBuildUpToggle() {
    if (globalState.tool.current?.name !== 'brush') return
    const newBuildUp = !globalState.tool.current.modes.buildUpDither
    globalState.tool.current.modes.buildUpDither = newBuildUp
    brush.modes.buildUpDither = newBuildUp
    if (globalState.tool.current.modes.buildUpDither) {
      rebuildBuildUpDensityMap()
    } else {
      // Null out the map and slot so re-enabling starts clean.
      brush._buildUpDensityMap = null
      globalState.tool.current.buildUpActiveStepSlot = null
      brush.buildUpActiveStepSlot = null
    }
  }

  /**
   * Resets the build-up density accumulation map to zero. The brush-name
   * guard prevents this from corrupting state when called while a non-
   * brush tool is active, since resetBuildUpDensityMap writes directly to
   * the brush singleton regardless of which tool is currently selected.
   */
  function handleBuildUpReset() {
    if (globalState.tool.current?.name !== 'brush') return
    resetBuildUpDensityMap()
  }

  /**
   * Switches the build-up mode between a named Bayer preset and the
   * user's custom step list. Leaving custom mode stashes the current
   * steps to brush._customBuildUpSteps so they are restored if the user
   * switches back. Entering custom mode reloads that stash. Bayer presets
   * replace the step list from BAYER_STEPS; an unrecognized mode falls
   * back to the existing steps to avoid blanking the slot array. Both the
   * reactive proxy and the brush singleton are kept in sync to prevent
   * divergence across tool-switch cycles.
   * @param {string} mode - One of 'custom' | '2x2' | '4x4' | '8x8'.
   */
  function handleBuildUpModeClick(mode) {
    if (globalState.tool.current?.name !== 'brush') return
    if (
      globalState.tool.current.buildUpMode === 'custom' &&
      mode !== 'custom'
    ) {
      // Stash custom steps before overwriting with a Bayer preset.
      brush._customBuildUpSteps = [...globalState.tool.current.buildUpSteps]
    }
    globalState.tool.current.buildUpMode = mode
    brush.buildUpMode = mode
    if (mode === 'custom') {
      const steps = [...brush._customBuildUpSteps]
      globalState.tool.current.buildUpSteps = steps
      brush.buildUpSteps = steps
    } else {
      const steps = BAYER_STEPS[mode]
        ? [...BAYER_STEPS[mode]]
        : globalState.tool.current.buildUpSteps
      globalState.tool.current.buildUpSteps = steps
      brush.buildUpSteps = steps
    }
  }

  /**
   * Serializes a dither pattern into an HTML-safe SVG string for use in
   * build-up step-slot buttons via {@html}. A fresh element is constructed
   * on each render so offset and color attributes are always current;
   * caching the string would require manual invalidation on every swatch
   * or offset change.
   * @param {object} pattern - Dither pattern descriptor.
   * @param {number} [ox=0] - Horizontal pattern offset in pixels.
   * @param {number} [oy=0] - Vertical pattern offset in pixels.
   * @returns {string} Serialized SVG markup.
   */
  function serializePatternSVG(pattern, ox = 0, oy = 0) {
    return new XMLSerializer().serializeToString(
      createDitherPatternSVG(pattern, ox, oy),
    )
  }

  /**
   * Selects or deselects a build-up step slot for pattern assignment.
   * Clicking the active slot a second time deselects it (sets slot to
   * null) so the user can dismiss selection without choosing a new
   * pattern. Both the reactive proxy and the brush singleton track the
   * slot so the dither grid's click handler can write the correct slot
   * index without re-reading globalState.
   * @param {number} slotIndex - Zero-based index of the step slot.
   */
  function handleStepSlotClick(slotIndex) {
    if (!globalState.tool.current) return
    const newSlot =
      globalState.tool.current.buildUpActiveStepSlot === slotIndex
        ? null
        : slotIndex
    globalState.tool.current.buildUpActiveStepSlot = newSlot
    brush.buildUpActiveStepSlot = newSlot
  }

  /**
   * Registers the dialog container with the global dom registry and
   * attaches the two primary imperative event listeners: pattern-grid
   * click handling and offset-control pointer-drag handling. These are
   * wired imperatively rather than declaratively in the template because
   * the dither grid and offset control SVGs are injected by Svelte use-
   * actions after mount and are not part of Svelte's reactive tree, so
   * inline event directives would not reach them.
   */
  onMount(() => {
    if (!ref) return
    const el = ref
    // Expose this node so other components can call applyDitherOffset
    // on the picker container directly via the dom registry.
    dom.ditherPickerContainer = el

    // Dither grid — pattern selection
    el.querySelector('.dither-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.dither-grid-btn')
      if (!btn) return
      const patternIndex = parseInt(btn.dataset.patternIndex)
      const vt = appState.ditherVectorTarget
      if (vt) {
        const oldPatternIndex = vt.ditherPatternIndex
        vt.ditherPatternIndex = patternIndex
        renderCanvas(vt.layer, true)
        if (oldPatternIndex !== patternIndex) {
          changeActionVectorDitherPattern(vt, oldPatternIndex, patternIndex)
          globalState.clearRedoStack()
        }
        return
      }
      if (!DITHER_TOOLS.includes(globalState.tool.current?.name)) return
      const toolName = globalState.tool.selectedName
      const underlying = tools[toolName]
      if (globalState.tool.current.buildUpActiveStepSlot != null) {
        // A step slot is active: assign the pattern to that slot instead
        // of changing the active pattern, then deselect the slot.
        const slot = globalState.tool.current.buildUpActiveStepSlot
        globalState.tool.current.buildUpSteps[slot] = patternIndex
        globalState.tool.current.buildUpActiveStepSlot = null
        if (underlying) {
          underlying.buildUpSteps[slot] = patternIndex
          underlying.buildUpActiveStepSlot = null
        }
      } else {
        globalState.tool.current.ditherPatternIndex = patternIndex
        if (underlying) underlying.ditherPatternIndex = patternIndex
      }
    })

    // Dither offset drag
    el.addEventListener('pointerdown', (e) => {
      const control = e.target.closest('.dither-offset-control')
      if (!control) return
      const vt = appState.ditherVectorTarget
      if (!vt && !DITHER_TOOLS.includes(globalState.tool.current?.name)) return
      // Pointer capture keeps move/up events on this element even when
      // the cursor leaves the control during a fast drag.
      control.setPointerCapture(e.pointerId)
      const startX = e.clientX
      const startY = e.clientY

      if (vt) {
        // The stored offset is relative to the layer position at record
        // time. Account for any subsequent layer movement so dragging
        // from the current visual position feels natural.
        const currentLayerX = vt.layer?.x ?? 0
        const currentLayerY = vt.layer?.y ?? 0
        const recordedLayerX = vt.recordedLayerX ?? currentLayerX
        const recordedLayerY = vt.recordedLayerY ?? currentLayerY
        const startEffectiveX =
          ((((vt.ditherOffsetX ?? 0) + recordedLayerX - currentLayerX) % 8) +
            8) %
          8
        const startEffectiveY =
          ((((vt.ditherOffsetY ?? 0) + recordedLayerY - currentLayerY) % 8) +
            8) %
          8
        const fromOffset = {
          x: vt.ditherOffsetX ?? 0,
          y: vt.ditherOffsetY ?? 0,
        }
        const onMove = (ev) => {
          const newEffectiveX =
            (((startEffectiveX - Math.round((ev.clientX - startX) / 4)) % 8) +
              8) %
            8
          const newEffectiveY =
            (((startEffectiveY - Math.round((ev.clientY - startY) / 4)) % 8) +
              8) %
            8
          // Convert canvas-space effective offset back to layer-relative
          // stored offset before writing to the vector target.
          vt.ditherOffsetX =
            (((newEffectiveX - recordedLayerX + currentLayerX) % 8) + 8) % 8
          vt.ditherOffsetY =
            (((newEffectiveY - recordedLayerY + currentLayerY) % 8) + 8) % 8
          renderCanvas(vt.layer, true)
          applyDitherOffset(el, vt.ditherOffsetX, vt.ditherOffsetY)
          const vectorPreview = document.querySelector('.vector-dither-preview')
          if (vectorPreview)
            applyDitherOffset(vectorPreview, vt.ditherOffsetX, vt.ditherOffsetY)
          applyDitherOffsetControl(
            control.parentElement,
            vt.ditherOffsetX,
            vt.ditherOffsetY,
          )
        }
        control.addEventListener('pointermove', onMove)
        control.addEventListener(
          'pointerup',
          () => {
            control.removeEventListener('pointermove', onMove)
            const toOffset = {
              x: vt.ditherOffsetX ?? 0,
              y: vt.ditherOffsetY ?? 0,
            }
            if (fromOffset.x !== toOffset.x || fromOffset.y !== toOffset.y) {
              changeActionVectorDitherOffset(vt, fromOffset, toOffset)
              globalState.clearRedoStack()
            }
          },
          { once: true },
        )
      } else {
        const target = globalState.tool.current
        const underlying = tools[globalState.tool.selectedName]
        const startOffsetX = target.ditherOffsetX ?? 0
        const startOffsetY = target.ditherOffsetY ?? 0
        let lastOx = startOffsetX
        let lastOy = startOffsetY
        const onMove = (ev) => {
          const ox =
            (((startOffsetX - Math.round((ev.clientX - startX) / 4)) % 8) + 8) %
            8
          const oy =
            (((startOffsetY - Math.round((ev.clientY - startY) / 4)) % 8) + 8) %
            8
          lastOx = ox
          lastOy = oy
          // Write only to underlying during drag — avoids triggering
          // Svelte re-renders on every pointermove event.
          if (underlying) {
            underlying.ditherOffsetX = ox
            underlying.ditherOffsetY = oy
          }
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
            // Sync final value to proxy once on release
            target.ditherOffsetX = lastOx
            target.ditherOffsetY = lastOy
            if (underlying) {
              underlying.ditherOffsetX = lastOx
              underlying.ditherOffsetY = lastOy
            }
          },
          { once: true },
        )
      }
    })
  })
</script>

<DialogBox
  bind:ref
  title="Dither Pattern"
  class="dither-picker-container draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  collapsible
  onclose={handleClose}
>
  <div class="dither-controls">
    <button
      type="button"
      class="dither-toggle twoColor"
      id="dither-ctrl-two-color"
      aria-label="Two-Color"
      data-tooltip="Two-Color"
      class:selected={twoColorActive}
      onclick={handleTwoColorToggle}
    ></button>
    <button
      type="button"
      class="dither-toggle buildUpDither"
      id="dither-ctrl-build-up"
      aria-label="Build-Up Dither"
      data-tooltip="Build-Up Dither&#10;&#10;Automatically increase dither density on overlapping strokes"
      class:selected={buildUpActive}
      style:display={showBuildUpBtn ? '' : 'none'}
      onclick={handleBuildUpToggle}
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
        data-tooltip="Custom build-up steps"
        onclick={() => handleBuildUpModeClick('custom')}>Custom</button
      >
      <button
        type="button"
        class="build-up-mode-btn"
        class:selected={buildUpMode === '2x2'}
        data-tooltip="4 steps from a 2x2 Bayer Matrix"
        onclick={() => handleBuildUpModeClick('2x2')}>2×2</button
      >
      <button
        type="button"
        class="build-up-mode-btn"
        class:selected={buildUpMode === '4x4'}
        data-tooltip="16 steps from a 4x4 Bayer Matrix"
        onclick={() => handleBuildUpModeClick('4x4')}>4×4</button
      >
      <button
        type="button"
        class="build-up-mode-btn"
        class:selected={buildUpMode === '8x8'}
        data-tooltip="64 steps from an 8x8 Bayer Matrix"
        onclick={() => handleBuildUpModeClick('8x8')}>8×8</button
      >
    </div>
    <div class="build-up-step-slots">
      {#if buildUpMode === 'custom'}
        {#each buildUpSteps as patternIndex, i (i)}
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
            {@html serializePatternSVG(
              ditherPatterns[patternIndex],
              ditherOffsetX,
              ditherOffsetY,
            )}
          </button>
        {/each}
      {/if}
    </div>
    <button
      type="button"
      id="dither-ctrl-build-up-reset"
      class="btn build-up-reset-btn"
      data-tooltip="Reset build-up density"
      onclick={handleBuildUpReset}
    >
      Reset Density Map
    </button>
  </div>
  <div class="dither-grid">
    {#each ditherPatterns as pattern, i (i)}
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
</DialogBox>
