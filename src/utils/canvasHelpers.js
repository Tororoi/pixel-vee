/**
 *
 * @param {Integer} width
 * @returns
 */
export const setInitialZoom = (width) => {
  const ratio = 256 / width
  switch (true) {
    case ratio >= 8:
      return 16
    case ratio >= 4:
      return 8
    case ratio >= 2:
      return 4
    case ratio >= 1:
      return 2
    case ratio >= 0.5:
      return 1
    default:
      return 0.5
  }
}
