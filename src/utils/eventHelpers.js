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
