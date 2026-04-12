# Pixel Vee — UI Component Map

A complete inventory of every UI component: what it is, where it lives, what state it reads, and what it does. Use this as a reference when redesigning the UI or migrating to React.

> **Note on Canvas Overlays:** Components in the last section (`src/GUI/`) are canvas-rendered tool-feedback overlays. They do not benefit from a React migration and should remain as vanilla JS.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────┐
│  Navigation Bar (always visible, top)                   │
│  [Logo] [File▾] [Edit▾]    [Tool Options]  [⚙ Settings] │
└─────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────┬───────────────┐
│ Toolbox  │  Canvas Area                 │  Sidebar      │
│(draggable│  [bg] [layers] [cursor]      │  ┌──────────┐ │
│ vertical │  [selection] [resize]        │  │  Brush   │ │
│ panel)   │  [vector-gui]                │  ├──────────┤ │
│          │                              │  │ Palette  │ │
│          │                              │  ├──────────┤ │
│          │                              │  │  Layers  │ │
│          │                              │  ├──────────┤ │
│          │                              │  │ Vectors  │ │
│          │                              │  └──────────┘ │
└──────────┴──────────────────────────────┴───────────────┘

Floating dialogs (free-positioned, draggable, shown on demand):
  Settings | Dither Picker | Color Picker | Canvas Size
  Save Options | Export | Stamp Editor | Vector Transform UI
  Layer Settings (popout) | Vector Settings (popout)
```

---

## 1. Navigation Bar

**Container:** `#options.nav` (static HTML)
**DOM ref:** `dom.navBar`, `dom.topMenu`
**Always visible.**

### 1a. Logo / GitHub Link

- **Renders in:** `.nav .title`
- **Visual:** App icon linking to GitHub repo
- **Triggers:** Opens GitHub in new tab (standard `<a>` link)
- **Reads:** nothing

### 1b. File Menu

- **Renders in:** `#file-submenu`
- **DOM refs:** `dom.fileSubMenu`
- **Visual:** Hover-open dropdown with 4 items

| Item | DOM ref | Shortcut | Action |
|------|---------|----------|--------|
| Open | `dom.openSaveBtn` (`<input type="file" accept=".pxv">`) | — | Opens `.pxv` file picker; loads saved drawing |
| Save As... | `dom.saveBtn` | Cmd+S | Opens Save Options dialog |
| Import | `dom.importBtn` (`<input type="file" accept="image/*">`) | — | Imports image into current layer |
| Export | `dom.exportBtn` | — | Opens Export dialog |

- **Disabled when:** Import is disabled during active paste (`disableActionsForPaste`)

### 1c. Edit Menu

- **Renders in:** `#edit-submenu`
- **DOM refs:** `dom.editSubMenu`
- **Visual:** Hover-open dropdown with 9 items

| Item | DOM ref | Shortcut | Enabled when |
|------|---------|----------|--------------|
| Resize Canvas... | `dom.canvasSizeBtn` | — | No active paste |
| Select All | `dom.selectAllBtn` | Cmd+A | No active paste |
| Deselect | `dom.deselectBtn` | Cmd+D | Selection active |
| Cut | `dom.cutBtn` | Cmd+X | Selection active, no paste |
| Copy | `dom.copyBtn` | Cmd+C | Selection active, no paste |
| Paste | `dom.pasteBtn` | Cmd+V | Clipboard has content, no active paste |
| Clear | `dom.deleteBtn` | Backspace | Selection active, no paste |
| Flip Horizontal | `dom.flipHorizontalBtn` | Cmd+F | Active paste OR vector selection |
| Flip Vertical | `dom.flipVerticalBtn` | Cmd+Shift+F | Active paste OR vector selection |
| Rotate Right | `dom.rotateBtn` | Cmd+R | Active paste OR vector selection |

- **State read:** `state.clipboard`, `state.vector.currentIndex`, `state.vector.selectedIndices`, `canvas.pastedLayer`
- **Disable logic:** `src/DOM/disableDomElements.js`

### 1d. Tool Options Bar

- **Renders in:** `div.tool-options` (inside `.nav-items`)
- **DOM ref:** `dom.toolOptions`
- **Visual:** Row of toggle buttons appearing in the nav bar
- **Renders via:** `renderToolOptionsToDOM()` in `src/DOM/renderBrush.js`
- **Reads:** `state.tool.current.name`, `state.tool.current.options`
- **Visible when:** Active tool is one of: `curve`, `ellipse`, `polygon`, `select`
- **Content:** Per-tool option toggles (e.g., close path, fill shape)

### 1e. Settings Button

- **Renders in:** `.nav-items .settings`
- **DOM ref:** `dom.settingsBtn`
- **Visual:** Gear icon button
- **Triggers:** Shows/hides Settings dialog

---

## 2. Canvas Area

**Container:** `.canvas-container > .bg-space`
**Static HTML.** Multiple stacked `<canvas>` elements.

### 2a. Background Canvas

- **Element:** `canvas.bg-canvas` (`dom.backgroundCVS` in canvas.js)
- **Purpose:** Checkerboard transparency background + pixel grid overlay
- **Reads:** `canvas.zoom`, grid settings

### 2b. Raster Layer Canvases

- **Container:** `div.canvas-layers` (`dom.canvasLayers`)
- **Purpose:** Each raster layer gets its own `<canvas>` inserted here dynamically
- **Reads:** `canvas.layers` — each `layer.onscreenCvs` is appended/removed

### 2c. Cursor Canvas *(GUI overlay — stays vanilla JS)*

- **Element:** `canvas#cursor-canvas`
- **Purpose:** Brush shape/color preview under the pointer
- **Reads:** `state.tool.current.brushSize`, `swatches.primary.color`, cursor position

### 2d. Selection GUI Canvas *(GUI overlay — stays vanilla JS)*

- **Element:** `canvas#selection-gui-canvas`
- **Purpose:** Animated marching-ants selection border + selection bounding box handles
- **Reads:** `state.selection.maskSet`, `state.selection.boundaryBox`

### 2e. Resize Overlay Canvas *(GUI overlay — stays vanilla JS)*

- **Element:** `canvas#resize-overlay-canvas`
- **Purpose:** Resize handle overlay during canvas resize interaction
- **Reads:** Canvas dimensions, pointer position

### 2f. Vector GUI Canvas *(GUI overlay — stays vanilla JS)*

- **Element:** `canvas#vector-gui-canvas`
- **Purpose:** Bezier control points, anchor handles, and path previews for vector tools
- **Reads:** `state.vector`, `canvas.zoom`, pointer position

---

## 3. Sidebar

**Container:** `div.sidebar.dialog-box.draggable`
**DOM ref:** `dom.sidebarContainer`
**Behavior:** Draggable, collapsible wrapper. Contains 4 collapsible sub-panels stacked vertically.

---

### 3a. Brush Panel

**Container:** `div.brush-container`
**DOM ref:** `dom.brushContainer`
**Always visible** (not tool-dependent).

#### Brush Preview Button
- **DOM refs:** `dom.brushDisplay`, `dom.brushPreview`, `dom.brushStamp`
- **Visual:** Square preview showing current brush shape as SVG path
- **Triggers:** Cycles through brush types (round/square/custom)
- **Renders via:** `renderBrushStampToDOM()` in `src/DOM/renderBrush.js`
- **Reads:** `state.tool.current.brushType`, `state.tool.current.brushSize`, `brushStamps`, `customBrushStamp`

#### Brush Size Slider
- **DOM refs:** `dom.brushSlider` (`#brush-size`), `dom.lineWeight` (`#line-weight`)
- **Visual:** Range slider (1–32) with px label
- **Triggers:** Updates `state.tool.current.brushSize`
- **Disabled when:** Brush type is `custom` (32px fixed)

#### Modes Row
- **DOM ref:** `dom.modesContainer` (`.modes-container`)
- **Visual:** Row of icon toggle buttons
- **Renders via:** `renderBrushModesToDOM()` in `src/DOM/renderBrush.js`
- **Reads:** `state.tool.current.modes` (object of `{key: boolean}` pairs)
- **Dynamic:** Rebuilt on every tool switch. Buttons shown depend on active tool.

| Mode button | Key | Shortcut | Tools that show it |
|-------------|-----|----------|-------------------|
| Eraser | `eraser` | E | brush, curve, ellipse, polygon |
| Inject | `inject` | I | brush, curve, ellipse, polygon |
| Pixel Perfect | `perfect` | Y | brush |
| Color Mask | `colorMask` | M | brush |
| Line | `line` | / | brush |
| Quad Curve | `quadCurve` | Q | brush |
| Cubic Curve | `cubicCurve` | C | brush |

#### Stamp Section
- **Container:** `.stamp-options`
- **DOM ref:** `dom.customBrushTypeBtn` (`#custom-brush-type-btn`)
- **Visual:** Single stamp icon button
- **Triggers:** Opens Stamp Editor dialog
- **Visible when:** Active tool is `brush`
- **Renders via:** `renderStampOptionsToDOM()`

#### Dither Section
- **Container:** `.dither-options`
- **Visual:** SVG preview of current dither pattern (8×8 grid)
- **Triggers:** Opens Dither Picker dialog
- **Visible when:** Active tool is one of: `brush`, `curve`, `ellipse`, `polygon`
- **Renders via:** `renderDitherOptionsToDOM()`, `renderDitherPreviewSVG()`
- **Reads:** `state.tool.current.ditherPatternIndex`, `state.tool.current.ditherOffsetX/Y`, `swatches.primary.color`

---

### 3b. Palette Panel

**Container:** `div.palette-interface`
**DOM ref:** `dom.paletteInterfaceContainer`

#### Primary / Secondary Swatches
- **DOM refs:** `dom.swatch` (`.swatch.primary`), `dom.backSwatch` (`.back-swatch`)
- **Visual:** Two overlapping color squares showing current primary/secondary colors
- **Triggers:** Click → opens Color Picker for that swatch; R → randomizes primary
- **Reads:** `swatches.primary.color`, `swatches.secondary.color`

#### Color Switch Button
- **DOM ref:** `dom.colorSwitch` (`.color-switch`)
- **Visual:** Swap icon button
- **Triggers:** Swaps primary and secondary colors

#### Palette Edit / Remove Buttons
- **DOM refs:** `dom.paletteEditBtn` (`.palette-edit`), `dom.paletteRemoveBtn` (`.palette-remove`)
- **Visual:** Knife icon (edit), scraper icon (remove) — toggle buttons
- **Triggers:** Toggle `swatches.paletteMode` between `select` / `edit` / `remove`
- **Renders via:** `renderPaletteToolsToDOM()`
- **Reads:** `swatches.paletteMode`
- **Shortcuts:** Hold K (edit), Hold X (remove)

#### Palette Presets Dropdown
- **DOM refs:** `dom.palettePresetsBtn`, `dom.palettePresetsList`
- **Visual:** Button showing current preset name; click reveals list
- **Triggers:** Loads a preset palette (replaces `swatches.palette`)
- **Renders via:** `renderPalettePresetsToDOM()`
- **Reads:** `swatches.currentPreset`, `swatches.customPalettes`, `PRESETS` from `src/utils/palettes.js`

#### Color Swatches
- **DOM ref:** `dom.paletteColors` (`.palette-colors`)
- **Visual:** Grid of color swatches + "+" add button
- **Triggers:**
  - `select` mode: click swatch → sets primary color
  - `edit` mode: click swatch → opens Color Picker to edit that color
  - `remove` mode: click swatch → removes color from palette
  - Click "+" → adds current primary color to palette
- **Renders via:** `renderPaletteToDOM()`
- **Reads:** `swatches.palette`, `swatches.primary.color`, `swatches.paletteMode`

---

### 3c. Layers Panel

**Container:** `div.layers-interface`
**DOM ref:** `dom.layersInterfaceContainer`
**Disabled during active paste** (`canvas.pastedLayer !== null`)

#### Layer Controls
- **New Layer:** `dom.newLayerBtn` (`.add-layer`) — creates new raster layer
- **New Reference:** `dom.uploadBtn` (`#file-upload`, `<input type="file">`) — imports image as reference layer
- **Delete Layer:** `dom.deleteLayerBtn` (`#delete-layer`) — removes current layer
  - **Disabled when:** Only 1 raster layer remains, or current layer is a reference

#### Layer List
- **DOM ref:** `dom.layersContainer` (`.layers`)
- **Visual:** Stacked rows, each showing layer name + hide + settings buttons; selected layer highlighted
- **Renders via:** `renderLayersToDOM()` in `src/DOM/renderLayers.js`
- **Reads:** `canvas.layers`, `canvas.currentLayer`, `canvas.pastedLayer`
- **Each layer row:**
  - Click → switches `canvas.currentLayer`
  - Draggable for reordering
  - Hide/Show button → toggles `layer.hidden`
  - Settings gear → opens Layer Settings popout

#### Layer Settings Popout
- **DOM ref:** `dom.layerSettingsContainer` (`.layer-settings`)
- **Visual:** Small panel positioned to the right of the clicked layer row
- **Renders via:** `renderLayerSettingsToDOM(domLayer)`
- **Reads:** `layer.title`, `layer.opacity`
- **Contains:** Name text input (max 12 chars), Opacity slider (0–255), Close button
- **Triggers:** Renames layer, adjusts opacity

---

### 3d. Vectors Panel

**Container:** `div.vectors-interface`
**DOM ref:** `dom.vectorsInterfaceContainer`
**Disabled during active paste** (`canvas.pastedLayer !== null`)

#### Vector Thumbnails
- **DOM ref:** `dom.vectorsThumbnails` (`.vectors`)
- **Visual:** List of vector entries, each with a canvas thumbnail + metadata
- **Renders via:** `renderVectorsToDOM()` in `src/DOM/renderVectors.js`
- **Reads:** `state.vector.all`, `state.vector.currentIndex`, `state.vector.selectedIndices`, `state.timeline.undoStack`, `canvas.currentLayer`, `canvas.pastedLayer`
- **Only shows vectors that:** exist on `canvas.currentLayer`, are not removed, and are in the undo stack

**Each vector row contains:**
| Element | Triggers |
|---------|----------|
| Thumbnail (canvas image) | Click → selects vector |
| Tool type icon | Indicates vector type (line/curve/ellipse/polygon) |
| Color swatch | Click → opens Color Picker for that vector's color |
| Hide/Show button | Toggles `vector.hidden` |
| Trash button | Removes vector |
| Settings gear | Opens Vector Settings popout |

#### Vector Settings Popout
- **DOM ref:** `dom.vectorSettingsContainer` (`.vector-settings`)
- **Visual:** Panel positioned to the right of the clicked vector row
- **Renders via:** `renderVectorSettingsToDOM(domVector)`
- **Reads:** `vector.modes`, `vector.color`, `vector.secondaryColor`, `vector.ditherPatternIndex`, `vector.brushSize`
- **Contains:**
  - Mode toggles: line, quadCurve, cubicCurve, eraser, inject, twoColor
  - Primary color button (opens Color Picker)
  - Secondary color button (opens Color Picker)
  - Dither pattern preview (opens vector dither picker)
  - Brush size slider (1–32)
  - Close button

#### Vector Dither Picker
- **DOM ref:** `dom.vectorDitherPickerContainer` (`#vector-dither-picker`)
- **Visual:** Grid of 64 dither pattern thumbnails (same as global dither picker but scoped to a vector)
- **Triggers:** Sets `vector.ditherPatternIndex`

---

## 4. Toolbox

**Container:** `div.toolbox.dialog-box.draggable`
**DOM ref:** `dom.toolboxContainer`
**Behavior:** Draggable, collapsible vertical panel. Static HTML — no render function.

### History Buttons
- **Undo:** `dom.undoBtn` (`#undo`) — Cmd+Z — calls undo action
- **Redo:** `dom.redoBtn` (`#redo`) — Cmd+Shift+Z — calls redo action

### Canvas Buttons
- **Recenter:** `dom.recenterBtn` (`.recenter`) — resets canvas pan/zoom to default
- **Clear:** `dom.clearBtn` (`.clear`) — clears current layer; disabled during active paste

### Zoom Buttons
- **Container:** `dom.zoomContainer` (`.zoom`)
- **Zoom Out:** `#minus` — decreases `canvas.zoom`
- **Zoom In:** `#plus` — increases `canvas.zoom`
- Also responds to mouse wheel

### Tool Buttons
- **Container:** `dom.toolsContainer` (`.tools`)
- **Behavior:** Click → calls `switchTool(toolName, btn)` in `src/Tools/toolbox.js`
- **Reads:** `state.tool.current` — selected tool gets `.selected` class
- **Active tool disables incompatible tools** when a reference/paste layer is active

**Two-column layout:**

| Column 1 | Column 2 |
|----------|----------|
| Brush (B) `dom.brushBtn` | Eyedropper (Hold Alt) `dom.eyedropperBtn` |
| Fill (F) `dom.fillBtn` | Grab (Hold Space) `dom.grabBtn` |
| Curve (V) `dom.curveBtn` | Move `dom.moveBtn` |
| Shapes group: Ellipse (O) / Polygon (P) | |
| Selection group: Select (S) / Magic Wand (W) | |

**Tool groups** (`.tool-group`): The group button shows the last-used tool's icon and reveals a popout with all tools in the group on hover.

---

## 5. Floating Dialogs

All dialogs are `div.dialog-box.draggable` — free-positioned, draggable, and shown/hidden via `style.display` or class toggles.

---

### 5a. Settings Dialog

**Container:** `div.settings-container`
**DOM ref:** `dom.settingsContainer`
**Opened by:** Settings button (`dom.settingsBtn`) in nav bar
**Contains:**

| Control | DOM ref | Shortcut | Reads | Triggers |
|---------|---------|----------|-------|----------|
| Tooltips toggle | `dom.tooltipBtn` (`#tooltips-toggle`) | T | — | Shows/hides `data-tooltip` attributes |
| Grid toggle | `dom.gridBtn` (`#grid-toggle`) | G | — | Shows/hides pixel grid on canvas |
| Grid Spacing input | `dom.gridSpacing` + `dom.gridSpacingSpinBtn` | — | grid spacing value | Sets subgrid spacing (1–64) |
| Vector Selection Outline toggle | `#vector-outline-toggle` | — | — | Shows/hides vector selection outline in GUI |
| Cursor Preview toggle | `dom.cursorPreviewBtn` (`#cursor-preview-toggle`) | — | — | Switches cursor between outline and color-fill preview |

---

### 5b. Dither Picker Dialog

**Container:** `div.dither-picker-container`
**DOM ref:** `dom.ditherPickerContainer`
**Opened by:** Dither preview button in Brush panel
**Initialized lazily** (first open) via `initDitherPicker()`

| Control | Reads | Triggers |
|---------|-------|----------|
| Two-Color toggle (`#dither-ctrl-two-color`) | `state.tool.current.modes.twoColor` | Toggles two-color dither mode |
| Build-Up Dither toggle (`#dither-ctrl-build-up`) | `state.tool.current.modes.buildUpDither` | Toggles build-up dither |
| Dither Offset Control (draggable 2D ring SVG) | `state.tool.current.ditherOffsetX/Y` | Sets dither tile offset (0–7 × 0–7) |
| Build-Up Steps section (hidden unless build-up active) | `state.tool.current.buildUpSteps`, `.buildUpMode` | — |
| → Mode selector (Custom / 2×2 / 4×4 / 8×8) | `state.tool.current.buildUpMode` | Sets build-up step source |
| → Step slot buttons (4 slots) | `state.tool.current.buildUpSteps`, `.buildUpActiveStepSlot` | Selects active slot; then pattern click assigns it |
| → Reset Density Map | — | Clears accumulated build-up history |
| 64-pattern grid (`.dither-grid`) | `state.tool.current.ditherPatternIndex` | Sets active dither pattern |

**Colors in SVG thumbnails** update to reflect `swatches.primary/secondary.color` and two-color mode.

---

### 5c. Color Picker Dialog

**Container:** `div.picker-container`
**DOM ref:** `dom.colorPickerContainer`
**Opened by:** Primary/secondary swatch click, palette edit mode swatch click, vector color button click

| Control | DOM ref | Reads | Triggers |
|---------|---------|-------|----------|
| Color Ramps (collapsible) | `#color-ramps-section` | Current color context | Click ramp swatch → sets picker to that color |
| HSL gradient canvas | `canvas#color-picker` | Current H, S, L | Pointer → picks S+L value |
| Hue slider | `#hueslider` (0–359) | Current H | Sets hue |
| Alpha slider | `#alphaslider` (0–255) | Current A | Sets alpha |
| New color swatch | `dom.newColorBtn` (`#newcolor-btn`) | Pending color | Click → adds color to palette without closing |
| Old color swatch | `#oldcolor-btn` | Original color when picker opened | Click → reverts to original |
| OK button | `dom.confirmBtn` | — | Applies color, closes picker |
| Cancel button | `dom.cancelBtn` | — | Discards color, closes picker |
| R/G/B/A inputs | `#r`, `#g`, `#b`, `#a` (0–255, spin buttons) | Current RGBA | Sets individual channel |
| H/S/L inputs | `#h`, `#s`, `#l` (spin buttons) | Current HSL | Sets individual channel |
| Hex input | `#hexcode` | Current color | Sets color from hex string |
| Luminance display | `#luminance` | Current color | Read-only relative luminance |

---

### 5d. Canvas Size Dialog

**Container:** `div.size-container`
**DOM ref:** `dom.sizeContainer`
**Opened by:** Edit > Resize Canvas...

| Control | DOM ref | Reads | Triggers |
|---------|---------|-------|----------|
| Width input | `dom.canvasWidth` (`#canvas-width`, 8–1024) | `canvas.offScreenCVS.width` | Sets new canvas width |
| Height input | `dom.canvasHeight` (`#canvas-height`, 8–1024) | `canvas.offScreenCVS.height` | Sets new canvas height |
| Anchor grid | `dom.anchorGrid` (`#anchor-grid`) | — | 9-button grid sets which corner/edge stays fixed during resize |
| Submit | `#update-size` | — | Applies resize |
| Cancel | `dom.canvasSizeCancelBtn` (`#cancel-resize-button`) | — | Closes dialog |

---

### 5e. Save Options Dialog

**Container:** `div.save-container`
**DOM ref:** `dom.saveContainer`
**Opened by:** File > Save As... / Cmd+S

| Control | DOM ref | Triggers |
|---------|---------|----------|
| Filename input | `dom.saveAsFileName` (`#save-file-name`, max 24 chars) | Sets filename for `.pxv` download |
| Filesize preview | `dom.fileSizePreview` (`#savefile-size`) | Read-only estimated file size |
| Preserve Entire History toggle | `#preserve-history-toggle` | When unchecked, reveals advanced options |
| Advanced Options (conditional) | `dom.advancedOptionsContainer` (`#save-advanced-options`) | — |
| → Include Palette | `#include-palette-toggle` | Whether to save palette in file |
| → Include Reference Layers | `#include-reference-layers-toggle` | Whether to save reference layer images |
| → Include Removed Actions | `#include-removed-actions-toggle` | Whether to keep trashed layer/vector data |
| Save (form submit) | `dom.saveAsForm` (`#save-interface`) | Downloads `.pxv` file |
| Cancel | `dom.cancelSaveBtn` (`#cancel-save-button`) | Closes dialog |

---

### 5f. Export Dialog

**Container:** `div.export-container`
**DOM ref:** `dom.exportContainer`
**Opened by:** File > Export
**Content:** Dynamically rendered pixel-scale selector
**Triggers:** Downloads `.png` at selected pixel scale

---

### 5g. Stamp Editor Dialog

**Container:** `#stamp-editor`
**DOM ref:** `dom.stampEditorContainer`
**Opened by:** Custom stamp button in Brush panel

| Control | DOM ref | Triggers |
|---------|---------|----------|
| Editor canvas (320×320) | `dom.stampEditorCanvas` (`#stamp-editor-canvas`) | 32×32 pixel drawing surface (10px/cell) |
| Preview canvas (32×32) | `dom.stampPreviewCanvas` (`#stamp-preview-canvas`) | Live preview at actual size |
| Draw tool | `dom.stampDrawBtn` (`#stamp-draw-btn`) | Activates draw mode |
| Erase tool | `dom.stampEraseBtn` (`#stamp-erase-btn`) | Activates erase mode |
| Move tool | `dom.stampMoveBtn` (`#stamp-move-btn`) | Activates move/pan mode |
| Mirror H | `dom.stampMirrorHBtn` (`#stamp-mirror-h-btn`) | Mirrors stamp pixels horizontally |
| Mirror V | `dom.stampMirrorVBtn` (`#stamp-mirror-v-btn`) | Mirrors stamp pixels vertically |
| Apply | `dom.stampEditorApplyBtn` (`#stamp-editor-apply-btn`) | Saves stamp to `customBrushStamp`, closes editor |
| Clear | `dom.stampEditorClearBtn` (`#stamp-editor-clear-btn`) | Clears all pixels in editor |

**Reads:** `swatches.primary.color` (for draw color), `customBrushStamp.pixels`

---

### 5h. Vector Transform UI

**Container:** `div.vector-transform-ui-container`
**DOM refs:** `dom.vectorTransformUIContainer`, `dom.vectorTransformModeContainer`
**Shown when:** A vector is selected and the Move tool is active

| Control | ID | Triggers |
|---------|-----|----------|
| Translate | `#translate` | Sets transform mode to translate (drag vector anchor points) |
| Rotate | `#rotate` | Sets transform mode to rotate around center |
| Scale | `#scale` | Sets transform mode to scale from center |
| Close button | `#vector-transform-ui-closer` | Hides dialog |

---

## 6. Tooltip System

**Element:** `#tooltip`
**DOM ref:** `dom.tooltip`
**Behavior:** Single floating element repositioned near the cursor. Populated from `data-tooltip` attributes on any element.
**Toggle:** Settings > Tooltips (T shortcut)

---

## 7. Canvas Overlay Renderers *(stays vanilla JS — do NOT migrate to React)*

These are `<canvas>`-rendered overlays in `src/GUI/`. They are tightly coupled to pointer events and `requestAnimationFrame`; React provides no benefit here.

| Overlay | Canvas | File | Reads | Purpose |
|---------|--------|------|-------|---------|
| Cursor preview | `canvas#cursor-canvas` | `src/GUI/cursor.js` | brush size/type, primary color, pointer pos | Brush shape/color preview under cursor |
| Selection guide | `canvas#selection-gui-canvas` | `src/GUI/select.js` | `state.selection.maskSet`, boundary box | Animated marching-ants selection border |
| Vector GUI | `canvas#vector-gui-canvas` | `src/GUI/vector.js` (965 LOC) | `state.vector`, `canvas.zoom`, pointer pos | Bezier handles, anchor points, path previews |
| Grid | `canvas.bg-canvas` | `src/GUI/grid.js` | grid spacing, `canvas.zoom` | Pixel grid drawn on background canvas |
| Resize overlay | `canvas#resize-overlay-canvas` | `src/GUI/resize.js` | Canvas dimensions, pointer pos | Resize border/handle during canvas resize |

---

## Appendix: State Objects Reference

| State object | Location | Key properties used by UI |
|--------------|----------|--------------------------|
| `state.tool.current` | `src/Context/state.js` | `.name`, `.brushSize`, `.brushType`, `.modes`, `.options`, `.ditherPatternIndex`, `.ditherOffsetX/Y`, `.buildUpMode`, `.buildUpSteps` |
| `state.vector` | `src/Context/state.js` | `.all`, `.currentIndex`, `.selectedIndices` |
| `state.selection` | `src/Context/state.js` | `.maskSet`, `.boundaryBox` |
| `state.clipboard` | `src/Context/state.js` | `.select.canvas`, `.select.vectors` |
| `state.timeline` | `src/Context/state.js` | `.undoStack`, `.redoStack` |
| `canvas.layers` | `src/Context/canvas.js` | Layer objects with `.type`, `.title`, `.hidden`, `.opacity`, `.removed`, `.onscreenCvs` |
| `canvas.currentLayer` | `src/Context/canvas.js` | Active layer reference |
| `canvas.pastedLayer` | `src/Context/canvas.js` | Non-null during active paste → disables layer/vector interfaces |
| `canvas.zoom` | `src/Context/canvas.js` | Current zoom level |
| `swatches.primary` | `src/Context/swatch.js` | `.color` — active drawing color |
| `swatches.secondary` | `src/Context/swatch.js` | `.color` — secondary/background color |
| `swatches.palette` | `src/Context/swatch.js` | Array of color objects |
| `swatches.paletteMode` | `src/Context/swatch.js` | `"select"` / `"edit"` / `"remove"` |
| `swatches.currentPreset` | `src/Context/swatch.js` | Active preset name |

---

## Appendix: Render Functions Reference

| Function | File | Called when |
|----------|------|-------------|
| `renderLayersToDOM()` | `src/DOM/renderLayers.js` | Layer added/removed/reordered, paste start/end |
| `renderLayerSettingsToDOM(domLayer)` | `src/DOM/renderLayers.js` | Layer settings gear clicked |
| `renderVectorsToDOM()` | `src/DOM/renderVectors.js` | Vector created/removed/modified, layer changed |
| `renderVectorSettingsToDOM(domVector)` | `src/DOM/renderVectors.js` | Vector settings gear clicked |
| `renderBrushStampToDOM()` | `src/DOM/renderBrush.js` | Brush size/type changes |
| `renderBrushModesToDOM()` | `src/DOM/renderBrush.js` | Tool switch |
| `renderToolOptionsToDOM()` | `src/DOM/renderBrush.js` | Tool switch |
| `renderStampOptionsToDOM()` | `src/DOM/renderBrush.js` | Tool switch |
| `renderDitherOptionsToDOM()` | `src/DOM/renderBrush.js` | Tool switch |
| `renderDitherControlsToDOM()` | `src/DOM/renderBrush.js` | Two-color / build-up mode toggle |
| `renderBuildUpStepsToDOM()` | `src/DOM/renderBrush.js` | Build-up mode toggle, step slot change |
| `renderPaletteToDOM()` | `src/DOM/renderPalette.js` | Color added/removed, palette loaded |
| `renderPaletteToolsToDOM()` | `src/DOM/renderPalette.js` | Palette mode change |
| `renderPalettePresetsToDOM()` | `src/DOM/renderPalette.js` | Preset loaded |
| `initDitherPicker()` | `src/DOM/renderBrush.js` | First time dither picker is opened |
| `highlightSelectedDitherPattern()` | `src/DOM/renderBrush.js` | Pattern selection changes |
| `updateDitherPickerColors()` | `src/DOM/renderBrush.js` | Color change, two-color mode toggle |
| `disableActionsForPaste()` | `src/DOM/disableDomElements.js` | Paste operation starts |
| `enableActionsForNoPaste()` | `src/DOM/disableDomElements.js` | Paste confirmed/cancelled |
| `disableActionsForNoSelection()` | `src/DOM/disableDomElements.js` | Selection cleared |
| `enableActionsForSelection()` | `src/DOM/disableDomElements.js` | Selection created |
