import React, { useEffect, useRef } from 'react'
import { dom } from '../../Context/dom.js'
import { initializeDragger } from '../../utils/drag.js'
import { initStampEditor } from '../../DOM/stampEditor.js'

export default function StampEditorDialog() {
  const containerRef = useRef(null)
  const editorCanvasRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const applyBtnRef = useRef(null)
  const clearBtnRef = useRef(null)
  const drawBtnRef = useRef(null)
  const eraseBtnRef = useRef(null)
  const moveBtnRef = useRef(null)
  const mirrorHBtnRef = useRef(null)
  const mirrorVBtnRef = useRef(null)

  useEffect(() => {
    // Patch dom references — dom.js queried these at module load before React rendered
    dom.stampEditorContainer = containerRef.current
    dom.stampEditorCanvas = editorCanvasRef.current
    dom.stampPreviewCanvas = previewCanvasRef.current
    dom.stampEditorApplyBtn = applyBtnRef.current
    dom.stampEditorClearBtn = clearBtnRef.current
    dom.stampDrawBtn = drawBtnRef.current
    dom.stampEraseBtn = eraseBtnRef.current
    dom.stampMoveBtn = moveBtnRef.current
    dom.stampMirrorHBtn = mirrorHBtnRef.current
    dom.stampMirrorVBtn = mirrorVBtnRef.current

    initializeDragger(containerRef.current)
    initStampEditor()
  }, [])

  return (
    <div
      ref={containerRef}
      id="stamp-editor"
      className="stamp-editor-container draggable"
    >
      <div className="header dragger">
        <div className="drag-btn"><div className="grip"></div></div>
        Stamp Editor
      </div>
      <div className="stamp-editor-interface">
        <div className="stamp-editor-tools">
          <div className="stamp-tool-group">
            <button
              ref={drawBtnRef}
              id="stamp-draw-btn"
              type="button"
              className="stamp-tool selected"
              aria-label="Draw"
              data-tooltip="Draw"
            />
            <button
              ref={eraseBtnRef}
              id="stamp-erase-btn"
              type="button"
              className="stamp-tool"
              aria-label="Erase"
              data-tooltip="Erase"
            />
            <button
              ref={moveBtnRef}
              id="stamp-move-btn"
              type="button"
              className="stamp-tool"
              aria-label="Move"
              data-tooltip="Move"
            />
          </div>
          <div className="stamp-tool-group">
            <button
              ref={mirrorHBtnRef}
              id="stamp-mirror-h-btn"
              type="button"
              className="stamp-tool"
              aria-label="Mirror Horizontal"
              data-tooltip="Mirror Horizontal"
            />
            <button
              ref={mirrorVBtnRef}
              id="stamp-mirror-v-btn"
              type="button"
              className="stamp-tool"
              aria-label="Mirror Vertical"
              data-tooltip="Mirror Vertical"
            />
          </div>
        </div>
        <canvas
          ref={editorCanvasRef}
          id="stamp-editor-canvas"
          width="320"
          height="320"
        />
        <div className="stamp-editor-footer">
          <div className="stamp-editor-preview-col">
            <canvas
              ref={previewCanvasRef}
              id="stamp-preview-canvas"
              width="32"
              height="32"
            />
            <button
              ref={applyBtnRef}
              id="stamp-editor-apply-btn"
              type="button"
            >
              Apply
            </button>
          </div>
          <button
            ref={clearBtnRef}
            id="stamp-editor-clear-btn"
            type="button"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
