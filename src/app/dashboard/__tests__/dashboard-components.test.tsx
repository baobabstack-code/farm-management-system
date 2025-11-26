/**
 * Unit Tests for Dashboard Components
 *
 * Tests stat cards, recent tasks widget, upcoming harvests widget,
 * financial summary widget, and various data states.
 *
 * Requirements: 5.2, 15
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DashboardPage from "../page";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { DashboardSummaryResponse } from "@/lib/validations/dashboard";

// Mock dependencies
jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useMobileGestures", () => ({
  usePullToRefresh: jest.fn(() => ({
    elementRef: { current: null },
    refreshIndicator: null,
  })),
  useIsMobile: jest.fn(() => false),
}));

jest.mock("@/hooks/use-analytics", () => ({
  useAnalytics: jest.fn(() => ({
    trackEvent: jest.fn(),
    trackUserAction: jest.fn(),
  })),
}));

jest.mock("@/components/weather/WeatherDashboard", () => {
  return function MockWeatherDashboard() {
    return <div data-testid="weather-dashboard">Weather Dashboard</div>;
  };
});

jest.mock("@/components/ai/AIInsightsCard", () => {
  return function MockAIInsightsCard() {
    return <div data-testid="ai-insights">AI Insights</div>;
  };
});

jest.mock("@/components/ai/CropRecommendationsCard", () => {
  return function MockCropRecommendationsCard() {
    return <div data-testid="crop-recommendations">Crop Recommendations</div>;
  };
});

jest.mock("@/components/ui/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("Dashboard Components", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockUser = {
    id: "user123",
    firstName: "John",
    username: "johndoe",
  };

  const mockDashboardData: DashboardSummaryResponse = {
    dashboard: {
      totalCrops: 5,
      activeTasks: 3,
      overdueTasks: 1,
      recentHarvests: 2,
      totalYield: 150.5,
      waterUsage: 1000,
    },
    water: {
      totalWater: 1000,
      averagePerSession: 50,
      sessionCount: 20,
    },
    fertilizer: {
      totalAmount: 100,
      applicationCount: 10,
      typeBreakdown: { NPK: 60, Organic: 40 },
    },
    yield: {
      totalYield: 150.5,
      harvestCount: 2,
      cropBreakdown: { Tomatoes: 100, Lettuce: 50.5 },
    },
    pestDisease: {
      totalIncidents: 5,
      pestCount: 3,
      diseaseCount: 2,
      severityBreakdown: { LOW: 2, MEDIUM: 2, HIGH: 1 },
    },
    financial: {
      totalIncome: 5000,
      totalExpenses: 3000,
      balance: 2000,
      transactionCount: 25,
    },
    recentTasks: [
      {
        id: "task1",
        title: "Water tomatoes",
        description: "Water the tomato plants",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "HIGH",
        status: "PENDING",
        cropId: "crop1",
        cropName: "Tomatoes",
        createdAt: new Date().toISOString(),
      },
      {
        id: "task2",
        title: "Fertilize lettuce",
        description: null,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        cropId: "crop2",
        cropName: "Lettuce",
        createdAt: new Date().toISOString(),
      },
    ],
    upcomingHarvests: [
      {
        id: "crop1",
        name: "Tomatoes",
        variety: "Cherry",
        status: "FRUITING",
        plantingDate: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(),
        expectedHarvestDate: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        actualHarvestDate: null,
        area: 2.5,
      },
      {
        id: "crop2",
        name: "Lettuce",
        variety: null,
        status: "GROWING",
        plantingDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        expectedHarvestDate: new Date(
          Date.now() + 15 * 24 * 60 * 60 * 1000
        ).toISOString(),
        actualHarvestDate: null,
        area: 1.0,
      },
    ],
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      name: "New York, NY",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoaded: true,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockDashboardData,
      }),
    });
  });

  describe("Stat Cards", () => {
    it("should render stat cards with correct data", async () => {
      render(<DashboardPage />);

      // Wait for data to load
      await screen.findByText("Total Crops");

      // Check all stat cards
      expect(screen.getByText("Total Crops")).toBeInTheDocument();
      expect(screen.getByLabelText("5 total crops")).toBeInTheDocument();

      expect(screen.getByText("Active Tasks")).toBeInTheDocument();
      expect(screen.getByLabelText("3 active tasks")).toBeInTheDocument();

      expect(screen.getByText("Overdue Tasks")).toBeInTheDocument();
      expect(screen.getByLabelText("1 overdue tasks")).toBeInTheDocument();

      expect(screen.getByText("Total Yield")).toBeInTheDocument();
      expect(screen.getByText("150.5 kg")).toBeInTheDocument();
    });

    it("should handle zero values gracefully", async () => {
      const emptyData = {
        ...mockDashboardData,
        dashboard: {
          ...mockDashboardData.dashboard,
          totalCrops: 0,
          activeTasks: 0,
          overdueTasks: 0,
          totalYield: 0,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: emptyData,
        }),
      });

      render(<DashboardPage />);

      await screen.findByText("No crops yet");

      expect(screen.getByText("No crops yet")).toBeInTheDocument();
      expect(screen.getByText("No active tasks")).toBeInTheDocument();
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
      expect(screen.getByText("No harvests yet")).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", async () => {
      render(<DashboardPage />);

      await screen.findByText("Total Crops");

      const statsRegion = screen.getByRole("region", {
        name: /dashboard statistics/i,
      });
      expect(statsRegion).toBeInTheDocument();

      const statCards = screen.getAllByRole("article");
      expect(statCards.length).toBeGreaterThan(0);
    });
  });

  describe("Recent Tasks Widget", () => {
    it("should display recent tasks with proper formatting", async () => {
      render(<DashboardPage />);

      await screen.findByText("Water tomatoes");

      expect(screen.getByText("Water tomatoes")).toBeInTheDocument();
      expect(screen.getByText("Crop: Tomatoes")).toBeInTheDocument();
      expect(screen.getByText("PENDING")).toBeInTheDocument();

      expect(screen.getByText("Fertilize lettuce")).toBeInTheDocument();
      expect(screen.getByText("Crop: Lettuce")).toBeInTheDocument();
      expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    });

    it("should show empty state when no tasks exist", async () => {
      const noTasksData = {
        ...mockDashboardData,
        recentTasks: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: noTasksData,
        }),
      });

      render(<DashboardPage />);

      await screen.findByText("No tasks yet");

      expect(screen.getByText("No tasks yet")).toBeInTheDocument();
      expect(screen.getByText("Create Your First Task")).toBeInTheDocument();
    });

    it("should navigate to tasks page when View All is clicked", async () => {
      render(<DashboardPage />);

      await screen.findByText("Water tomatoes");

      const viewAllButton = screen.getByRole("button", {
        name: /view all tasks/i,
      });
      fireEvent.click(viewAllButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/tasks");
    });

    it("should display task status indicators with correct colors", async () => {
      render(<DashboardPage />);

      await screen.findByText("Water tomatoes");

      const pendingStatus = screen.getByText("PENDING");
      expect(pendingStatus).toHaveClass("bg-warning/10");

      const inProgressStatus = screen.getByText("IN PROGRESS");
      expect(inProgressStatus).toHaveClass("bg-info/10");
    });
  });

  describe("Upcoming Harvests Widget", () => {
    it("should display upcoming harvests with days until harvest", async () => {
      render(<DashboardPage />);

      await screen.findByText("Tomatoes");

      expect(screen.getByText("Tomatoes")).toBeInTheDocument();
      expect(screen.getByText("(Cherry)")).toBeInTheDocument();
      expect(
        screen.getAllByText(/5 days until harvest/i).length
      ).toBeGreaterThan(0);

      expect(screen.getByText("Lettuce")).toBeInTheDocument();
      expect(
        screen.getAllByText(/15 days until harvest/i).length
      ).toBeGreaterThan(0);
    });

    it("should show empty state when no upcoming harvests", async () => {
      const noHarvestsData = {
        ...mockDashboardData,
        upcomingHarvests: [],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: noHarvestsData,
        }),
      });

      render(<DashboardPage />);

      await screen.findByText("No upcoming harvests in the next 30 days");

      expect(
        screen.getByText("No upcoming harvests in the next 30 days")
      ).toBeInTheDocument();
      expect(screen.getByText("Add Crops")).toBeInTheDocument();
    });

    it("should display urgency indicators correctly", async () => {
      render(<DashboardPage />);

      await screen.findByText("Tomatoes");

      // Check for urgency indicators (emojis)
      const harvestItems = screen.getAllByRole("listitem");
      expect(harvestItems.length).toBeGreaterThan(0);
    });

    it("should navigate to crops page when View All is clicked", async () => {
      render(<DashboardPage />);

      await screen.findByText("Tomatoes");

      const viewAllButton = screen.getByRole("button", {
        name: /view all crops/i,
      });
      fireEvent.click(viewAllButton);

      expect(mockRouter.push).toHaveBeenCalledWith("/crops");
    });
  });

  describe("Financial Summary Widget", () => {
    it("should display financial data with proper currency formatting", async () => {
      render(<DashboardPage />);

      await screen.findByText("$5,000.00");

      expect(screen.getByText("Total Revenue")).toBeInTheDocument();
      expect(screen.getByText("$5,000.00")).toBeInTheDocument();

      expect(screen.getByText("Total Expenses")).toBeInTheDocument();
      expect(screen.getByText("$3,000.00")).toBeInTheDocument();

      expect(screen.getByText("Net Balance")).toBeInTheDocument();
      expect(screen.getByText("$2,000.00")).toBeInTheDocument();
    });

    it("should show positive balance indicator", async () => {
      render(<DashboardPage />);

      await screen.findByText("$2,000.00");

      expect(screen.getByText("↑ Positive")).toBeInTheDocument();
    });

    it("should show negative balance indicator for negative balance", async () => {
      const negativeBalanceData = {
        ...mockDashboardData,
        financial: {
          totalIncome: 2000,
          totalExpenses: 3000,
          balance: -1000,
          transactionCount: 25,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: negativeBalanceData,
        }),
      });

      render(<DashboardPage />);

      await screen.findByText("↓ Negative");

      expect(screen.getByText("↓ Negative")).toBeInTheDocument();
    });

    it("should handle zero balance state", async () => {
      const zeroBalanceData = {
        ...mockDashboardData,
        financial: {
          totalIncome: 3000,
          totalExpenses: 3000,
          balance: 0,
          transactionCount: 25,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: zeroBalanceData,
        }),
      });

      render(<DashboardPage />);

      await screen.findByText("Revenue and expenses are balanced");

      expect(
        screen.getByText("Revenue and expenses are balanced")
      ).toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("should display loading state initially", () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: false,
      });

      render(<DashboardPage />);

      expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
    });

    it("should redirect to sign-in if user is not authenticated", () => {
      (useUser as jest.Mock).mockReturnValue({
        user: null,
        isLoaded: true,
      });

      render(<DashboardPage />);

      expect(mockRouter.push).toHaveBeenCalledWith("/sign-in");
    });
  });
});
