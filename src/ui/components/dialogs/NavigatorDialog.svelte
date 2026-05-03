<script>
  import { globalState } from '../../../context/state.js'
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

  // Activate the navigator canvas as soon as the dialog opens so the overlay
  // immediately shows the canvas background rather than a blank state.
  // navigatorState is a plain object so this effect only fires when isOpen
  // changes — there is no reactive cycle risk.
  $effect(() => {
    if (isOpen && navigatorState.layer && !navigatorState.active) {
      activateNavigatorCanvas()
    }
  })

  function handleClose() {
    if (recording) handleStopRecording()
    if (playing) handleStopPlay()
    // Restore in case the nav canvas is still active (e.g. showing a playback result).
    restoreRealCanvas()
    globalState.ui.navigatorOpen = false
  }

  function handleRecord() {
    // Restore any current session (auto-open activation or previous result)
    // so recording always starts on a fresh canvas.
    restoreRealCanvas()
    const script = createScript(recordingName || 'untitled')
    activateNavigatorCanvas()
    startRecording(script)
    recording = true
  }

  function handleStopRecording() {
    const script = stopRecording()
    recording = false
    if (script?.actions.length > 0) {
      scripts = [...scripts, script]
      selectedIndex = scripts.length - 1
    }
  }

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
    e.target.value = null
  }

  function handleSave() {
    if (selectedScript) saveScript(selectedScript)
  }

  function handleDelete() {
    if (selectedIndex === null) return
    scripts = scripts.filter((_, i) => i !== selectedIndex)
    selectedIndex =
      scripts.length > 0 ? Math.min(selectedIndex, scripts.length - 1) : null
  }

  function handlePlayApi() {
    if (!selectedScript) return
    // Restore any current session so playback always starts on a fresh canvas.
    restoreRealCanvas()
    playing = true
    activateNavigatorCanvas()
    playApiMode(selectedScript)
    // Do NOT restore after completion — leave the result visible on the nav canvas.
    playing = false
  }

  async function handlePlayEvent() {
    if (!selectedScript) return
    // Restore any current session so playback always starts on a fresh canvas.
    restoreRealCanvas()
    playing = true
    activateNavigatorCanvas()
    await playEventMode(selectedScript, { stepMs: Math.round(32 / speedMultiplier) })
    // Do NOT restore after completion — leave the result visible on the nav canvas.
    playing = false
  }

  function handleStopPlay() {
    stopEventPlay()
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
