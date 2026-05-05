export function createScript(name = 'untitled', canvasWidth = null, canvasHeight = null) {
  return { version: '1.0', name, canvasWidth, canvasHeight, actions: [] }
}

export function loadScript(json) {
  const script = typeof json === 'string' ? JSON.parse(json) : json
  if (!script.version || !Array.isArray(script.actions)) {
    throw new Error('Invalid navigator script format')
  }
  return script
}

export function saveScript(script) {
  const json = JSON.stringify(script, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${script.name}.nav.json`
  a.click()
  URL.revokeObjectURL(url)
}
