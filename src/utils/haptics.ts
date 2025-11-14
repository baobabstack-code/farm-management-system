// Haptic feedback utility for mobile devices
export type HapticFeedbackType =
  | "light"
  | "medium"
  | "heavy"
  | "selection"
  | "impact"
  | "notification";

interface HapticFeedback {
  vibrate?: (pattern: number | number[]) => void;
  selectionChanged?: () => void;
  impactOccurred?: (style: "light" | "medium" | "heavy") => void;
  notificationOccurred?: (type: "success" | "warning" | "error") => void;
}

// Check if haptic feedback is available
export const isHapticFeedbackAvailable = (): boolean => {
  return (
    typeof window !== "undefined" &&
    ("vibrate" in navigator ||
      "hapticFeedback" in window ||
      // iOS Safari
      "DeviceMotionEvent" in window)
  );
};

// Get haptic feedback interface (iOS Safari or Android)
const getHapticInterface = (): HapticFeedback | null => {
  if (typeof window === "undefined") return null;

  // iOS Safari Haptic Feedback
  const webkit = (window as any).webkit;
  if (
    webkit &&
    webkit.messageHandlers &&
    webkit.messageHandlers.hapticFeedback
  ) {
    return {
      selectionChanged: () => {
        webkit.messageHandlers.hapticFeedback.postMessage({
          type: "selection",
        });
      },
      impactOccurred: (style: "light" | "medium" | "heavy") => {
        webkit.messageHandlers.hapticFeedback.postMessage({
          type: "impact",
          style,
        });
      },
      notificationOccurred: (type: "success" | "warning" | "error") => {
        webkit.messageHandlers.hapticFeedback.postMessage({
          type: "notification",
          notificationType: type,
        });
      },
    };
  }

  // Standard vibration API (Android and some other browsers)
  if ("vibrate" in navigator) {
    return {
      vibrate: (pattern: number | number[]) => {
        navigator.vibrate(pattern);
      },
    };
  }

  return null;
};

// Trigger haptic feedback
export const triggerHapticFeedback = (
  type: HapticFeedbackType = "light",
  notificationType: "success" | "warning" | "error" = "success"
): void => {
  if (!isHapticFeedbackAvailable()) return;

  const hapticInterface = getHapticInterface();
  if (!hapticInterface) return;

  try {
    switch (type) {
      case "selection":
        if (hapticInterface.selectionChanged) {
          hapticInterface.selectionChanged();
        } else if (hapticInterface.vibrate) {
          hapticInterface.vibrate(10); // Very light vibration
        }
        break;

      case "light":
        if (hapticInterface.impactOccurred) {
          hapticInterface.impactOccurred("light");
        } else if (hapticInterface.vibrate) {
          hapticInterface.vibrate(25);
        }
        break;

      case "medium":
        if (hapticInterface.impactOccurred) {
          hapticInterface.impactOccurred("medium");
        } else if (hapticInterface.vibrate) {
          hapticInterface.vibrate(50);
        }
        break;

      case "heavy":
        if (hapticInterface.impactOccurred) {
          hapticInterface.impactOccurred("heavy");
        } else if (hapticInterface.vibrate) {
          hapticInterface.vibrate(100);
        }
        break;

      case "impact":
        if (hapticInterface.impactOccurred) {
          hapticInterface.impactOccurred("medium");
        } else if (hapticInterface.vibrate) {
          hapticInterface.vibrate([50, 20, 50]);
        }
        break;

      case "notification":
        if (hapticInterface.notificationOccurred) {
          hapticInterface.notificationOccurred(notificationType);
        } else if (hapticInterface.vibrate) {
          hapticInterface.vibrate([100, 50, 100, 50, 100]);
        }
        break;

      default:
        if (hapticInterface.vibrate) {
          hapticInterface.vibrate(25);
        }
        break;
    }
  } catch (error) {
    // Silently fail if haptic feedback is not available or throws an error
    console.debug("Haptic feedback not available:", error);
  }
};

// Convenience functions for common haptic patterns
export const hapticFeedback = {
  // For button taps and selections
  tap: () => triggerHapticFeedback("selection"),

  // For successful actions
  success: () => triggerHapticFeedback("notification", "success"),

  // For warnings
  warning: () => triggerHapticFeedback("notification", "warning"),

  // For errors
  error: () => triggerHapticFeedback("notification", "error"),

  // For confirmations and important actions
  impact: () => triggerHapticFeedback("impact"),

  // For subtle feedback
  subtle: () => triggerHapticFeedback("light"),

  // For strong feedback
  strong: () => triggerHapticFeedback("heavy"),
};

export default hapticFeedback;
