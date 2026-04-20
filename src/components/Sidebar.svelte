<script>
  import DialogBox from './DialogBox.svelte'
  import BrushPanel from './panels/BrushPanel.svelte'
  import PalettePanel from './panels/PalettePanel.svelte'
  import LayersPanel from './panels/LayersPanel.svelte'
  import VectorsPanel from './panels/VectorsPanel.svelte'
</script>

<DialogBox title="Tools" class="sidebar h-drag free locked" collapsible locked>
  <BrushPanel />
  <PalettePanel />
  <LayersPanel />
  <VectorsPanel />
</DialogBox>
