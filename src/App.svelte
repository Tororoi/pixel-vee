<script>
  /**
   * @component
   * Root application component. Renders the NavBar outside the portal
   * and portals all panels and dialogs into the `.page` element, which
   * lives in the DOM alongside the canvas stack. Portaling into `.page`
   * gives every panel the same positioning parent as the canvases, so
   * fixed/absolute coordinates resolve consistently. The portaled
   * subtree is withheld via `{#if pageEl}` until the target element is
   * confirmed to exist in the DOM.
   */
  import { onMount } from 'svelte'
  import { portal } from './utils/portal.js'
  import NavBar from './ui/components/NavBar.svelte'
  import Toolbox from './ui/components/Toolbox.svelte'
  import Sidebar from './ui/components/Sidebar.svelte'
  import SettingsDialog from './ui/components/dialogs/SettingsDialog.svelte'
  import CanvasSizeDialog from './ui/components/dialogs/CanvasSizeDialog.svelte'
  import SaveDialog from './ui/components/dialogs/SaveDialog.svelte'
  import ExportDialog from './ui/components/dialogs/ExportDialog.svelte'
  import VectorTransformDialog from './ui/components/dialogs/VectorTransformDialog.svelte'
  import ColorPickerDialog from './ui/components/dialogs/ColorPickerDialog.svelte'
  import DitherPickerDialog from './ui/components/dialogs/DitherPickerDialog.svelte'
  import StampEditorDialog from './ui/components/dialogs/StampEditorDialog.svelte'
  import CanvasArea from './ui/components/CanvasArea.svelte'
  import KeyboardShortcuts from './ui/components/KeyboardShortcuts.svelte'

  // .page is outside #root — portal all panels/dialogs into it so they share
  // the same positioning parent as the canvas stack.
  let pageEl = $state(null)

  /**
   * Resolves the portal target element after mount. `.page` cannot be
   * queried during component initialization because the host DOM is not
   * available before mount. Setting `pageEl` here unblocks the `{#if}`
   * gate in the template, causing all panels and dialogs to render into
   * the target on the first post-mount tick.
   */
  onMount(() => {
    pageEl = document.querySelector('.page')
  })
</script>

<NavBar />
<KeyboardShortcuts />

{#if pageEl}
  <!-- CanvasArea portals .canvas-container directly into .page (no wrapper) so it is a
       first-class flex child of .page and height:100% resolves correctly. -->
  <CanvasArea {pageEl} />
  <!-- display:contents removes the wrapper from layout while portaling panels into .page -->
  <div use:portal={pageEl} style="display:contents">
    <Toolbox />
    <Sidebar />
    <SettingsDialog />
    <CanvasSizeDialog />
    <SaveDialog />
    <ExportDialog />
    <VectorTransformDialog />
    <ColorPickerDialog />
    <DitherPickerDialog />
    <StampEditorDialog />
  </div>
{/if}
