import { useState, useEffect, useRef } from 'react';

export const useSwipe = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 300
  } = options;

  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const swipeTime = useRef(null);

  const onTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    swipeTime.current = Date.now();
    setIsSwiping(true);
  };

  const onTouchMove = (e) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const swipeDistance = isHorizontalSwipe ? Math.abs(distanceX) : Math.abs(distanceY);
    const swipeDuration = Date.now() - swipeTime.current;

    if (swipeDistance > minSwipeDistance && swipeDuration < maxSwipeTime) {
      let direction = null;

      if (isHorizontalSwipe) {
        if (distanceX > 0) {
          direction = 'left';
          onSwipeLeft?.();
        } else {
          direction = 'right';
          onSwipeRight?.();
        }
      } else {
        if (distanceY > 0) {
          direction = 'up';
          onSwipeUp?.();
        } else {
          direction = 'down';
          onSwipeDown?.();
        }
      }

      setSwipeDirection(direction);
    }

    setIsSwiping(false);
    touchStart.current = null;
    touchEnd.current = null;
  };

  const getSwipeHandlers = () => ({
    onTouchStart,
    onTouchMove,
    onTouchEnd
  });

  return {
    swipeDirection,
    isSwiping,
    getSwipeHandlers
  };
}; 