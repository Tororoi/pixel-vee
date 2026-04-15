/**
 * Svelte action: moves a DOM node into a different target element.
 * Use on a wrapper div with style="display:contents" to portal components.
 *
 * Usage:
 * <div use:portal={document.querySelector('.page')} style="display:contents">
 * <MyComponent />
 * </div>
 * @param {HTMLElement} node - The DOM node to move
 * @param {HTMLElement} [target] - Destination element (defaults to document.body)
 * @returns {{ update: Function, destroy: Function }} Svelte action object
 */
export function portal(node, target = document.body) {
  target.appendChild(node)
  return {
    update(newTarget) {
      newTarget.appendChild(node)
    },
    destroy() {
      node.remove()
    },
  }
}
