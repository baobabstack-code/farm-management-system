import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import GroupDetailsPage from "../page";

// Mocks
jest.mock("@clerk/nextjs", () => ({
  auth: () => new Promise((resolve) => resolve({ userId: "user_test_123" })),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children }: { children: React.ReactNode }) => {
    return <a>{children}</a>;
  };
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock child components to simplify testing
jest.mock("@/components/animals/ProductionForm", () => {
  return function MockProductionForm() {
    return <div data-testid="production-form">Production Form</div>;
  };
});

jest.mock("@/components/animals/ForecastCard", () => {
  return function MockForecastCard() {
    return <div data-testid="forecast-card">Forecast Card</div>;
  };
});

jest.mock("@/components/animals/LineChart", () => {
  return function MockLineChart() {
    return <div data-testid="line-chart">Line Chart</div>;
  };
});

global.fetch = jest.fn();

describe("GroupDetailsPage", () => {
  const mockParams = Promise.resolve({ groupId: "123" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders group details correctly", async () => {
    // Mock API responses
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/groups/123")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: "123",
              name: "Test Group",
              species: { name: "Chicken" },
              quantity: 100,
              startDate: "2023-01-01",
              status: "active",
            },
          }),
        });
      }
      if (url.includes("/production")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });
      }
      if (url.includes("/forecast")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<GroupDetailsPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText("Test Group")).toBeInTheDocument();
      expect(screen.getByText(/Chicken/)).toBeInTheDocument();
      expect(screen.getByText(/100 animals/)).toBeInTheDocument();
    });
  });

  it("renders child components", async () => {
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/groups/123")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: "123",
              name: "Test Group",
              species: { name: "Chicken" },
              quantity: 100,
              startDate: "2023-01-01",
              status: "active",
            },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
    });

    render(<GroupDetailsPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByTestId("production-form")).toBeInTheDocument();
      expect(screen.getByTestId("forecast-card")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });
  });

  it("handles group not found", async () => {
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/groups/123")) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ success: false }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });
    });

    render(<GroupDetailsPage params={mockParams} />);

    await waitFor(() => {
      expect(screen.getByText("Group not found")).toBeInTheDocument();
    });
  });
});
