# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run sass         # SCSS watch compiler (run separately alongside dev)
npm run eslint       # Lint
npm run eslintfix    # Lint + auto-fix
npm run pretty       # Prettier format
npm run check        # svelte-check type validation
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run tests/state.test.js
```

**SCSS is not bundled by Vite.** It must be compiled separately with `npm run sass`. Output goes to `css/style.css`, which is loaded directly in `index.html`.

## Architecture

### Hybrid Vanilla JS + Svelte

The app has two distinct layers that must coexist:

- **Svelte layer** — UI components in `src/components/` (panels, dialogs, toolbox, navbar)
- **Vanilla JS layer** — All canvas drawing, tool logic, event handling, and state mutations in `src/Tools/`, `src/Canvas/`, `src/Actions/`, `src/GUI/`, `src/Controls/`, `src/Menu/`, `src/Swatch/`

Vanilla JS code mutates the shared `globalState` object directly, then calls `bump()` to signal Svelte components to re-render.

### The bump()/getVersion() Reactivity Bridge

`src/hooks/appState.svelte.js` is the only connection between vanilla JS mutations and Svelte reactivity:

```js
// Vanilla JS (after any state mutation):
globalState.tool.current = newTool
bump()

// Svelte components subscribe via $derived:
const toolName = $derived(getVersion() >= 0 && globalState.tool.current?.name)
```

`getVersion() >= 0` is always true but creates a reactive dependency — when `bump()` increments the counter, all derived expressions that read `getVersion()` re-evaluate. This replaces Svelte stores for the cross-layer state.

### Global State (`src/Context/state.js`)

`globalState` is a single mutable object with domain sub-objects: `cursor`, `tool`, `vector`, `selection`, `timeline`, `ui`, `clipboard`, `transform`, `drawing`. It is mutated directly throughout the codebase — never replaced or cloned.

Circular dependency between `state.js` and `vectorGui`/DOM helpers is broken via injection: `registerVectorGui(vg)` and `registerDOMHelpers({...})` are called from `src/main.js` after all modules load.

### DOM Reference Bridge (`src/Context/dom.js`)

`dom.js` queries 100+ DOM elements at module load time and exports them as a single `dom` object. Many of these queries return `null` at load time because Svelte hasn't rendered yet — Svelte components patch the relevant refs in `onMount` (e.g., `dom.stampEditorContainer = containerRef`). Always guard with null checks before using `dom.*` references in vanilla JS.

### App Mount and Portal Pattern

`src/main.js` is the entry point. It mounts `App.svelte` to `#root`.

`App.svelte` portals all panels and dialogs into `.page` (a sibling element in `index.html`, outside `#root`) using a `use:portal` action. This is intentional — `.page` is the positioning parent for draggable panels and must sit alongside the canvas stack in the DOM hierarchy.

### Canvas Stack

`index.html` declares 5 canvas layers (background, cursor, selection-gui, resize-overlay, vector-gui) that sit inside `.page`. The `src/Canvas/` module handles drawing contexts; `src/Context/canvas.js` manages the layer objects.

### Testing

Tests are in `tests/`. Vitest runs in `node` environment. Any test that imports modules touching the DOM (particularly `dom.js` or `tools/index.js`) requires vi.mock():

```js
vi.mock("../src/Context/dom.js", () => ({ dom: { vectorTransformUIContainer: { style: {} } } }))
vi.mock("../src/Tools/index.js", () => ({ tools: { ... } }))
```

`src/hooks/appState.svelte.js` uses Svelte runes (`$state`) and cannot be imported in the test environment directly — mock it when needed.

### ESLint

`.eslintrc.js` uses `module.exports` (CJS) — do not convert it to ESM.
