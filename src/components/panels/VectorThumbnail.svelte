<script>
  import { getVersion } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { canvas } from '../../Context/canvas.js'
  import { getAngle } from '../../utils/trig.js'

  const { vector } = $props()

  let ref = $state(null)

  $effect(() => {
    getVersion()
    const cvs = ref
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    const isSelected =
      vector.index === globalState.vector.currentIndex ||
      globalState.vector.selectedIndices.has(vector.index)

    const border = 32
    const wd =
      canvas.thumbnailCVS.width /
      canvas.sharpness /
      (canvas.offScreenCVS.width + border)
    const hd =
      canvas.thumbnailCVS.height /
      canvas.sharpness /
      (canvas.offScreenCVS.height + border)
    const minD = Math.min(wd, hd)
    const xOffset =
      (canvas.thumbnailCVS.width / 2 -
        (minD * canvas.offScreenCVS.width * canvas.sharpness) / 2) /
      canvas.sharpness
    const yOffset =
      (canvas.thumbnailCVS.height / 2 -
        (minD * canvas.offScreenCVS.height * canvas.sharpness) / 2) /
      canvas.sharpness

    ctx.setTransform(canvas.sharpness, 0, 0, canvas.sharpness, 0, 0)
    ctx.clearRect(0, 0, canvas.thumbnailCVS.width, canvas.thumbnailCVS.height)
    ctx.lineWidth = 3
    ctx.fillStyle = isSelected ? 'rgb(0, 0, 0)' : 'rgb(51, 51, 51)'
    ctx.fillRect(0, 0, canvas.thumbnailCVS.width, canvas.thumbnailCVS.height)
    ctx.clearRect(
      xOffset,
      yOffset,
      minD * canvas.offScreenCVS.width,
      minD * canvas.offScreenCVS.height,
    )

    ctx.strokeStyle = 'black'
    ctx.beginPath()

    const vp = vector.vectorProperties
    const ox = (vector.layer?.x ?? 0) + globalState.canvas.cropOffsetX
    const oy = (vector.layer?.y ?? 0) + globalState.canvas.cropOffsetY
    const px1 = minD * (vp.px1 + ox)
    const py1 = minD * (vp.py1 + oy)
    const px2 = minD * (vp.px2 + ox)
    const py2 = minD * (vp.py2 + oy)
    const px3 = minD * (vp.px3 + ox)
    const py3 = minD * (vp.py3 + oy)
    const px4 = minD * (vp.px4 + ox)
    const py4 = minD * (vp.py4 + oy)

    switch (vp.tool) {
      case 'fill':
        ctx.arc(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset, 1, 0, 2 * Math.PI, true)
        break
      case 'curve': {
        const modes = vector.modes ?? {}
        ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
        if (modes.cubicCurve) {
          ctx.bezierCurveTo(
            px3 + 0.5 + xOffset,
            py3 + 0.5 + yOffset,
            px4 + 0.5 + xOffset,
            py4 + 0.5 + yOffset,
            px2 + 0.5 + xOffset,
            py2 + 0.5 + yOffset,
          )
        } else if (modes.quadCurve) {
          ctx.quadraticCurveTo(
            px3 + 0.5 + xOffset,
            py3 + 0.5 + yOffset,
            px2 + 0.5 + xOffset,
            py2 + 0.5 + yOffset,
          )
        } else {
          ctx.lineTo(px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
        }
        break
      }
      case 'ellipse': {
        const ltx = minD * (vp.leftTangentX + ox) + xOffset
        const lty = minD * (vp.leftTangentY + oy) + yOffset
        const rtx = minD * (vp.rightTangentX + ox) + xOffset
        const rty = minD * (vp.rightTangentY + oy) + yOffset
        const ttx = minD * (vp.topTangentX + ox) + xOffset
        const tty = minD * (vp.topTangentY + oy) + yOffset
        const btx = minD * (vp.bottomTangentX + ox) + xOffset
        const bty = minD * (vp.bottomTangentY + oy) + yOffset
        const cx = (ltx + rtx) / 2
        const cy = (tty + bty) / 2
        const radA = Math.sqrt((rtx - ltx) ** 2 + (rty - lty) ** 2) / 2
        const radB = Math.sqrt((btx - ttx) ** 2 + (bty - tty) ** 2) / 2
        const angle = getAngle(rtx - ltx, rty - lty)
        ctx.ellipse(cx, cy, radA, radB, angle, 0, 2 * Math.PI)
        break
      }
      case 'polygon':
        ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
        ctx.lineTo(px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
        ctx.lineTo(px3 + 0.5 + xOffset, py3 + 0.5 + yOffset)
        ctx.lineTo(px4 + 0.5 + xOffset, py4 + 0.5 + yOffset)
        ctx.closePath()
        break
    }

    ctx.globalCompositeOperation = 'xor'
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  })
</script>

<canvas
  bind:this={ref}
  width={canvas.thumbnailCVS.width}
  height={canvas.thumbnailCVS.height}
></canvas>
