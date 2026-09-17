import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useHorizontalScroll } from '../use-horizontal-scroll'

// Partial WheelEvent interface for testing
interface MockWheelEvent {
  deltaY: number
  deltaX?: number
  preventDefault: ReturnType<typeof vi.fn>
}

describe('useHorizontalScroll', () => {
  let mockElement: HTMLElement
  let mockResizeObserver: {
    observe: ReturnType<typeof vi.fn>
    unobserve: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a mock ResizeObserver
    mockResizeObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }
    global.ResizeObserver = vi.fn().mockImplementation(() => mockResizeObserver)

    // Create a mock element with scroll properties
    mockElement = {
      scrollWidth: 800,
      clientWidth: 400,
      scrollLeft: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      scrollBy: vi.fn(),
    } as HTMLElement & {
      addEventListener: ReturnType<typeof vi.fn>
      removeEventListener: ReturnType<typeof vi.fn>
      scrollTo: ReturnType<typeof vi.fn>
      scrollBy: ReturnType<typeof vi.fn>
    }
  })

  it('should return correct initial state', () => {
    const { result } = renderHook(() => useHorizontalScroll())

    expect(result.current.isScrollable).toBe(false)
    expect(typeof result.current.ref).toBe('function')
    expect(typeof result.current.scrollTo).toBe('function')
    expect(typeof result.current.scrollBy).toBe('function')
  })

  it('should detect when element is horizontally scrollable', () => {
    const { result } = renderHook(() => useHorizontalScroll())

    // Simulate element being assigned to callback ref
    act(() => {
      result.current.ref(mockElement)
    })

    // The hook should detect scrollability and set up event listeners
    expect(mockElement.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      passive: false,
    })
    expect(mockResizeObserver.observe).toHaveBeenCalledWith(mockElement)
  })

  it('should not add event listeners when disabled', () => {
    const { result } = renderHook(() => useHorizontalScroll({ enabled: false }))

    act(() => {
      result.current.ref(mockElement)
    })

    expect(mockElement.addEventListener).not.toHaveBeenCalled()
    expect(mockResizeObserver.observe).not.toHaveBeenCalled()
  })

  it('should call scrollTo with correct options', () => {
    const { result } = renderHook(() => useHorizontalScroll({ behavior: 'auto' }))

    // First assign the element to the ref
    act(() => {
      result.current.ref(mockElement)
    })

    // Then call scrollTo
    act(() => {
      result.current.scrollTo({ left: 100, top: 0 })
    })

    expect(mockElement.scrollTo).toHaveBeenCalledWith({
      left: 100,
      top: 0,
      behavior: 'auto',
    })
  })

  it('should call scrollBy with correct options', () => {
    const { result } = renderHook(() => useHorizontalScroll())

    // First assign the element to the ref
    act(() => {
      result.current.ref(mockElement)
    })

    // Then call scrollBy
    act(() => {
      result.current.scrollBy({ left: 50, top: 0 })
    })

    expect(mockElement.scrollBy).toHaveBeenCalledWith({
      left: 50,
      top: 0,
      behavior: 'auto',
    })
  })

  it('should handle pure vertical wheel events correctly over neutral area', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: MockWheelEvent) => void) | undefined

    // Mock addEventListener to capture the wheel handler
    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: MockWheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    expect(wheelHandler).toBeDefined()

    // Simulate pure vertical wheel event on container itself (neutral area)
    const wheelEvent = {
      target: mockElement,
      deltaY: 100,
      deltaX: 0, // Pure vertical event
      preventDefault: vi.fn(),
    } as unknown as MockWheelEvent

    act(() => {
      wheelHandler!(wheelEvent)
    })

    // Should prevent default and handle vertical scroll
    expect(wheelEvent.preventDefault).toHaveBeenCalled()
    expect(mockElement.scrollLeft).toBe(100)
  })

  it('should ignore wheel events with no deltaY', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: MockWheelEvent) => void) | undefined

    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: MockWheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    const wheelEvent = {
      target: mockElement,
      deltaY: 0,
      preventDefault: vi.fn(),
    } as unknown as MockWheelEvent

    act(() => {
      wheelHandler!(wheelEvent)
    })

    expect(wheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockElement.scrollTo).not.toHaveBeenCalled()
  })

  it('should cleanup event listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useHorizontalScroll())

    act(() => {
      result.current.ref(mockElement)
    })

    unmount()

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function))
    expect(mockResizeObserver.disconnect).toHaveBeenCalled()
  })

  it('should work with custom throttle setting', () => {
    const { result } = renderHook(() => useHorizontalScroll({ throttleMs: 32 }))

    act(() => {
      result.current.ref(mockElement)
    })

    expect(mockElement.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
      passive: false,
    })
    expect(mockResizeObserver.observe).toHaveBeenCalledWith(mockElement)
  })

  it('should handle non-scrollable elements gracefully', () => {
    const nonScrollableElement = {
      scrollWidth: 400,
      clientWidth: 400, // Same width, not scrollable
      scrollLeft: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      scrollTo: vi.fn(),
      scrollBy: vi.fn(),
    } as unknown as HTMLElement & {
      addEventListener: ReturnType<typeof vi.fn>
      removeEventListener: ReturnType<typeof vi.fn>
      scrollTo: ReturnType<typeof vi.fn>
      scrollBy: ReturnType<typeof vi.fn>
    }

    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: MockWheelEvent) => void) | undefined

    // Mock addEventListener to capture the wheel handler
    nonScrollableElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: MockWheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(nonScrollableElement)
    })

    const wheelEvent = {
      target: nonScrollableElement,
      deltaY: 100,
      preventDefault: vi.fn(),
    } as unknown as MockWheelEvent

    act(() => {
      wheelHandler!(wheelEvent)
    })

    // Should not prevent default or scroll for non-scrollable elements
    expect(wheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(nonScrollableElement.scrollTo).not.toHaveBeenCalled()
  })

  it('should preserve native horizontal scrolling', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: MockWheelEvent) => void) | undefined

    // Mock addEventListener to capture the wheel handler
    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: MockWheelEvent) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    // Simulate horizontal wheel event (touchpad or mouse with horizontal scroll)
    const horizontalWheelEvent = {
      target: mockElement,
      deltaY: 50,
      deltaX: 30, // Has horizontal component - native scrolling
      preventDefault: vi.fn(),
    } as unknown as MockWheelEvent

    act(() => {
      wheelHandler!(horizontalWheelEvent)
    })

    // Should NOT prevent default - let native horizontal scrolling handle it
    expect(horizontalWheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockElement.scrollLeft).toBe(0) // Should remain unchanged
  })

  it('should preserve native Shift + Wheel scrolling', () => {
    const { result } = renderHook(() => useHorizontalScroll())
    let wheelHandler: ((event: any) => void) | undefined

    mockElement.addEventListener = vi.fn((event, handler) => {
      if (event === 'wheel') {
        wheelHandler = handler as (event: any) => void
      }
    })

    act(() => {
      result.current.ref(mockElement)
    })

    const shiftWheelEvent = {
      target: mockElement,
      deltaY: 50,
      deltaX: 0,
      shiftKey: true,
      preventDefault: vi.fn(),
    }

    act(() => {
      wheelHandler!(shiftWheelEvent)
    })

    expect(shiftWheelEvent.preventDefault).not.toHaveBeenCalled()
    expect(mockElement.scrollLeft).toBe(0)
  })

  describe('Nested-Scroll Handoff & Hierarchical Tests', () => {
    let container: HTMLDivElement
    let columnContent: HTMLDivElement
    let childCard: HTMLDivElement
    let wheelHandler: ((event: WheelEvent) => void) | undefined

    beforeEach(() => {
      wheelHandler = undefined
      // Build real DOM hierarchy:
      // container (Kanban) -> columnContent (overflow-y: auto) -> childCard
      container = document.createElement('div')
      Object.defineProperty(container, 'scrollWidth', { value: 1200, configurable: true })
      Object.defineProperty(container, 'clientWidth', { value: 600, configurable: true })
      container.scrollLeft = 200

      columnContent = document.createElement('div')
      columnContent.style.overflowY = 'auto'
      Object.defineProperty(columnContent, 'scrollHeight', { value: 800, configurable: true })
      Object.defineProperty(columnContent, 'clientHeight', { value: 400, configurable: true })
      columnContent.scrollTop = 100 // middle of column: maxScrollTop = 400

      childCard = document.createElement('div')
      columnContent.appendChild(childCard)
      container.appendChild(columnContent)

      // Spies for addEventListener
      container.addEventListener = vi.fn((event, handler, options) => {
        if (event === 'wheel') {
          wheelHandler = handler as (event: WheelEvent) => void
        }
        HTMLDivElement.prototype.addEventListener.call(container, event, handler, options)
      })
    })

    it('Case 1: Vertical scroll downward while column has room -> native vertical scroll, no preventDefault, no scrollLeft change', () => {
      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      expect(wheelHandler).toBeDefined()

      const preventDefault = vi.fn()
      const event = {
        target: childCard,
        deltaY: 50, // scroll down
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(200) // unchanged
    })

    it('Case 2: Vertical scroll upward while column has room -> native vertical scroll, no preventDefault, no scrollLeft change', () => {
      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: childCard,
        deltaY: -50, // scroll up (scrollTop is 100 > 1)
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(200) // unchanged
    })

    it('Case 3: Top boundary -> horizontal left handoff (deltaY < 0 and scrollTop <= 0 and container can scroll left)', () => {
      columnContent.scrollTop = 0 // at top
      container.scrollLeft = 200 // can scroll left

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: childCard,
        deltaY: -60, // scroll up
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(140) // 200 + (-60)
    })

    it('Case 4: Bottom boundary -> horizontal right handoff (deltaY > 0 and scrollTop >= maxScrollTop and container can scroll right)', () => {
      columnContent.scrollTop = 400 // at bottom (scrollHeight 800 - clientHeight 400)
      container.scrollLeft = 200 // can scroll right (maxScrollLeft = 600)

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: childCard,
        deltaY: 60, // scroll down
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(260) // 200 + 60
    })

    it('Case 5: Top boundary + Kanban left boundary -> native behavior, no preventDefault, no scrollLeft change', () => {
      columnContent.scrollTop = 0 // at top
      container.scrollLeft = 0 // board cannot scroll left further

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: childCard,
        deltaY: -50, // scroll up
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(0)
    })

    it('Case 6: Bottom boundary + Kanban right boundary -> native behavior, no preventDefault, no scrollLeft change', () => {
      columnContent.scrollTop = 400 // at bottom
      container.scrollLeft = 600 // maxScrollLeft = 1200 - 600 = 600

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: childCard,
        deltaY: 50, // scroll down
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(600)
    })

    it('Case 7: Neutral board area -> horizontal scroll when container has capacity', () => {
      container.scrollLeft = 200

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: container, // directly on container / neutral margin
        deltaY: 45,
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(245)
    })

    it('Case 8: Neutral board area + board boundary -> native behavior, no preventDefault', () => {
      container.scrollLeft = 600 // at right boundary

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const preventDefault = vi.fn()
      const event = {
        target: container,
        deltaY: 45, // scroll right at right boundary
        deltaX: 0,
        shiftKey: false,
        preventDefault,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event)
      })

      expect(preventDefault).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(600)
    })

    it('Case 9: Hook disabled (e.g. active drag) -> does not attach listener or process wheel', () => {
      const { result } = renderHook(() => useHorizontalScroll({ enabled: false }))

      act(() => {
        result.current.ref(container)
      })

      expect(wheelHandler).toBeUndefined()
    })

    it('Case 10: Cursor Drift & Gesture Persistence — Consecutive wheel events across changing targets maintain horizontal scroll', () => {
      vi.useFakeTimers()

      // Set up sibling column 2 with its own cards, which has vertical scroll room in the middle
      const column2 = document.createElement('div')
      column2.style.overflowY = 'auto'
      Object.defineProperty(column2, 'scrollHeight', { value: 800, configurable: true })
      Object.defineProperty(column2, 'clientHeight', { value: 400, configurable: true })
      column2.scrollTop = 100 // Middle of column: can scroll down!
      const column2Card = document.createElement('div')
      column2.appendChild(column2Card)
      container.appendChild(column2)

      // Column 1 is at bottom
      columnContent.scrollTop = 400
      container.scrollLeft = 200

      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      // Tick 1: Over Column 1 (at bottom) -> hands off to horizontal scroll RIGHT
      const preventDefault1 = vi.fn()
      const event1 = {
        target: childCard,
        deltaY: 50,
        deltaX: 0,
        shiftKey: false,
        preventDefault: preventDefault1,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event1)
      })

      expect(preventDefault1).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(250) // 200 + 50

      // Tick 2: Board moved underneath stationary cursor!
      // Pointer is now over column2Card (which in isolation would have vertical scroll capacity)
      // Arrives 50ms later (within the 200ms gesture window)
      act(() => {
        vi.advanceTimersByTime(50)
      })

      const preventDefault2 = vi.fn()
      const event2 = {
        target: column2Card,
        deltaY: 50,
        deltaX: 0,
        shiftKey: false,
        preventDefault: preventDefault2,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event2)
      })

      // MUST remain horizontal navigation and NOT get intercepted by column 2's vertical capacity!
      expect(preventDefault2).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(300) // 250 + 50
      expect(column2.scrollTop).toBe(100) // Column 2 was not scrolled vertically

      // Tick 3: Arrives 100ms later (still within 200ms of tick 2)
      act(() => {
        vi.advanceTimersByTime(100)
      })

      const preventDefault3 = vi.fn()
      const event3 = {
        target: column2Card,
        deltaY: 40,
        deltaX: 0,
        shiftKey: false,
        preventDefault: preventDefault3,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event3)
      })

      expect(preventDefault3).toHaveBeenCalled()
      expect(container.scrollLeft).toBe(340) // 300 + 40

      // Wait 250ms -> Gesture lock expires!
      act(() => {
        vi.advanceTimersByTime(250)
      })

      // Tick 4: New gesture begins over column2Card.
      // Now it re-evaluates vertical capacity. Since column2 has room to scroll down, it should allow native vertical!
      const preventDefault4 = vi.fn()
      const event4 = {
        target: column2Card,
        deltaY: 30,
        deltaX: 0,
        shiftKey: false,
        preventDefault: preventDefault4,
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event4)
      })

      // Native vertical allowed -> no preventDefault, no container scrollLeft change
      expect(preventDefault4).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(340)

      vi.useRealTimers()
    })

    it('Case 11: Horizontal trackpad (deltaX !== 0) immediately breaks gesture lock', () => {
      vi.useFakeTimers()

      // Initiate horizontal gesture lock on neutral area
      container.scrollLeft = 200
      const { result } = renderHook(() => useHorizontalScroll())

      act(() => {
        result.current.ref(container)
      })

      const event1 = {
        target: container,
        deltaY: 50,
        deltaX: 0,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(event1)
      })

      expect(container.scrollLeft).toBe(250)

      // Column with vertical capacity
      columnContent.scrollTop = 100

      // User initiates real trackpad horizontal swipe (deltaX !== 0)
      const trackpadEvent = {
        target: childCard,
        deltaY: 0,
        deltaX: 20,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(trackpadEvent)
      })

      expect(trackpadEvent.preventDefault).not.toHaveBeenCalled()

      // Subsequent vertical wheel should now re-evaluate target immediately because lock was cleared
      const verticalEvent = {
        target: childCard,
        deltaY: 30,
        deltaX: 0,
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as WheelEvent

      act(() => {
        wheelHandler!(verticalEvent)
      })

      // Column content handles vertical natively
      expect(verticalEvent.preventDefault).not.toHaveBeenCalled()
      expect(container.scrollLeft).toBe(250) // unchanged

      vi.useRealTimers()
    })
  })
})
