<script>
  /**
   * @component
   * Displays the most-recently-fired shortcut combo in the upper-left
   * of `.page`, inset past the sidebar. Reads `keyDisplayStore` which
   * is written from `activateShortcut`, so the rendered combo
   * corresponds to a real shortcut firing rather than to raw key state.
   * Each new shortcut bumps `showId`, which re-keys the wrapper and
   * restarts the CSS fade animation defined in scss/components/_key-display.scss.
   */
  import { keyDisplayStore } from '../stores/keyDisplay.svelte.js'
</script>

{#if keyDisplayStore.labels.length > 0}
  {#key keyDisplayStore.showId}
    <div class="key-display">
      {#each keyDisplayStore.labels as label, i (i)}
        {#if i > 0}<span class="separator">+</span>{/if}
        <span class="key">{label}</span>
      {/each}
    </div>
  {/key}
{/if}
