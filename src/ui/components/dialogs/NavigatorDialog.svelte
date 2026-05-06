<script>
  /**
   * @component
   * Dialog panel for the Navigator feature. Lets the user record
   * sequences of canvas drawing actions into named scripts, then replay
   * them either instantly via the internal API (Play Fast) or with
   * simulated per-frame timing and a speed control (Play Realtime).
   * Scripts can be saved to and loaded from JSON files. A dedicated
   * navigator canvas is swapped in for recording and playback so the
   * real canvas is never mutated until the user decides to keep a result.
   */
  import { globalState } from '../../../context/state.js'
  import { canvas } from '../../../context/canvas.js'
  import DialogBox from '../DialogBox.svelte'
  import { createScript, loadScript, saveScript } from '../../../navigator/script.js'
  import { startRecording, stopRecording } from '../../../navigator/recorder.js'
  import { playApiMode } from '../../../navigator/player-api.js'
  import { playEventMode, stopEventPlay } from '../../../navigator/player-event.js'
  import {
    activateNavigatorCanvas,
    restoreRealCanvas,
  } from '../../../navigator/canvasSwap.js'
  import { navigatorState } from '../../../navigator/navigatorState.js'

  const isOpen = $derived(globalState.ui.navigatorOpen)

  let recording = $state(false)
  let playing = $state(false)
  let scripts = $state([])
  let selectedIndex = $state(null)
  let recordingName = $state('untitled')
  // Speed multiplier for event-mode playback. stepMs = 32 / multiplier.
  let speedMultiplier = $state(1)

  const selectedScript = $derived(
    selectedIndex !== null ? scripts[selectedIndex] : null,
  )
  const status = $derived(
    recording ? 'Recording...' : playing ? 'Playing...' : 'Idle',
  )

  $effect(() => {
    // Auto-activate the navigator canvas the moment the dialog opens so
    // the overlay immediately shows canvas content rather than blank
    // space. The layer guard ensures the navigator canvas has been
    // initialised; the active guard prevents a redundant swap if
    // recording or a previous playback already activated it.
    // navigatorState is a plain object so this effect only re-runs when
    // isOpen changes — no reactive cycle risk.
    if (isOpen && navigatorState.layer && !navigatorState.active) {
      activateNavigatorCanvas()
    }
  })

  /**
   * Tears down any active session and closes the dialog. Recording is
   * stopped synchronously; event-mode playback must be awaited because
   * stopEventPlay resolves a promise the play loop is waiting on. The
   * real canvas is always restored last so the navigator overlay never
   * lingers after the dialog disappears.
   */
  async function handleClose() {
    if (recording) handleStopRecording()
    if (playing) await handleStopPlay()
    // Restore in case the nav canvas is still active (e.g. showing
    // a playback result).
    restoreRealCanvas()
    globalState.ui.navigatorOpen = false
  }

  /**
   * Begins a new recording session. The real canvas is restored first so
   * recording always starts from a clean slate regardless of whether the
   * navigator canvas is already showing a previous result. Script
   * dimensions are captured at record time so playback can warn if the
   * canvas has been resized since.
   */
  function handleRecord() {
    // Restore any current session (auto-open activation or previous result)
    // so recording always starts on a fresh canvas.
    restoreRealCanvas()
    const script = createScript(
      recordingName || 'untitled',
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height,
    )
    activateNavigatorCanvas()
    startRecording(script)
    recording = true
  }

  /**
   * Emits a console warning when the script's recorded canvas dimensions
   * differ from the current canvas size. Coordinates in the script are
   * absolute pixel values, so a size mismatch means pointer events land
   * in the wrong positions during playback. The guard on
   * script.canvasWidth handles scripts recorded before dimension
   * tracking was added — those play silently with no warning.
   * @param {object} script - Script object whose dimensions to check.
   */
  function warnDimensionMismatch(script) {
    if (!script.canvasWidth) return
    const w = canvas.offScreenCVS.width
    const h = canvas.offScreenCVS.height
    if (script.canvasWidth !== w || script.canvasHeight !== h) {
      console.warn(
        `Navigator: script was recorded at ${script.canvasWidth}×${script.canvasHeight},` +
        ` current canvas is ${w}×${h} — coordinates may be incorrect`,
      )
    }
  }

  /**
   * Ends the current recording and appends the captured script to the
   * in-memory list only when it contains at least one action. Empty
   * scripts (e.g. accidental Record→Stop with no drawing) are discarded.
   * The new script is auto-selected so the user can immediately play or
   * save it without an extra click.
   */
  function handleStopRecording() {
    const script = stopRecording()
    recording = false
    if (script?.actions.length > 0) {
      scripts = [...scripts, script]
      selectedIndex = scripts.length - 1
    }
  }

  /**
   * Reads a user-selected JSON file and appends the parsed script to the
   * in-memory list. The file input value is reset to null after reading
   * so the same file can be re-selected in a later load without the
   * browser suppressing the change event. Parse errors are silently
   * swallowed because invalid files are not actionable from the UI.
   * @param {Event} e - The file input change event.
   */
  function handleLoadScript(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const script = loadScript(ev.target.result)
        scripts = [...scripts, script]
        selectedIndex = scripts.length - 1
      } catch {
        // Invalid script file — silently ignore
      }
    }
    reader.readAsText(file)
    // Reset so the same file can be re-loaded without the browser
    // suppressing the change event on a repeated selection.
    e.target.value = null
  }

  /**
   * Serialises and downloads the currently selected script as a JSON
   * file. The guard prevents a no-op call when no script is selected,
   * mirroring the button's own disabled state.
   */
  function handleSave() {
    if (selectedScript) saveScript(selectedScript)
  }

  /**
   * Removes the selected script from the in-memory list and adjusts the
   * selection. Math.min clamps the index to the new last position rather
   * than leaving a stale out-of-bounds value when the deleted entry was
   * at the end of the list.
   */
  function handleDelete() {
    if (selectedIndex === null) return
    scripts = scripts.filter((_, i) => i !== selectedIndex)
    selectedIndex =
      scripts.length > 0 ? Math.min(selectedIndex, scripts.length - 1) : null
  }

  /**
   * Replays the selected script in API mode, which invokes drawing
   * commands directly without inter-frame delays. The real canvas is
   * restored first so the navigator canvas begins blank. The result is
   * intentionally left visible after completion so the user can inspect
   * the output before deciding whether to keep it.
   */
  function handlePlayApi() {
    if (!selectedScript) return
    warnDimensionMismatch(selectedScript)
    // Restore any current session so playback always starts on a fresh canvas.
    restoreRealCanvas()
    playing = true
    activateNavigatorCanvas()
    playApiMode(selectedScript)
    // Do NOT restore after completion — leave the result visible on
    // the nav canvas.
    playing = false
  }

  /**
   * Replays the selected script in event mode, dispatching synthetic
   * pointer events with real inter-frame delays. stepMs is derived from
   * speedMultiplier so a 1× multiplier produces ~32 ms steps (one frame
   * at ~30 fps) and 4× produces ~8 ms steps. The result is intentionally
   * left visible on the navigator canvas after completion.
   */
  async function handlePlayEvent() {
    if (!selectedScript) return
    warnDimensionMismatch(selectedScript)
    // Restore any current session so playback always starts on a fresh canvas.
    restoreRealCanvas()
    playing = true
    activateNavigatorCanvas()
    await playEventMode(selectedScript, { stepMs: Math.round(32 / speedMultiplier) })
    // Do NOT restore after completion — leave the result visible on
    // the nav canvas.
    playing = false
  }

  /**
   * Interrupts an in-progress event-mode playback and restores the real
   * canvas. Unlike normal playback completion, which leaves the result
   * visible, an explicit stop always restores because a partial result is
   * not meaningful.
   */
  async function handleStopPlay() {
    await stopEventPlay()
    restoreRealCanvas()
    playing = false
  }
</script>

<DialogBox
  title="Navigator"
  class="navigator-container draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
  <div class="navigator-interface">
    <div class="navigator-status">
      Status: <span
        class="status-text"
        class:status-recording={recording}
        class:status-playing={playing}>{status}</span
      >
    </div>

    <div class="navigator-record-row">
      <input
        type="text"
        id="nav-script-name"
        class="navigator-name-input"
        bind:value={recordingName}
        disabled={recording || playing}
        placeholder="untitled"
        aria-label="Script name"
      />
      {#if recording}
        <button
          type="button"
          class="btn navigator-btn stop-btn"
          onclick={handleStopRecording}
        >
          Stop
        </button>
      {:else}
        <button
          type="button"
          class="btn navigator-btn record-btn"
          disabled={playing}
          onclick={handleRecord}
        >
          Record
        </button>
      {/if}
      <label
        class="btn navigator-btn load-btn"
        class:disabled={recording || playing}
        for="nav-load-input"
        aria-label="Load script from file"
      >
        Load
        <input
          type="file"
          id="nav-load-input"
          accept=".json"
          onchange={handleLoadScript}
          disabled={recording || playing}
        />
      </label>
    </div>

    <ul class="navigator-script-list" role="listbox" aria-label="Scripts">
      {#each scripts as script, i}
        <li
          class="navigator-script-item"
          class:selected={selectedIndex === i}
          role="option"
          aria-selected={selectedIndex === i}
          onclick={() => {
            selectedIndex = i
          }}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') selectedIndex = i
          }}
          tabindex="0"
        >
          <span class="script-name">{script.name}</span>
          <span class="script-count">({script.actions.length})</span>
        </li>
      {:else}
        <li class="navigator-script-empty">No scripts loaded</li>
      {/each}
    </ul>

    <div class="navigator-speed-row">
      <label for="nav-speed" class="navigator-speed-label">Speed</label>
      <input
        type="range"
        id="nav-speed"
        class="slider navigator-speed-slider"
        min="0.25"
        max="4"
        step="0.25"
        bind:value={speedMultiplier}
        disabled={recording || playing}
      />
      <span class="navigator-speed-value">{speedMultiplier}×</span>
    </div>

    <div class="navigator-play-row">
      <button
        type="button"
        class="btn navigator-btn"
        disabled={!selectedScript || recording || playing}
        onclick={handlePlayApi}
      >
        Play Fast
      </button>
      {#if playing}
        <button
          type="button"
          class="btn navigator-btn stop-btn"
          onclick={handleStopPlay}
        >
          Stop
        </button>
      {:else}
        <button
          type="button"
          class="btn navigator-btn"
          disabled={!selectedScript || recording}
          onclick={handlePlayEvent}
        >
          Play Realtime
        </button>
      {/if}
    </div>

    <div class="navigator-file-row">
      <button
        type="button"
        class="btn navigator-btn"
        disabled={!selectedScript}
        onclick={handleSave}
      >
        Save
      </button>
      <button
        type="button"
        class="btn navigator-btn"
        disabled={selectedIndex === null}
        onclick={handleDelete}
      >
        Delete
      </button>
    </div>
  </div>
</DialogBox>
