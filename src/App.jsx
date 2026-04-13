import ReactDOM from 'react-dom'
import NavBar from './components/NavBar.jsx'
import Toolbox from './components/Toolbox.jsx'
import Sidebar from './components/Sidebar.jsx'
import SettingsDialog from './components/dialogs/SettingsDialog.jsx'
import CanvasSizeDialog from './components/dialogs/CanvasSizeDialog.jsx'
import SaveDialog from './components/dialogs/SaveDialog.jsx'
import ExportDialog from './components/dialogs/ExportDialog.jsx'
import VectorTransformDialog from './components/dialogs/VectorTransformDialog.jsx'
import ColorPickerDialog from './components/dialogs/ColorPickerDialog.jsx'
import DitherPickerDialog from './components/dialogs/DitherPickerDialog.jsx'
import StampEditorDialog from './components/dialogs/StampEditorDialog.jsx'

export default function App() {
  // The .page div (canvas positioning context) lives in index.html outside #root.
  // We portal all absolutely-positioned panels into it so they share the same
  // positioning parent as the canvas stack.
  const pageEl = document.querySelector('.page')

  return (
    <>
      <NavBar />
      {pageEl && ReactDOM.createPortal(
        <>
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
        </>,
        pageEl
      )}
    </>
  )
}
