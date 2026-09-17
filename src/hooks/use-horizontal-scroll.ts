'use client'

import * as React from 'react'

export type ScrollBehavior = 'auto' | 'smooth'

export interface ScrollToOptions {
  left?: number
  top?: number
  behavior?: ScrollBehavior
}

export interface UseHorizontalScrollOptions {
  /** Enable horizontal scrolling with mouse wheel */
  enabled?: boolean
  /** Scroll behavior for smooth animations */
  behavior?: ScrollBehavior
  /** Throttle scroll events in milliseconds */
  throttleMs?: number
}

export interface UseHorizontalScrollReturn<T extends HTMLElement = HTMLElement> {
  /** Ref to attach to the scrollable element */
  ref: React.RefCallback<T | null>
  /** Scroll to specific position */
  scrollTo: (options: ScrollToOptions) => void
  /** Scroll by specific amount */
  scrollBy: (options: ScrollToOptions) => void
  /** Check if element is scrollable */
  isScrollable: boolean
}

/**
 * Tolerance in pixels to absorb fractional subpixel rendering differences
 */
const SCROLL_TOLERANCE_PX = 1

/**
 * Checks whether an element or any of its ancestors (up to container)
 * can scroll vertically in the direction indicated by deltaY.
 */
export function canScrollVertically(
  target: EventTarget | null,
  container: HTMLElement,
  deltaY: number
): boolean {
  if (!target || !(target instanceof HTMLElement) || deltaY === 0) {
    return false
  }

  let current: HTMLElement | null = target

  while (current && current !== container) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY

    if (overflowY === 'auto' || overflowY === 'scroll') {
      const { scrollTop, scrollHeight, clientHeight } = current
      const maxScrollTop = scrollHeight - clientHeight

      if (maxScrollTop > SCROLL_TOLERANCE_PX) {
        if (deltaY < 0 && scrollTop > SCROLL_TOLERANCE_PX) {
          // Can scroll upward
          return true
        }
        if (deltaY > 0 && scrollTop < maxScrollTop - SCROLL_TOLERANCE_PX) {
          // Can scroll downward
          return true
        }
      }
    }

    current = current.parentElement
  }

  return false
}

/**
 * Checks whether the container can scroll horizontally in the direction indicated by delta.
 */
export function canScrollHorizontally(container: HTMLElement, delta: number): boolean {
  if (delta === 0) return false

  const { scrollLeft, scrollWidth, clientWidth } = container
  const maxScrollLeft = scrollWidth - clientWidth

  if (maxScrollLeft <= SCROLL_TOLERANCE_PX) {
    return false
  }

  if (delta < 0 && scrollLeft > SCROLL_TOLERANCE_PX) {
    return true
  }

  if (delta > 0 && scrollLeft < maxScrollLeft - SCROLL_TOLERANCE_PX) {
    return true
  }

  return false
}

/**
 * Enhanced horizontal scrolling hook that preserves native scrolling behavior
 *
 * This hook only converts vertical wheel events to horizontal scrolling when:
 * - The element is horizontally scrollable
 * - The user is using a vertical-only scroll device (regular mouse wheel)
 * - Native horizontal scrolling is not already supported
 *
 * Native horizontal scrolling (touchpad, mouse with horizontal wheel) is preserved.
 */
export function useHorizontalScroll<T extends HTMLElement>(
  options: UseHorizontalScrollOptions = {}
): UseHorizontalScrollReturn<T> {
  const { enabled = true, behavior = 'auto' } = options

  const ref = React.useRef<T>(null)
  const [isScrollable, setIsScrollable] = React.useState(false)

  // Store the current element to trigger useEffect when it changes
  const [element, setElement] = React.useState<T | null>(null)

  // Gesture lock: persists horizontal scrolling across consecutive wheel ticks
  // to prevent cursor drift over adjacent columns from terminating horizontal navigation.
  const isHorizontalGestureActiveRef = React.useRef(false)
  const gestureTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Callback ref to update element state when ref changes
  const callbackRef = React.useCallback((node: T | null) => {
    ref.current = node
    setElement(node)
  }, [])

  // Check if element is horizontally scrollable
  const checkScrollable = React.useCallback(() => {
    const element = ref.current
    if (!element) return false

    return element.scrollWidth > element.clientWidth
  }, [])

  // Enhanced wheel event handler that preserves native horizontal scrolling,
  // respects nested vertical column scrolling, and maintains gesture intent across ticks.
  const handleWheel = React.useCallback(
    (event: WheelEvent) => {
      if (!enabled || !ref.current) return

      // 1. Don't interfere with native horizontal scrolling (trackpad deltaX or Shift+Wheel)
      if (event.deltaX !== 0 || event.shiftKey) {
        // Any real horizontal trackpad activity resets the synthetic gesture lock
        if (gestureTimeoutRef.current) {
          clearTimeout(gestureTimeoutRef.current)
          gestureTimeoutRef.current = null
        }
        isHorizontalGestureActiveRef.current = false
        return
      }

      // 2. Only handle pure vertical wheel events
      if (event.deltaY === 0) return

      const container = ref.current

      // 3. If a horizontal gesture lock is already active, maintain horizontal intent
      // even if the board's physical movement slid an adjacent column card under the stationary cursor!
      if (isHorizontalGestureActiveRef.current) {
        // Verify board still has room to move in the requested deltaY direction
        if (canScrollHorizontally(container, event.deltaY)) {
          event.preventDefault()
          container.scrollLeft += event.deltaY

          // Refresh gesture timeout
          if (gestureTimeoutRef.current) {
            clearTimeout(gestureTimeoutRef.current)
          }
          gestureTimeoutRef.current = setTimeout(() => {
            isHorizontalGestureActiveRef.current = false
            gestureTimeoutRef.current = null
          }, 200)
          return
        } else {
          // Reached true horizontal boundary of the board; unlock and let outer page scroll naturally
          if (gestureTimeoutRef.current) {
            clearTimeout(gestureTimeoutRef.current)
            gestureTimeoutRef.current = null
          }
          isHorizontalGestureActiveRef.current = false
          return
        }
      }

      // 4. Initial Tick - Priority 1: If target or any descendant ancestor can scroll vertically in deltaY direction,
      // allow native vertical scrolling (do NOT preventDefault, do NOT modify scrollLeft)
      if (canScrollVertically(event.target, container, event.deltaY)) {
        return
      }

      // 5. Initial Tick - Priority 2 & 3: Target reached vertical boundary or is over neutral space.
      // Check if horizontal movement is possible in deltaY direction.
      if (!canScrollHorizontally(container, event.deltaY)) {
        // Board cannot scroll horizontally in this direction; do not prevent default,
        // allow standard outer page scroll behavior.
        return
      }

      // 6. Convert deltaY to horizontal scrollLeft and establish horizontal gesture lock
      event.preventDefault()
      container.scrollLeft += event.deltaY

      isHorizontalGestureActiveRef.current = true
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current)
      }
      gestureTimeoutRef.current = setTimeout(() => {
        isHorizontalGestureActiveRef.current = false
        gestureTimeoutRef.current = null
      }, 200)
    },
    [enabled]
  )

  // Scroll to specific position
  const scrollTo = React.useCallback(
    (options: ScrollToOptions) => {
      if (!ref.current) return

      ref.current.scrollTo({
        ...options,
        behavior,
      })
    },
    [behavior]
  )

  // Scroll by specific amount
  const scrollBy = React.useCallback(
    (options: ScrollToOptions) => {
      if (!ref.current) return

      ref.current.scrollBy({
        ...options,
        behavior,
      })
    },
    [behavior]
  )

  // Set up event listeners with passive: false only when needed
  React.useEffect(() => {
    if (!element || !enabled) return

    // Check if element is scrollable
    setIsScrollable(checkScrollable())

    // Add wheel event listener - we need passive: false to preventDefault
    // But only when we actually need to intervene
    element.addEventListener('wheel', handleWheel, { passive: false })

    // Add resize observer to check scrollability on resize
    const resizeObserver = new ResizeObserver(() => {
      setIsScrollable(checkScrollable())
    })

    resizeObserver.observe(element)

    // Cleanup
    return () => {
      element.removeEventListener('wheel', handleWheel)
      resizeObserver.disconnect()
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current)
        gestureTimeoutRef.current = null
      }
      isHorizontalGestureActiveRef.current = false
    }
  }, [element, enabled, handleWheel, checkScrollable])

  return {
    ref: callbackRef,
    scrollTo,
    scrollBy,
    isScrollable,
  }
}
