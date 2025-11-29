import { GET, POST } from "./route";
import { createMocks } from "node-mocks-http";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock auth
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn().mockResolvedValue({ userId: "user_test_123" }),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    animalGroup: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("/api/animals/groups", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET returns groups for the user", async () => {
    (prisma.animalGroup.findMany as jest.Mock).mockResolvedValue([
      { id: "1", name: "Group A", species: { name: "Chicken" } },
    ]);

    const req = new NextRequest("http://localhost/api/animals/groups");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe("Group A");
  });

  it("POST creates a new group", async () => {
    const newGroup = {
      speciesId: "species_123",
      name: "New Flock",
      quantity: 100,
      startDate: "2025-01-01T00:00:00Z",
    };

    (prisma.animalGroup.create as jest.Mock).mockResolvedValue({
      id: "2",
      ...newGroup,
      userId: "user_test_123",
    });

    const req = new NextRequest("http://localhost/api/animals/groups", {
      method: "POST",
      body: JSON.stringify(newGroup),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("New Flock");
  });
});
