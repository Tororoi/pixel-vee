import { useEffect, useRef } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { switchVectorTransformMode } from '../../GUI/events.js'
import { setVectorShapeBoundaryBox } from '../../GUI/transform.js'
import { actionDeselect } from '../../Actions/nonPointer/selectionActions.js'
import { TRANSLATE, ROTATE, SCALE } from '../../utils/constants.js'
import { initializeDragger } from '../../utils/drag.js'

export default function VectorTransformDialog() {
  useAppState()
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  function handleClose() {
    actionDeselect()
    bump()
  }

  function handleTranslate() {
    state.selection.resetProperties()
    state.selection.resetBoundaryBox()
    switchVectorTransformMode(TRANSLATE)
  }

  function handleRotate() {
    state.selection.resetProperties()
    state.selection.resetBoundaryBox()
    switchVectorTransformMode(ROTATE)
  }

  function handleScale() {
    setVectorShapeBoundaryBox()
    switchVectorTransformMode(SCALE)
  }

  const mode = state.vector.transformMode

  return (
    <div
      ref={ref}
      className="vector-transform-ui-container dialog-box v-drag h-drag free"
      style={{ display: state.ui.vectorTransformOpen ? 'flex' : 'none' }}
    >
      <div id="vector-transform-ui-header" className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        <span>Transform</span>
        <button
          type="button"
          className="close-btn"
          data-tooltip="Close"
          onClick={handleClose}
        ></button>
      </div>
      <div className="collapsible">
        <div
          id="vector-transform-ui-interface"
          className="vector-transform-ui-interface"
        >
          <div className="vector-transform-modes">
            <button
              type="button"
              className={`transform-mode tool move custom-shape${mode === TRANSLATE ? ' selected' : ''}`}
              id="translate"
              aria-label="Translate"
              data-tooltip="Translate"
              onClick={handleTranslate}
            ></button>
            <button
              type="button"
              className={`transform-mode tool rotate custom-shape${mode === ROTATE ? ' selected' : ''}`}
              id="rotate"
              aria-label="Rotate"
              data-tooltip="Rotate"
              onClick={handleRotate}
            ></button>
            <button
              type="button"
              className={`transform-mode tool scale custom-shape${mode === SCALE ? ' selected' : ''}`}
              id="scale"
              aria-label="Scale"
              data-tooltip="Scale"
              onClick={handleScale}
            ></button>
          </div>
        </div>
      </div>
    </div>
  )
}
