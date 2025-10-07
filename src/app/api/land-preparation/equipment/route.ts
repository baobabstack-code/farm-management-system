import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEquipmentSchema = z.object({
  name: z.string().min(1, "Equipment name is required"),
  equipmentType: z.enum([
    "PLOW",
    "CULTIVATOR",
    "DISC",
    "HARROW",
    "SUBSOILER",
    "FIELD_CULTIVATOR",
    "CHISEL_PLOW",
    "ROTARY_TILLER",
    "PLANTER",
    "DRILL",
    "SPREADER",
    "SPRAYER",
    "MOWER",
    "RAKE",
    "BALER",
    "COMBINE",
    "TRACTOR",
    "OTHER",
  ]),
  category: z
    .enum([
      "TILLAGE",
      "PLANTING",
      "HARVESTING",
      "SPRAYING",
      "MOWING",
      "TRANSPORT",
      "POWER",
      "SPECIALTY",
    ])
    .default("TILLAGE"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  yearManufactured: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  purchaseDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  purchasePrice: z.number().min(0).optional(),
  currentValue: z.number().min(0).optional(),
  status: z
    .enum(["ACTIVE", "MAINTENANCE", "REPAIR", "RETIRED", "RENTED", "LEASED"])
    .default("ACTIVE"),
  condition: z
    .enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "NEEDS_REPAIR"])
    .default("GOOD"),
  fuelType: z
    .enum(["DIESEL", "GASOLINE", "PROPANE", "ELECTRIC", "HYBRID"])
    .optional(),
  horsepower: z.number().min(0).optional(),
  workingWidth: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  lastServiceDate: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  serviceInterval: z.number().min(0).optional(),
  insuranceExpiry: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  warrantyExpiry: z
    .string()
    .transform((str) => new Date(str))
    .optional(),
  location: z.string().optional(),
  isShared: z.boolean().default(false),
  dailyRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const equipmentType = searchParams.get("equipmentType");
    const status = searchParams.get("status");
    const condition = searchParams.get("condition");
    const includeStats = searchParams.get("includeStats") === "true";
    const includeMaintenanceAlerts =
      searchParams.get("includeMaintenanceAlerts") === "true";

    const whereClause: any = {
      userId,
      ...(category && { category }),
      ...(equipmentType && { equipmentType }),
      ...(status && { status }),
      ...(condition && { condition }),
    };

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        tillageOps: {
          select: { id: true, operationDate: true, cost: true, fuelUsed: true },
          orderBy: { operationDate: "desc" },
          take: 5, // Recent operations
        },
        maintenanceLogs: {
          select: {
            id: true,
            serviceDate: true,
            totalCost: true,
            maintenanceType: true,
          },
          orderBy: { serviceDate: "desc" },
          take: 3, // Recent maintenance
        },
        fuelLogs: {
          select: { id: true, fuelDate: true, totalCost: true, quantity: true },
          orderBy: { fuelDate: "desc" },
          take: 5, // Recent fuel
        },
        _count: {
          select: {
            tillageOps: true,
            maintenanceLogs: true,
            fuelLogs: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    let stats = null;
    let maintenanceAlerts = null;

    if (includeStats) {
      const totalValue = equipment.reduce(
        (sum, eq) => sum + (eq.currentValue || eq.purchasePrice || 0),
        0
      );
      const totalHours = equipment.reduce((sum, eq) => sum + eq.hoursUsed, 0);
      const maintenanceCosts = equipment.reduce(
        (sum, eq) =>
          sum +
          eq.maintenanceLogs.reduce((logSum, log) => logSum + log.totalCost, 0),
        0
      );
      const fuelCosts = equipment.reduce(
        (sum, eq) =>
          sum + eq.fuelLogs.reduce((logSum, log) => logSum + log.totalCost, 0),
        0
      );

      stats = {
        totalEquipment: equipment.length,
        activeEquipment: equipment.filter((eq) => eq.status === "ACTIVE")
          .length,
        maintenanceEquipment: equipment.filter(
          (eq) => eq.status === "MAINTENANCE" || eq.status === "REPAIR"
        ).length,
        totalValue,
        totalHours,
        avgHoursPerEquipment:
          equipment.length > 0 ? totalHours / equipment.length : 0,
        maintenanceCosts,
        fuelCosts,
        totalOperatingCosts: maintenanceCosts + fuelCosts,
        equipmentByCategory: equipment.reduce(
          (acc, eq) => {
            acc[eq.category] = (acc[eq.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        equipmentByCondition: equipment.reduce(
          (acc, eq) => {
            acc[eq.condition] = (acc[eq.condition] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    }

    if (includeMaintenanceAlerts) {
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      maintenanceAlerts = equipment
        .filter((eq) => {
          // Check if maintenance is due within 30 days
          if (eq.nextServiceDue && eq.nextServiceDue <= thirtyDaysFromNow) {
            return true;
          }
          // Check if service interval is overdue based on hours
          if (eq.serviceInterval && eq.lastServiceDate) {
            const hoursSinceService = eq.hoursUsed; // Simplified - in real app, track hours since last service
            return hoursSinceService >= eq.serviceInterval;
          }
          return false;
        })
        .map((eq) => ({
          equipmentId: eq.id,
          equipmentName: eq.name,
          alertType:
            eq.nextServiceDue && eq.nextServiceDue <= now
              ? "OVERDUE"
              : "DUE_SOON",
          dueDate: eq.nextServiceDue,
          hoursOverdue: eq.serviceInterval
            ? Math.max(0, eq.hoursUsed - (eq.serviceInterval || 0))
            : 0,
          lastServiceDate: eq.lastServiceDate,
        }));
    }

    return NextResponse.json({
      success: true,
      data: {
        equipment,
        stats,
        maintenanceAlerts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch equipment",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createEquipmentSchema.parse(body);

    // Check for duplicate serial number if provided
    if (validatedData.serialNumber) {
      const existingEquipment = await prisma.equipment.findFirst({
        where: {
          userId,
          serialNumber: validatedData.serialNumber,
        },
      });

      if (existingEquipment) {
        return NextResponse.json(
          {
            success: false,
            error: "Equipment with this serial number already exists",
          },
          { status: 409 }
        );
      }
    }

    // Calculate next service due date if service interval is provided
    let nextServiceDue = null;
    if (validatedData.serviceInterval && validatedData.lastServiceDate) {
      nextServiceDue = new Date(validatedData.lastServiceDate);
      // Add service interval in days (assuming interval is in hours and equipment runs 8 hours per day)
      const intervalDays = Math.ceil(validatedData.serviceInterval / 8);
      nextServiceDue.setDate(nextServiceDue.getDate() + intervalDays);
    }

    const equipment = await prisma.equipment.create({
      data: {
        ...validatedData,
        nextServiceDue,
        userId,
      },
      include: {
        tillageOps: {
          select: { id: true, operationDate: true, cost: true },
          orderBy: { operationDate: "desc" },
          take: 5,
        },
        maintenanceLogs: {
          select: {
            id: true,
            serviceDate: true,
            totalCost: true,
            maintenanceType: true,
          },
          orderBy: { serviceDate: "desc" },
          take: 3,
        },
        fuelLogs: {
          select: { id: true, fuelDate: true, totalCost: true, quantity: true },
          orderBy: { fuelDate: "desc" },
          take: 5,
        },
        _count: {
          select: {
            tillageOps: true,
            maintenanceLogs: true,
            fuelLogs: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: equipment,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating equipment:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create equipment",
      },
      { status: 500 }
    );
  }
}
