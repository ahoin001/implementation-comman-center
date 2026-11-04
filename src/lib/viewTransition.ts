import { flushSync } from 'react-dom'

let pending = false

/** Call before a navigation that uses the View Transition API. */
export function markViewTransition() {
  pending = true
}

export function wasViewTransition() {
  return pending
}

export function settleViewTransition() {
  pending = false
}

function canTransition(reduce?: boolean | null) {
  return !reduce && typeof document.startViewTransition === 'function'
}

/** Morph an in-page state change with the same View Transition path as opening a project. */
export function runViewTransition(update: () => void, reduce?: boolean | null) {
  if (!canTransition(reduce)) {
    update()
    return
  }
  markViewTransition()
  document.startViewTransition(() => {
    flushSync(update)
  })
}

/** Arm a shared-element name, then morph old → new. */
export function runSharedElementTransition(
  arm: () => void,
  update: () => void,
  done: () => void,
  reduce?: boolean | null
) {
  if (!canTransition(reduce)) {
    update()
    return
  }
  flushSync(arm)
  markViewTransition()
  const transition = document.startViewTransition(() => {
    flushSync(update)
  })
  void transition.finished.finally(done)
}
