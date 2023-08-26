//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGuiState = {
  px1: null,
  py1: null,
  px2: null,
  py2: null,
  px3: null,
  py3: null,
  px4: null,
  py4: null,
}
//helper function. TODO: move to graphics helper file
function drawCirclePath(canvas, x, y, r) {
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + x + 0.5 + r,
    canvas.yOffset + y + 0.5
  )
  canvas.vectorGuiCTX.arc(
    canvas.xOffset + x + 0.5,
    canvas.yOffset + y + 0.5,
    r,
    0,
    2 * Math.PI
  )
}

//helper function. TODO: move to graphics helper file
function drawControlPointHandle(canvas, x1, y1, x2, y2) {
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + x1 + 0.5,
    canvas.yOffset + y1 + 0.5
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + x2 + 0.5,
    canvas.yOffset + y2 + 0.5
  )
}

export function resetVectorGUI(canvas) {
  vectorGuiState.px1 = null
  vectorGuiState.py1 = null
  vectorGuiState.px2 = null
  vectorGuiState.py2 = null
  vectorGuiState.px3 = null
  vectorGuiState.py3 = null
  vectorGuiState.px4 = null
  vectorGuiState.py4 = null
  canvas.vectorGuiCTX.clearRect(
    0,
    0,
    canvas.vectorGuiCVS.width / canvas.zoom,
    canvas.vectorGuiCVS.height / canvas.zoom
  )
}

export function renderVectorGUI(state, canvas, swatches) {
  canvas.vectorGuiCTX.clearRect(
    0,
    0,
    canvas.vectorGuiCVS.width / canvas.zoom,
    canvas.vectorGuiCVS.height / canvas.zoom
  )
  if (state.vectorMode) {
    //Prevent blurring
    canvas.vectorGuiCTX.imageSmoothingEnabled = false
    renderVector(state, canvas, vectorGuiState)
  }
}

function renderVector(state, canvas, vectorGuiState) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + vectorGuiState.px1 + 0.5,
    canvas.yOffset + vectorGuiState.py1 + 0.5
  )

  if (vectorGuiState.px4) {
    canvas.vectorGuiCTX.bezierCurveTo(
      canvas.xOffset + vectorGuiState.px3 + 0.5,
      canvas.yOffset + vectorGuiState.py3 + 0.5,
      canvas.xOffset + vectorGuiState.px4 + 0.5,
      canvas.yOffset + vectorGuiState.py4 + 0.5,
      canvas.xOffset + vectorGuiState.px2 + 0.5,
      canvas.yOffset + vectorGuiState.py2 + 0.5
    )
    drawControlPointHandle(
      canvas,
      vectorGuiState.px1,
      vectorGuiState.py1,
      vectorGuiState.px3,
      vectorGuiState.py3
    )
    drawControlPointHandle(
      canvas,
      vectorGuiState.px2,
      vectorGuiState.py2,
      vectorGuiState.px4,
      vectorGuiState.py4
    )
  } else if (vectorGuiState.px3) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      canvas.xOffset + vectorGuiState.px3 + 0.5,
      canvas.yOffset + vectorGuiState.py3 + 0.5,
      canvas.xOffset + vectorGuiState.px2 + 0.5,
      canvas.yOffset + vectorGuiState.py2 + 0.5
    )
    drawControlPointHandle(
      canvas,
      vectorGuiState.px1,
      vectorGuiState.py1,
      vectorGuiState.px3,
      vectorGuiState.py3
    )
  } else if (vectorGuiState.px2) {
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + vectorGuiState.px2 + 0.5,
      canvas.yOffset + vectorGuiState.py2 + 0.5
    )
  }

  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  let points = [
    { x: vectorGuiState.px1, y: vectorGuiState.py1 },
    { x: vectorGuiState.px2, y: vectorGuiState.py2 },
    { x: vectorGuiState.px3, y: vectorGuiState.py3 },
    { x: vectorGuiState.px4, y: vectorGuiState.py4 },
  ]

  drawControlPoints(points, canvas, circleRadius)

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(points, canvas, circleRadius / 2)
  // Fill points
  canvas.vectorGuiCTX.fill()
  convertCanvasTo1BitWebGL(canvas.vectorGuiCVS)
}

function convertCanvasTo1BitWebGL(canvas, threshold = 128.0) {
  const gl = canvas.getContext("webgl", {
    failIfMajorPerformanceCaveat: true,
    contextCreationError: function (info) {
      console.log("Could not create WebGL context: " + info.statusMessage)
    },
  })

  if (!gl) {
    console.log(
      "WebGL not supported or failed to get WebGL context.",
      window.WebGLRenderingContext
    )
    return
  }

  // Vertex Shader
  const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;
        varying highp vec2 vTextureCoord;
        void main(void) {
            gl_Position = aVertexPosition;
            vTextureCoord = aTextureCoord;
        }
    `

  // Fragment Shader for 1-bit conversion
  const fsSource = `
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float uThreshold;
        void main(void) {
            highp vec4 texel = texture2D(uSampler, vTextureCoord);
            float grayscale = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
            float binaryColor = grayscale < uThreshold / 255.0 ? 0.0 : 1.0;
            gl_FragColor = vec4(vec3(binaryColor), 1.0);
        }
    `

  // Compile shader utility
  function compileShader(source, type) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(
        `An error occurred compiling the shaders: ${gl.getShaderInfoLog(
          shader
        )}`
      )
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER)
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    )
  }

  gl.useProgram(shaderProgram)

  // Define the vertices for a rectangle (two triangles)
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  const vertices = new Float32Array([
    -1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  const vertexPosition = gl.getAttribLocation(shaderProgram, "aVertexPosition")
  gl.enableVertexAttribArray(vertexPosition)
  gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0)

  // Texture coordinates
  const texCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
  const textureCoords = new Float32Array([
    0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
  ])
  gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW)
  const textureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord")
  gl.enableVertexAttribArray(textureCoord)
  gl.vertexAttribPointer(textureCoord, 2, gl.FLOAT, false, 0, 0)

  // Create texture
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // Set the threshold uniform
  const thresholdUniform = gl.getUniformLocation(shaderProgram, "uThreshold")
  gl.uniform1f(thresholdUniform, threshold)

  // Draw
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function drawControlPoints(points, canvas, radius) {
  points.forEach((point) => {
    if (point.x && point.y) {
      drawCirclePath(canvas, point.x, point.y, radius)
    }
  })
}

/**
 * Used to render eyedropper cursor
 * @param {*} state
 * @param {*} canvas
 */
export function drawCursorBox(state, canvas) {
  let lineWidth = canvas.zoom <= 8 ? 2 / canvas.zoom : 0.25
  console.log(lineWidth, canvas.zoom)
  let brushOffset = Math.floor(state.tool.brushSize / 2)
  let x0 = state.onscreenX - brushOffset
  let y0 = state.onscreenY - brushOffset
  let x1 = x0 + state.tool.brushSize
  let y1 = y0 + state.tool.brushSize
  //line offset to stroke offcenter;
  let ol = lineWidth / 2
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  //top
  canvas.vectorGuiCTX.moveTo(x0, y0 - ol)
  canvas.vectorGuiCTX.lineTo(x1, y0 - ol)
  //right
  canvas.vectorGuiCTX.moveTo(x1 + ol, y0)
  canvas.vectorGuiCTX.lineTo(x1 + ol, y1)
  //bottom
  canvas.vectorGuiCTX.moveTo(x0, y1 + ol)
  canvas.vectorGuiCTX.lineTo(x1, y1 + ol)
  //left
  canvas.vectorGuiCTX.moveTo(x0 - ol, y0)
  canvas.vectorGuiCTX.lineTo(x0 - ol, y1)

  canvas.vectorGuiCTX.stroke()
}
