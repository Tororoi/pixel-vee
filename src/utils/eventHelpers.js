/**
 * @param {Function} fn - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(fn, wait) {
  let timeout

  return function (...args) {
    const context = this

    clearTimeout(timeout)

    timeout = setTimeout(() => {
      fn.apply(context, args)
    }, wait)
  }
}

/**
 * @param {Function} fn - The function to throttle
 * @param {number} limit - The time to wait in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(fn, limit) {
  let inThrottle
  let lastFunc
  let lastRan

  return function (...args) {
    const context = this

    if (!inThrottle) {
      fn.apply(context, args)
      lastRan = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          fn.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}
