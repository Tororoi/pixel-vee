/**
 * Centralized tooltip and aria-label strings for buttons and controls
 * across the app. Each entry is keyed by a stable id and has the shape
 * `{ label, tooltip }`:
 *
 *   - `label`   is used for `aria-label`. It is single-line so screen
 *               readers don't read literal newline characters.
 *   - `tooltip` is used for `data-tooltip`. It may include `\n\n` when
 *               the visual tooltip benefits from multi-line formatting.
 *
 * Both fields are spelled out on every entry — even when they're equal —
 * so any difference between the accessible label and the visible tooltip
 * is explicit at the call site.
 *
 * Tooltips driven by runtime values (palette color hex codes, mode
 * keys looked up by name, indexed labels like "12/64", per-vector tool
 * names) are NOT centralized here — they live inline at the call site
 * because their text is computed from data, not chosen from a fixed
 * set.
 */

export const TOOLTIPS = {
  // ─── Toolbox: history & view ────────────────────────────────────
  undo: {
    label: 'Undo',
    tooltip: 'Undo (Cmd + Z)',
  },
  redo: {
    label: 'Redo',
    tooltip: 'Redo (Cmd + Shift + Z)',
  },
  recenter: {
    label: 'Recenter Canvas',
    tooltip: 'Recenter Canvas',
  },
  clearCanvas: {
    label: 'Clear Canvas',
    tooltip: 'Clear Canvas',
  },
  zoomOut: {
    label: 'Zoom Out',
    tooltip: 'Zoom Out (Mouse Wheel)',
  },
  zoomIn: {
    label: 'Zoom In',
    tooltip: 'Zoom In (Mouse Wheel)',
  },

  // ─── Toolbox: tools ─────────────────────────────────────────────
  brush: {
    label: 'Brush',
    tooltip: 'Brush (B)\n\nHold Shift for straight lines',
  },
  fill: {
    label: 'Fill',
    tooltip: 'Fill (F)',
  },
  curve: {
    label: 'Curve',
    tooltip: 'Curve (V)',
  },
  eyedropper: {
    label: 'Eyedropper',
    tooltip: 'Eyedropper (Hold Alt)',
  },
  grab: {
    label: 'Grab',
    tooltip: 'Grab (Hold Space)',
  },
  move: {
    label: 'Move',
    tooltip: 'Move',
  },
  ellipse: {
    label: 'Ellipse',
    tooltip: 'Ellipse (O)\n\nHold Shift to maintain circle',
  },
  polygon: {
    label: 'Polygon',
    tooltip: 'Polygon (P)\n\nHold Shift to maintain square',
  },
  select: {
    label: 'Select',
    tooltip: 'Select (S)',
  },
  magicWand: {
    label: 'Magic Wand',
    tooltip: 'Magic Wand (W)',
  },

  // ─── Toolbox: groups ────────────────────────────────────────────
  shapeTools: {
    label: 'Shapes',
    tooltip: 'Shapes',
  },
  selectionTools: {
    label: 'Select',
    tooltip: 'Select (S)',
  },

  // ─── NavBar: file menu ──────────────────────────────────────────
  openDrawing: {
    label: 'Open saved drawing',
    tooltip: 'Open saved drawing',
  },
  saveAs: {
    label: 'Open dialog box to download file with current progress',
    tooltip: 'Open dialog box to download file with current progress',
  },
  importImage: {
    label: 'Import image',
    tooltip: 'Import image',
  },
  exportPng: {
    label: 'Download as .png',
    tooltip: 'Download as .png',
  },

  // ─── NavBar: edit menu ──────────────────────────────────────────
  canvasResize: {
    label: 'Open dialog box to resize canvas area',
    tooltip: 'Open dialog box to resize canvas area',
  },
  selectAll: {
    label: 'Select entire canvas',
    tooltip: 'Select entire canvas (Cmd + A)',
  },
  deselect: {
    label: 'Deselect selection area',
    tooltip: 'Deselect selection area (Cmd + D)',
  },
  cutSelection: {
    label: 'Cut selection',
    tooltip: 'Cut selection (Cmd + X)',
  },
  copySelection: {
    label: 'Copy selection',
    tooltip: 'Copy selection (Cmd + C)',
  },
  pasteSelection: {
    label: 'Paste copied selection',
    tooltip: 'Paste copied selection (Cmd + V)',
  },
  deleteSelection: {
    label: 'Delete selection',
    tooltip: 'Delete selection (Backspace)',
  },
  flipHorizontal: {
    label: 'Flip selection horizontally',
    tooltip: 'Flip selection horizontally (Cmd + F)',
  },
  flipVertical: {
    label: 'Flip selection vertically',
    tooltip: 'Flip selection vertically (Cmd + Shift + F)',
  },
  rotateRight: {
    label: 'Rotate selection 90 degrees clockwise',
    tooltip: 'Rotate selection 90 degrees clockwise (Cmd + R)',
  },

  // ─── NavBar: misc ───────────────────────────────────────────────
  navigator: {
    label: 'Open navigator',
    tooltip: 'Open navigator',
  },
  settings: {
    label: 'Open settings menu',
    tooltip: 'Open settings menu',
  },

  // ─── DialogBox / SettingsPopout chrome ──────────────────────────
  close: {
    label: 'Close',
    tooltip: 'Close',
  },
  collapseExpand: {
    label: 'Collapse or Expand',
    tooltip: 'Collapse/ Expand',
  },

  // ─── LayersPanel ────────────────────────────────────────────────
  newLayer: {
    label: 'New Layer',
    tooltip: 'New Layer',
  },
  addReferenceLayer: {
    label: 'Add Reference Layer',
    tooltip: 'Add Reference Layer',
  },
  deleteLayer: {
    label: 'Delete Layer',
    tooltip: 'Delete Layer',
  },
  showLayer: {
    label: 'Show Layer',
    tooltip: 'Show Layer',
  },
  hideLayer: {
    label: 'Hide Layer',
    tooltip: 'Hide Layer',
  },
  layerSettings: {
    label: 'Layer Settings',
    tooltip: 'Layer Settings',
  },
  editMask: {
    label: 'Edit Mask',
    tooltip:
      'Edit Mask\n\nRoute drawing tools to the mask canvas instead of the layer',
  },
  enableMask: {
    label: 'Enable Mask',
    tooltip:
      'Enable Mask\n\nWhen off, the mask is ignored and drawing is unrestricted',
  },
  showMaskOverlay: {
    label: 'Show Mask Overlay',
    tooltip:
      'Show Mask Overlay\n\nDisplay the overlay where the mask is set',
  },
  invertMask: {
    label: 'Invert Mask',
    tooltip:
      'Invert Mask\n\nFlip the gate: in-set pixels become the drawable area instead of blocked',
  },

  // ─── VectorsPanel ───────────────────────────────────────────────
  actionColor: {
    label: 'Action Color',
    tooltip: 'Action Color',
  },
  showVector: {
    label: 'Show Vector',
    tooltip: 'Show Vector',
  },
  hideVector: {
    label: 'Hide Vector',
    tooltip: 'Hide Vector',
  },
  removeVector: {
    label: 'Remove Vector',
    tooltip: 'Remove Vector',
  },
  vectorSettings: {
    label: 'Vector Settings',
    tooltip: 'Vector Settings',
  },

  // ─── VectorSettingsPopout ───────────────────────────────────────
  primaryColor: {
    label: 'Primary Color',
    tooltip: 'Primary Color',
  },
  secondaryColor: {
    label: 'Secondary Color',
    tooltip: 'Secondary Color',
  },
  selectDitherPattern: {
    label: 'Select dither pattern',
    tooltip: 'Select dither pattern',
  },

  // ─── BrushPanel ─────────────────────────────────────────────────
  switchBrush: {
    label: 'Click to switch brush',
    tooltip: 'Click to switch brush',
  },
  customStamp: {
    label: 'Custom Stamp',
    tooltip: 'Custom Stamp',
  },
  modeLine: {
    label: 'Line',
    tooltip: 'Line (/)',
  },
  modeQuadCurve: {
    label: 'Quadratic Curve',
    tooltip: 'Quadratic Curve (Q)',
  },
  modeCubicCurve: {
    label: 'Cubic Curve',
    tooltip: 'Cubic Curve (C)',
  },
  modeEraser: {
    label: 'Eraser (E)',
    tooltip: 'Eraser (E)',
  },
  modeInject: {
    label: 'Inject (I)',
    tooltip: 'Inject (I)',
  },
  modePerfect: {
    label: 'Pixel Perfect (Y)',
    tooltip: 'Pixel Perfect (Y)',
  },
  modeColorMask: {
    label: 'Color Mask (M)',
    tooltip: 'Color Mask (M)',
  },

  // ─── BrushDitherPreview ─────────────────────────────────────────
  ditherPreview: {
    label: 'Click to select dither pattern',
    tooltip: 'Click to select dither pattern',
  },

  // ─── PalettePanel ───────────────────────────────────────────────
  primarySwatch: {
    label: 'Primary Swatch',
    tooltip: 'Primary Swatch\n\n(R) to randomize\n\nClick to open Color Picker',
  },
  secondarySwatch: {
    label: 'Secondary Swatch',
    tooltip: 'Secondary Swatch\n\nClick to open Color Picker',
  },
  colorSwitch: {
    label: 'Switch primary/ secondary colors',
    tooltip: 'Switch primary/ secondary colors',
  },
  editPaletteColor: {
    label: 'Edit Palette Color (Hold K)',
    tooltip: 'Edit Palette Color (Hold K)',
  },
  removePaletteColor: {
    label: 'Remove Palette Color (Hold X)',
    tooltip: 'Remove Palette Color (Hold X)',
  },
  palettePresets: {
    label: 'Palette Presets',
    tooltip: 'Palette Presets',
  },
  addPaletteColor: {
    label: 'Add Color',
    tooltip: 'Add current primary color to palette',
  },

  // ─── DitherPickerDialog ─────────────────────────────────────────
  ditherTwoColor: {
    label: 'Two-Color',
    tooltip: 'Two-Color',
  },
  buildUpDither: {
    label: 'Build-Up Dither',
    tooltip:
      'Build-Up Dither\n\nAutomatically increase dither density on overlapping strokes',
  },
  ditherOffsetControl: {
    label: 'Drag to set dither offset',
    tooltip: 'Drag to set dither offset',
  },
  buildUpModeCustom: {
    label: 'Custom build-up steps',
    tooltip: 'Custom build-up steps',
  },
  buildUpMode2x2: {
    label: '4 steps from a 2x2 Bayer Matrix',
    tooltip: '4 steps from a 2x2 Bayer Matrix',
  },
  buildUpMode4x4: {
    label: '16 steps from a 4x4 Bayer Matrix',
    tooltip: '16 steps from a 4x4 Bayer Matrix',
  },
  buildUpMode8x8: {
    label: '64 steps from an 8x8 Bayer Matrix',
    tooltip: '64 steps from an 8x8 Bayer Matrix',
  },
  buildUpReset: {
    label: 'Reset build-up density',
    tooltip: 'Reset build-up density',
  },

  // ─── StampEditorDialog ──────────────────────────────────────────
  stampDraw: {
    label: 'Draw',
    tooltip: 'Draw',
  },
  stampErase: {
    label: 'Erase',
    tooltip: 'Erase',
  },
  stampMove: {
    label: 'Move',
    tooltip: 'Move',
  },
  mirrorHorizontal: {
    label: 'Mirror Horizontal',
    tooltip: 'Mirror Horizontal',
  },
  mirrorVertical: {
    label: 'Mirror Vertical',
    tooltip: 'Mirror Vertical',
  },
  stampClear: {
    label: 'Clear',
    tooltip: 'Clear',
  },

  // ─── VectorTransformDialog ──────────────────────────────────────
  translate: {
    label: 'Translate',
    tooltip: 'Translate',
  },
  rotate: {
    label: 'Rotate',
    tooltip: 'Rotate',
  },
  scale: {
    label: 'Scale',
    tooltip: 'Scale',
  },

  // ─── SaveDialog ─────────────────────────────────────────────────
  saveAsPxv: {
    label: 'Save offline as a .pxv file',
    tooltip: 'Save offline as a .pxv file',
  },
  preserveHistory: {
    label: 'Preserve Entire History',
    tooltip: 'Preserve all actions in history, palette, and reference images',
  },
  includePalette: {
    label: 'Palette',
    tooltip: 'Save colors in palette',
  },
  includeReferenceLayers: {
    label: 'Reference Layers',
    tooltip:
      'Save all reference images, including any transformations applied to them.',
  },
  includeRemovedActions: {
    label: 'Removed Actions',
    tooltip:
      "If a layer or vector was trashed or layer was cleared, those actions are still recoverable by using undo. If you're certain those actions won't be missed, you can remove them permanently by unchecking this box.",
  },

  // ─── SettingsDialog ─────────────────────────────────────────────
  toggleTooltips: {
    label: 'Tooltips',
    tooltip: 'Toggle tooltips (T)',
  },
  toggleGrid: {
    label: 'Grid',
    tooltip: 'Toggle grid (G)\n\nDisplays at higher zoom levels only.',
  },
  cursorPreview: {
    label: 'Cursor Preview',
    tooltip: 'Show brush color preview under cursor instead of an outline',
  },

  // ─── Tool options: curve ────────────────────────────────────────
  curveChain: {
    label: 'Chain',
    tooltip:
      'Toggle Chain (7). \n\nStart a new vector from a colliding vector endpoint instead of adjusting it.',
  },
  curveEqual: {
    label: 'Equal Length',
    tooltip:
      'Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.',
  },
  curveAlign: {
    label: 'Align',
    tooltip:
      'Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.',
  },
  curveHold: {
    label: 'Hold',
    tooltip:
      'Toggle Hold (H). \n\nMaintain relative angles of all control handles attached to selected control point.',
  },
  curveLink: {
    label: 'Linking',
    tooltip:
      'Toggle Linking (L). \n\nConnected control points of other vectors will move with selected control point.',
  },
  curveDisplayPaths: {
    label: 'Paths',
    tooltip: 'Toggle Paths. \n\nShow paths for vectors.',
  },

  // ─── Tool options: ellipse ──────────────────────────────────────
  ellipseUseSubpixels: {
    label: 'Use Subpixels',
    tooltip:
      'Toggle use subpixels. \n\nUse subpixels to control handling of origin point for radii. Determines odd or even length bounding box for ellipse.',
  },
  ellipseDisplayPaths: {
    label: 'Paths',
    tooltip: 'Toggle Paths. \n\nShow paths for ellipse.',
  },

  // ─── Tool options: polygon ──────────────────────────────────────
  polygonUniform: {
    label: 'Uniform',
    tooltip: 'Uniform. \n\nMaintain rectangular shape when adjusting corners.',
  },
  polygonDisplayPaths: {
    label: 'Paths',
    tooltip: 'Toggle Paths. \n\nShow path for polygon.',
  },
}

const FALLBACK_LABEL = 'Tool'

/**
 * Returns the tooltip entry for an id, or a `{ label, tooltip }` pair
 * derived from the id when no entry exists. Useful in templates that
 * iterate over a dynamic set of tools/groups so the call site doesn't
 * have to spell out the fallback every time.
 * @param {string} id - The id key into `TOOLTIPS`.
 * @returns {{ label: string, tooltip: string }} The matching entry, or
 *   a fallback derived from the id when no entry exists.
 */
export function getTooltip(id) {
  return TOOLTIPS[id] ?? { label: id ?? FALLBACK_LABEL, tooltip: id ?? '' }
}
