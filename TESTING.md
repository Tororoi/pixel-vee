# Testing

## Running tests

```bash
# Single run (CI / verify before committing)
npm test

# Watch mode (re-runs on file save during development)
npm run test:watch
```

Tests use [Vitest](https://vitest.dev). No browser is required — tests run in Node with DOM dependencies mocked out.

---

## Test file location and naming

```
tests/
  state.test.js        # state domain methods and setters
  <topic>.test.js      # add new files per logical group
```

Place test files in `tests/` at the project root. Name them `<topic>.test.js`.

---

## How to write a new test file

### 1. Mock browser-dependent modules first

`state.js` imports `dom.js` and `Tools/index.js`, which both reference browser globals at module evaluation time. Mock them **before** importing anything that depends on them. Vitest hoists `vi.mock()` calls automatically.

```js
import { describe, it, expect, beforeEach, vi } from "vitest"

// These mocks are hoisted — they intercept imports in all downstream modules
vi.mock("../src/Context/dom.js", () => ({
  dom: {
    vectorTransformUIContainer: { style: { display: "" } },
    // Add any other dom properties your code under test touches
  },
}))

vi.mock("../src/Tools/index.js", () => ({
  tools: {
    brush: { name: "brush", type: "raster" },
    line:  { name: "line",  type: "vector" },
    // Add entries for any tool names referenced in the code under test
  },
}))

// Imports come after mocks
import { state, registerDOMHelpers, registerVectorGui } from "../src/Context/state.js"
```

If your test file does not import `state.js` (e.g. you're testing a pure utility), you may not need any mocks at all.

### 2. Reset state between tests

`state` is a singleton — mutations in one test bleed into the next. Use `beforeEach` to restore a known baseline:

```js
beforeEach(() => {
  // Reset only the domains your tests touch
  state.selection.resetProperties()
  state.selection.resetBoundaryBox()
  state.vector.setCurrentIndex(null)
  state.vector.clearSelected()
  state.vector.highestKey = 0
  state.timeline.clearPoints()
})
```

### 3. Test registered callbacks with `vi.fn()`

`registerDOMHelpers` and `registerVectorGui` inject callbacks into `state.js`. Use mocks to verify they fire:

```js
it("calls enableActionsForSelection when coords are valid", () => {
  const enableFn = vi.fn()
  registerDOMHelpers({
    disableActionsForNoSelection: vi.fn(),
    enableActionsForSelection: enableFn,
  })

  state.selection.setBoundaryBox({ px1: 0, py1: 0, px2: 10, py2: 10 })

  expect(enableFn).toHaveBeenCalledOnce()
})
```

> **Note:** Registered callbacks persist across tests within a file because `state.js` is a module singleton. If you register a mock in one test, it remains registered for subsequent tests unless you re-register. Call `registerDOMHelpers` / `registerVectorGui` inside the specific `it()` block where you need it rather than in `beforeEach`, or re-register a fresh mock each time.

---

## What to test

**Good candidates:**

| Target | Why |
|---|---|
| `state.selection` methods | Pure coordinate math with clear inputs and outputs |
| `state.vector` setters | Simple mutations with a defined contract |
| `state.timeline` setters | Array operations with no side effects |
| `state.deselect()` | Cross-domain reset — exercises the injection pattern |
| Pure utility functions in `src/utils/` | No DOM, no state — easiest to test |
| Save/load round-trips (`src/Save/savefile.js`) | High value, catches regressions in serialization |
| Undo/redo logic in `addToTimeline` | Command pattern correctness is critical |

**Avoid testing:**

- Rendering functions (`renderCanvas`, `vectorGui.render`, etc.) — they depend on canvas context and the visual output; test their inputs/outputs instead
- Pointer event handlers directly — test the state mutations they cause, not the event wiring
- DOM structure — that belongs in end-to-end tests, not unit tests

---

## Requirements when writing new tests

1. **Each `it()` tests one behavior** — if the description needs "and", split it into two tests.

2. **`beforeEach` resets state** — never rely on test execution order.

3. **Mock only what you need** — if a module doesn't touch the DOM, don't mock it; let the real code run.

4. **Add mock entries for any new tools** — if `state.clearRedoStack()` or similar iterates over `tools[action.tool]`, the mock `tools` object must include every tool name that appears in test data.

5. **Prefer `toEqual` over `toBe` for objects** — `toBe` checks reference equality; `toEqual` checks deep value equality.

6. **Test the contract, not the implementation** — test what a method does (its observable effect on state), not how it does it internally.
