// Reactive cross-component state for the dither picker's active vector target.
let _ditherVectorTarget = $state.raw(null)
export const getDitherVectorTarget = () => _ditherVectorTarget
export const setDitherVectorTarget = (v) => {
  _ditherVectorTarget = v
}
