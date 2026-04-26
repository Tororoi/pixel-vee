<script>
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
