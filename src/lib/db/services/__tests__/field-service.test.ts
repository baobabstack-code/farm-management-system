import { FieldService } from "../field-service";
import { prisma } from "../../connection";
import DatabaseService from "../../database-service";

// Mock Prisma
jest.mock("../../connection", () => ({
  prisma: {
    field: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// Mock DatabaseService
jest.mock("../../database-service", () => {
  return {
    __esModule: true,
    default: {
      execute: jest.fn((fn) => fn()),
    },
    DatabaseService: {
      execute: jest.fn((fn) => fn()),
    },
  };
});

describe("FieldService", () => {
  const mockUserId = "user123";
  const mockField = {
    id: "field1",
    userId: mockUserId,
    name: "Test Field",
    latitude: 40.7128,
    longitude: -74.006,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findAllByUser", () => {
    it("should return all fields for a user", async () => {
      (prisma.field.findMany as jest.Mock).mockResolvedValue([mockField]);

      const result = await FieldService.findAllByUser(mockUserId);

      expect(prisma.field.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual([mockField]);
    });
  });

  describe("findFirstByUser", () => {
    it("should return the first field for a user", async () => {
      (prisma.field.findFirst as jest.Mock).mockResolvedValue(mockField);

      const result = await FieldService.findFirstByUser(mockUserId);

      expect(prisma.field.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockField);
    });

    it("should return null if no field is found", async () => {
      (prisma.field.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await FieldService.findFirstByUser(mockUserId);

      expect(result).toBeNull();
    });
  });
});
