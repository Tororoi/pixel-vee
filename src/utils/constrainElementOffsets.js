export function constrainElementOffsets(target) {
  let pRect = target.parentElement.getBoundingClientRect()
  let tgtRect = target.getBoundingClientRect()
  //Constrain draggable element inside window, include box shadow border
  if (tgtRect.left - 2 < pRect.left) target.style.left = 0 + "px"
  if (tgtRect.top - 2 < pRect.top) target.style.top = 0 + "px"
  if (tgtRect.right + 2 > pRect.right)
    target.style.left = pRect.width - tgtRect.width - 4 + "px"
  if (tgtRect.bottom + 2 > pRect.bottom) {
    target.style.top = pRect.height - tgtRect.height - 4 + "px"
  }
}
