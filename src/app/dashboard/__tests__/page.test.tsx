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
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/dashboard",
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

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock("@/components/weather/WeatherDashboard", () => {
  return function MockWeatherDashboard({ location }: { location: string }) {
    return <div data-testid="weather-dashboard">{location}</div>;
  };
});

global.fetch = jest.fn();

describe("DashboardPage", () => {
  it("handles API error gracefully", async () => {
    // Mock the failed API response
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch dashboard data",
        },
      }),
    });

    render(<DashboardPage />);

    // Wait for the page to finish loading
    await waitFor(() => {
      // Verify the page header is still rendered (graceful error handling)
      expect(screen.getByText("Farm Management Dashboard")).toBeInTheDocument();
    });
  });

  it("updates location based on analytics data", async () => {
    // Mock successful API response with location
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          dashboard: {
            totalCrops: 10,
            activeTasks: 5,
            overdueTasks: 1,
            recentHarvests: 2,
            totalYield: 1000,
            waterUsage: 500,
          },
          water: { totalWater: 500, averagePerSession: 50, sessionCount: 10 },
          fertilizer: {
            totalAmount: 100,
            applicationCount: 5,
            typeBreakdown: {},
          },
          yield: { totalYield: 1000, harvestCount: 2, cropBreakdown: {} },
          pestDisease: {
            totalIncidents: 1,
            pestCount: 1,
            diseaseCount: 0,
            severityBreakdown: {},
          },
          financial: {
            totalIncome: 8000,
            totalExpenses: 5000,
            balance: 3000,
            transactionCount: 10,
          },
          location: {
            latitude: 34.0522,
            longitude: -118.2437,
            name: "Los Angeles, CA",
          },
        },
      }),
    });

    render(<DashboardPage />);

    // Wait for the location to be updated (WeatherDashboard uses it)
    await waitFor(() => {
      expect(screen.getByTestId("weather-dashboard")).toHaveTextContent(
        "Los Angeles, CA"
      );
    });
  });
});
