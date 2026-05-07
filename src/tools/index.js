import { brush } from './brush.js'
import { select } from './select.js'
import { magicWand } from './magicWand.js'
import { move } from './move.js'
import { fill } from './fill.js'
import { curve } from './curve.js'
import { ellipse } from './ellipse.js'
import { polygon } from './polygon.js'
import { eyedropper } from './eyedropper.js'
import { grab } from './grab.js'

//====================================//
//===== * * * Tools Object * * * =====//
//====================================//

//Tools
export const tools = {
  //Modify history Tool
  modify: {
    name: 'modify',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  changeMode: {
    name: 'changeMode',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  changeDitherPattern: {
    name: 'changeDitherPattern',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  changeDitherOffset: {
    name: 'changeDitherOffset',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  changeBrushSize: {
    name: 'changeBrushSize',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  changeColor: {
    name: 'changeColor',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  remove: {
    name: 'remove',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  clear: {
    name: 'clear',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'modify',
  },
  //Raster Tools
  brush,
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  select,
  magicWand,
  move,
  // gradient: {
  // Create a dithered gradient
  // },
  //Vector Tools
  fill,
  curve,
  ellipse,
  polygon,
  //Non-cursor tools
  addLayer: {
    name: 'addLayer',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'settings',
  },
  removeLayer: {
    name: 'removeLayer',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'settings',
  },
  cut: {
    name: 'cut',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {
      //copy vectors/ actions?
    },
    modes: {},
    type: 'raster',
  },
  paste: {
    name: 'paste',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {},
    modes: {},
    type: 'raster',
  },
  vectorPaste: {
    name: 'vectorPaste',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {},
    modes: {},
    type: 'vector',
  },
  transform: {
    name: 'transform',
    fn: null, //used for stretch and flip functionality
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {},
    modes: {},
    type: 'raster',
  },
  resize: {
    name: 'resize',
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: 'settings',
  },
  //Utility Tools (does not affect timeline)
  eyedropper,
  grab,
  /**
   * perspective: {
   * set vanishing points.
   * Click to create a vanishing point with visible radius r.
   * Points are always visible even outside canvas area.
   * Clicking outside r will generate a new vanishing point.
   * Clicking inside r will select that vanishing point.
   * Hold shift to draw line from currently selected vanishing point to pointer location.
   * Hold control to view automatic perspective lines and click to make lines permanent.
   * NOTE: First iteration will not support curvilinear perspective. Can be approximated by combining multipoint perspective with drawing bezier curves from point to point
   * TODO: (Low Priority) Add toggle option to snap line/ curve endpoints to vanishing point if made inside vanishing points radius.
  }
   */
}

//====================================//
//===== * * * Tool Groups * * * ======//
//====================================//

/**
 * Defines groups of related tools that share a single toolbox slot.
 * activeTool tracks which tool in the group is currently shown/selected.
 */
export const toolGroups = {
  shapeTools: {
    tools: ['ellipse', 'polygon'],
    activeTool: 'ellipse',
  },
  selectionTools: {
    tools: ['select', 'magicWand'],
    activeTool: 'select',
  },
}

/**
 * Captures the mutable runtime state of every tool and tool group into a
 * plain object suitable for later restoration. Only the four properties
 * that vary at runtime are recorded — modes, brushSize, brushType, and
 * ditherPatternIndex; structural fields like `fn`, `type`, and
 * `brushDisabled` are intentionally excluded. For groups, only
 * `activeTool` is captured because it is the sole group field that
 * changes. The result is a value snapshot, not a live reference — modes
 * are shallow-copied so that subsequent mode changes do not retroactively
 * alter it.
 * @returns {{ tools: object, groups: object }} Snapshot of per-tool
 *   drawable state and per-group active-tool selection.
 */
export function snapshotToolsState() {
  const toolsSnap = {}
  for (const [name, tool] of Object.entries(tools)) {
    toolsSnap[name] = {
      // Shallow copy decouples the snapshot from the live modes object;
      // tools with no modes get {} so restoreToolsState can assign safely.
      modes: tool.modes ? { ...tool.modes } : {},
      brushSize: tool.brushSize,
      brushType: tool.brushType,
      ditherPatternIndex: tool.ditherPatternIndex,
    }
  }
  const groupsSnap = {}
  for (const [name, group] of Object.entries(toolGroups)) {
    groupsSnap[name] = group.activeTool
  }
  return { tools: toolsSnap, groups: groupsSnap }
}

/**
 * Restores tool and group state from a snapshot produced by
 * `snapshotToolsState`, mutating the live tool objects in place. Tools
 * absent from the current registry are skipped — a snapshot taken on a
 * different build may reference tools that have since been added or
 * removed. Modes are merged via Object.assign rather than replaced so
 * keys absent from the snapshot are left intact on the live object. The
 * `!== undefined` guards intentionally let null through: null is a valid
 * "disabled" state for brushSize, brushType, and ditherPatternIndex on
 * tools that don't use those properties.
 * @param {{ tools: object, groups: object }} snap Snapshot returned by
 *   `snapshotToolsState`.
 */
export function restoreToolsState(snap) {
  for (const [name, state] of Object.entries(snap.tools)) {
    const tool = tools[name]
    // Snapshot may reference a tool removed in a later build.
    if (!tool) continue
    if (tool.modes && state.modes) Object.assign(tool.modes, state.modes)
    if (state.brushSize !== undefined) tool.brushSize = state.brushSize
    if (state.brushType !== undefined) tool.brushType = state.brushType
    if (state.ditherPatternIndex !== undefined)
      tool.ditherPatternIndex = state.ditherPatternIndex
  }
  for (const [name, activeTool] of Object.entries(snap.groups)) {
    if (toolGroups[name]) toolGroups[name].activeTool = activeTool
  }
}
