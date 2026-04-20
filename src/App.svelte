<script>
  import { onMount } from 'svelte'
  import { portal } from './utils/portal.js'
  import NavBar from './components/NavBar.svelte'
  import Toolbox from './components/Toolbox.svelte'
  import Sidebar from './components/Sidebar.svelte'
  import SettingsDialog from './components/dialogs/SettingsDialog.svelte'
  import CanvasSizeDialog from './components/dialogs/CanvasSizeDialog.svelte'
  import SaveDialog from './components/dialogs/SaveDialog.svelte'
  import ExportDialog from './components/dialogs/ExportDialog.svelte'
  import VectorTransformDialog from './components/dialogs/VectorTransformDialog.svelte'
  import ColorPickerDialog from './components/dialogs/ColorPickerDialog.svelte'
  import DitherPickerDialog from './components/dialogs/DitherPickerDialog.svelte'
  import StampEditorDialog from './components/dialogs/StampEditorDialog.svelte'

  // .page is outside #root — portal all panels/dialogs into it so they share
  // the same positioning parent as the canvas stack.
  let pageEl = $state(null)

  onMount(() => {
    pageEl = document.querySelector('.page')
  })
</script>

<NavBar />

{#if pageEl}
  <!-- display:contents removes the wrapper from layout while portaling children into .page -->
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
