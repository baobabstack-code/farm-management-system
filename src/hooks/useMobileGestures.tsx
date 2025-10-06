import { useEffect, useRef, useState, ReactNode } from "react";

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minDistance?: number;
  maxTime?: number;
  preventScroll?: boolean;
}

export const useMobileGestures = <T extends HTMLElement = HTMLElement>(
  options: SwipeGestureOptions = {}
) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minDistance = 50,
    maxTime = 500,
    preventScroll = false,
  } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (preventScroll) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const touchEnd = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touchEnd.x - touchStart.current.x;
      const deltaY = touchEnd.y - touchStart.current.y;
      const deltaTime = touchEnd.time - touchStart.current.time;

      // Check if the gesture meets our criteria
      if (deltaTime > maxTime) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if this is a horizontal or vertical swipe
      if (Math.max(absX, absY) < minDistance) return;

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      touchStart.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll && touchStart.current) {
        e.preventDefault();
      }
    };

    // Add event listeners with passive: false for preventDefault to work
    element.addEventListener("touchstart", handleTouchStart, {
      passive: !preventScroll,
    });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, {
      passive: !preventScroll,
    });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchmove", handleTouchMove);
    };
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minDistance,
    maxTime,
    preventScroll,
  ]);

  return elementRef;
};

// Hook for pull-to-refresh functionality
interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  refreshingComponent?: ReactNode;
}

export const usePullToRefresh = <T extends HTMLElement = HTMLElement>(
  options: PullToRefreshOptions
) => {
  const { onRefresh, threshold = 80, refreshingComponent } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const elementRef = useRef<T | null>(null);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we're at the top of the page
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isDragging.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY.current;

      // Only allow pull down when at the top
      if (deltaY > 0 && element.scrollTop === 0) {
        isDragging.current = true;
        setPullDistance(Math.min(deltaY * 0.5, threshold * 1.5)); // Apply resistance

        if (deltaY > 10) {
          e.preventDefault(); // Prevent scrolling when pulling
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isDragging.current && pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
      startY.current = 0;
      isDragging.current = false;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance, isRefreshing]);

  const refreshIndicator =
    pullDistance > 0 ? (
      <div
        style={{
          height: pullDistance,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))",
        }}
        className="transition-all duration-150"
      >
        {pullDistance >= threshold ? (
          <div className="text-green-600 dark:text-green-400 font-medium">
            {isRefreshing ? "Refreshing..." : "Release to refresh"}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">
            Pull down to refresh
          </div>
        )}
      </div>
    ) : null;

  return {
    elementRef,
    isRefreshing,
    pullDistance,
    refreshIndicator,
  };
};

// Hook for detecting mobile device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

// Hook for handling mobile orientation changes
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      );
    };

    handleOrientationChange();
    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return orientation;
};
