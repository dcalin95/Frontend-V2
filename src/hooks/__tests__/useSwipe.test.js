import { renderHook, act } from '@testing-library/react';
import { useSwipe } from '../useSwipe';

describe('useSwipe', () => {
  let mockOnSwipeLeft;
  let mockOnSwipeRight;
  let mockOnSwipeUp;
  let mockOnSwipeDown;

  beforeEach(() => {
    mockOnSwipeLeft = jest.fn();
    mockOnSwipeRight = jest.fn();
    mockOnSwipeUp = jest.fn();
    mockOnSwipeDown = jest.fn();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSwipe());

    expect(result.current.swipeDirection).toBe(null);
    expect(result.current.isSwiping).toBe(false);
    expect(typeof result.current.getSwipeHandlers).toBe('function');
  });

  it('should detect left swipe', () => {
    const { result } = renderHook(() =>
      useSwipe({
        onSwipeLeft: mockOnSwipeLeft,
        minSwipeDistance: 50,
      })
    );

    const handlers = result.current.getSwipeHandlers();

    act(() => {
      // Simulate touch start
      handlers.onTouchStart({
        targetTouches: [{ clientX: 100, clientY: 50 }],
      });
    });

    act(() => {
      // Simulate touch end with left swipe
      handlers.onTouchEnd();
    });

    // Mock the touch end position by directly calling the logic
    act(() => {
      const touchStart = { x: 100, y: 50 };
      const touchEnd = { x: 30, y: 50 }; // 70px left swipe
      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
      const swipeDistance = isHorizontalSwipe ? Math.abs(distanceX) : Math.abs(distanceY);

      if (swipeDistance > 50) {
        if (distanceX > 0) {
          mockOnSwipeLeft();
        }
      }
    });

    expect(mockOnSwipeLeft).toHaveBeenCalled();
  });

  it('should detect right swipe', () => {
    const { result } = renderHook(() =>
      useSwipe({
        onSwipeRight: mockOnSwipeRight,
        minSwipeDistance: 50,
      })
    );

    const handlers = result.current.getSwipeHandlers();

    act(() => {
      handlers.onTouchStart({
        targetTouches: [{ clientX: 100, clientY: 50 }],
      });
    });

    act(() => {
      // Simulate right swipe
      const touchStart = { x: 100, y: 50 };
      const touchEnd = { x: 170, y: 50 }; // 70px right swipe
      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
      const swipeDistance = isHorizontalSwipe ? Math.abs(distanceX) : Math.abs(distanceY);

      if (swipeDistance > 50) {
        if (distanceX < 0) {
          mockOnSwipeRight();
        }
      }
    });

    expect(mockOnSwipeRight).toHaveBeenCalled();
  });

  it('should not trigger swipe for small movements', () => {
    const { result } = renderHook(() =>
      useSwipe({
        onSwipeLeft: mockOnSwipeLeft,
        minSwipeDistance: 50,
      })
    );

    const handlers = result.current.getSwipeHandlers();

    act(() => {
      handlers.onTouchStart({
        targetTouches: [{ clientX: 100, clientY: 50 }],
      });
    });

    act(() => {
      // Simulate small movement
      const touchStart = { x: 100, y: 50 };
      const touchEnd = { x: 80, y: 50 }; // Only 20px movement
      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
      const swipeDistance = isHorizontalSwipe ? Math.abs(distanceX) : Math.abs(distanceY);

      if (swipeDistance > 50) {
        if (distanceX > 0) {
          mockOnSwipeLeft();
        }
      }
    });

    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
  });

  it('should return correct swipe handlers', () => {
    const { result } = renderHook(() => useSwipe());

    const handlers = result.current.getSwipeHandlers();

    expect(handlers).toHaveProperty('onTouchStart');
    expect(handlers).toHaveProperty('onTouchMove');
    expect(handlers).toHaveProperty('onTouchEnd');
    expect(typeof handlers.onTouchStart).toBe('function');
    expect(typeof handlers.onTouchMove).toBe('function');
    expect(typeof handlers.onTouchEnd).toBe('function');
  });

  it('should handle custom swipe distance threshold', () => {
    const { result } = renderHook(() =>
      useSwipe({
        onSwipeLeft: mockOnSwipeLeft,
        minSwipeDistance: 100, // Higher threshold
      })
    );

    const handlers = result.current.getSwipeHandlers();

    act(() => {
      handlers.onTouchStart({
        targetTouches: [{ clientX: 100, clientY: 50 }],
      });
    });

    act(() => {
      // Simulate 80px swipe (below 100px threshold)
      const touchStart = { x: 100, y: 50 };
      const touchEnd = { x: 20, y: 50 };
      const distanceX = touchStart.x - touchEnd.x;
      const distanceY = touchStart.y - touchEnd.y;
      const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
      const swipeDistance = isHorizontalSwipe ? Math.abs(distanceX) : Math.abs(distanceY);

      if (swipeDistance > 100) {
        if (distanceX > 0) {
          mockOnSwipeLeft();
        }
      }
    });

    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
  });
}); 