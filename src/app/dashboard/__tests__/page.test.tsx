import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../page";

// Mocks
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: { firstName: "Test", username: "testuser" },
    isLoaded: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@vercel/analytics", () => ({
  track: jest.fn(),
}));

jest.mock("@/hooks/use-analytics", () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    trackUserAction: jest.fn(),
  }),
}));

global.fetch = jest.fn();

describe("DashboardPage", () => {
  it("displays an error message when analytics fetch fails", async () => {
    // Mock the failed API response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    });

    render(<DashboardPage />);

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch analytics")).toBeInTheDocument();
    });
  });
});
