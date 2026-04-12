import React, { useEffect } from 'react'
import { useAppState } from '../../hooks/useAppState.js'
import { initializeDragger } from '../../utils/drag.js'

/**
 * StampEditorDialog — React wrapper around the stamp editor.
 *
 * The stamp editor uses canvas-based drawing (dom.stampEditorCanvas) and is
 * initialized by openStampEditor() in DOM/stampEditor.js. This component is
 * a placeholder for the future full-React migration.
 */
export default function StampEditorDialog() {
  useAppState()

  useEffect(() => {
    const el = document.getElementById('stamp-editor')
    if (el && !el.dataset.dragInitialized) {
      initializeDragger(el)
    }
  }, [])

  // Managed by legacy DOM and BrushPanel's handleStampBtnClick for now.
  return null
}
