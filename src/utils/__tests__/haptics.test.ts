import {
  triggerHapticFeedback,
  hapticFeedback,
  isHapticFeedbackAvailable,
} from "../haptics";

declare global {
  interface Window {
    webkit: any;
  }
}

// Mocking browser features
const vibrateMock = jest.fn();
const postMessageMock = jest.fn();

Object.defineProperty(navigator, "vibrate", {
  value: vibrateMock,
  configurable: true,
});

Object.defineProperty(window, "webkit", {
  value: {
    messageHandlers: {
      hapticFeedback: {
        postMessage: postMessageMock,
      },
    },
  },
  configurable: true,
});

describe("Haptic Feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isHapticFeedbackAvailable", () => {
    it("should return true if vibrate is in navigator", () => {
      expect(isHapticFeedbackAvailable()).toBe(true);
    });
  });

  describe("triggerHapticFeedback", () => {
    it("should call vibrate with the correct pattern for light impact", () => {
      const originalWebkit = window.webkit;
      Object.defineProperty(window, "webkit", {
        value: undefined,
        configurable: true,
      });
      triggerHapticFeedback("light");
      expect(vibrateMock).toHaveBeenCalledWith(25);
      Object.defineProperty(window, "webkit", {
        value: originalWebkit,
        configurable: true,
      });
    });

    it("should call vibrate with the correct pattern for notification", () => {
      const originalWebkit = window.webkit;
      Object.defineProperty(window, "webkit", {
        value: undefined,
        configurable: true,
      });
      triggerHapticFeedback("notification");
      expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100, 50, 100]);
      Object.defineProperty(window, "webkit", {
        value: originalWebkit,
        configurable: true,
      });
    });

    it("should call postMessage for iOS notification", () => {
      Object.defineProperty(navigator, "vibrate", {
        value: undefined,
        configurable: true,
      });
      triggerHapticFeedback("notification", "warning");
      expect(postMessageMock).toHaveBeenCalledWith({
        type: "notification",
        notificationType: "warning",
      });
      Object.defineProperty(navigator, "vibrate", {
        value: vibrateMock,
        configurable: true,
      });
    });
  });

  describe("hapticFeedback object", () => {
    it("should call triggerHapticFeedback with success", () => {
      const originalWebkit = window.webkit;
      Object.defineProperty(window, "webkit", {
        value: undefined,
        configurable: true,
      });
      hapticFeedback.success();
      expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100, 50, 100]);
      Object.defineProperty(window, "webkit", {
        value: originalWebkit,
        configurable: true,
      });
    });

    it("should call triggerHapticFeedback with error", () => {
      Object.defineProperty(navigator, "vibrate", {
        value: undefined,
        configurable: true,
      });
      hapticFeedback.error();
      expect(postMessageMock).toHaveBeenCalledWith({
        type: "notification",
        notificationType: "error",
      });
      Object.defineProperty(navigator, "vibrate", {
        value: vibrateMock,
        configurable: true,
      });
    });

    it("should call triggerHapticFeedback with warning", () => {
      Object.defineProperty(navigator, "vibrate", {
        value: undefined,
        configurable: true,
      });
      hapticFeedback.warning();
      expect(postMessageMock).toHaveBeenCalledWith({
        type: "notification",
        notificationType: "warning",
      });
      Object.defineProperty(navigator, "vibrate", {
        value: vibrateMock,
        configurable: true,
      });
    });
  });
});
