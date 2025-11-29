import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AnimalsPage from "../page";

// Mocks
jest.mock("@clerk/nextjs", () => ({
  auth: () => new Promise((resolve) => resolve({ userId: "user_test_123" })),
}));

// Mock the fetch API
global.fetch = jest.fn();

describe("AnimalsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the page title", async () => {
    // Mock empty response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<AnimalsPage />);

    expect(screen.getByText("My Animals")).toBeInTheDocument();
  });

  it("displays 'No animal groups found' when list is empty", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<AnimalsPage />);

    await waitFor(() => {
      expect(screen.getByText("No animal groups found.")).toBeInTheDocument();
    });
  });

  it("renders a list of animal groups", async () => {
    const mockGroups = [
      {
        id: "1",
        name: "Coop A",
        species: { name: "Chicken" },
        quantity: 50,
        status: "active",
        _count: { production: 5 },
      },
      {
        id: "2",
        name: "Barn B",
        species: { name: "Cow" },
        quantity: 10,
        status: "active",
        _count: { production: 2 },
      },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockGroups }),
    });

    render(<AnimalsPage />);

    await waitFor(() => {
      expect(screen.getByText("Coop A")).toBeInTheDocument();
      expect(screen.getByText("Barn B")).toBeInTheDocument();
      expect(screen.getByText("50")).toBeInTheDocument();
    });
  });
});
