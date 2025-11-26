import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed script for FarmFlow development database
 *
 * This script creates sample data for testing the dashboard and other features.
 *
 * IMPORTANT: This is for DEVELOPMENT ONLY. Never run this in production!
 *
 * Usage:
 *   npx prisma db seed
 *
 * Or manually:
 *   npx ts-node prisma/seed.ts
 */

// Test user ID (replace with your Clerk user ID for testing)
const TEST_USER_ID = "user_test_dashboard_123";

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean up existing test data
  console.log("🧹 Cleaning up existing test data...");
  await cleanupTestData();

  // Create fields
  console.log("🏞️  Creating fields...");
  const fields = await createFields();

  // Create crops
  console.log("🌾 Creating crops...");
  const crops = await createCrops(fields);

  // Create tasks
  console.log("📋 Creating tasks...");
  await createTasks(crops);

  // Create activity logs
  console.log("💧 Creating irrigation logs...");
  await createIrrigationLogs(crops);

  console.log("🌿 Creating fertilizer logs...");
  await createFertilizerLogs(crops);

  console.log("🐛 Creating pest/disease logs...");
  await createPestDiseaseLogs(crops);

  console.log("🌾 Creating harvest logs...");
  await createHarvestLogs(crops);

  // Create equipment
  console.log("🚜 Creating equipment...");
  const equipment = await createEquipment();

  // Create financial data
  console.log("💰 Creating financial accounts...");
  const accounts = await createFinancialAccounts();

  console.log("💳 Creating financial transactions...");
  await createFinancialTransactions(accounts, crops, fields);

  console.log("✅ Seed completed successfully!");
  console.log(`
📊 Summary:
  - Fields: ${fields.length}
  - Crops: ${crops.length}
  - Equipment: ${equipment.length}
  - Financial Accounts: ${accounts.length}
  
🎯 Test User ID: ${TEST_USER_ID}
  
⚠️  Remember: This is DEVELOPMENT data only!
  `);
}

async function cleanupTestData() {
  // Delete in correct order to respect foreign key constraints
  await prisma.harvestLog.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.pestDiseaseLog.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.fertilizerLog.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.irrigationLog.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.task.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.financialTransaction.deleteMany({
    where: { userId: TEST_USER_ID },
  });
  await prisma.financialAccount.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.crop.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.field.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.equipment.deleteMany({ where: { userId: TEST_USER_ID } });
}

async function createFields() {
  const fields = [];

  // North Field
  fields.push(
    await prisma.field.create({
      data: {
        userId: TEST_USER_ID,
        name: "North Field",
        description: "Main production field with good drainage",
        area: 25.5,
        unit: "acres",
        latitude: 40.7128,
        longitude: -74.006,
        address: "North Section, Main Farm",
        soilType: "Loamy",
        drainageType: "Good",
        irrigationType: "Drip",
        isActive: true,
      },
    })
  );

  // South Field
  fields.push(
    await prisma.field.create({
      data: {
        userId: TEST_USER_ID,
        name: "South Field",
        description: "Smaller field for specialty crops",
        area: 12.3,
        unit: "acres",
        latitude: 40.71,
        longitude: -74.008,
        address: "South Section, Main Farm",
        soilType: "Sandy Loam",
        drainageType: "Moderate",
        irrigationType: "Sprinkler",
        isActive: true,
      },
    })
  );

  // East Field
  fields.push(
    await prisma.field.create({
      data: {
        userId: TEST_USER_ID,
        name: "East Field",
        description: "Recently acquired field",
        area: 18.7,
        unit: "acres",
        latitude: 40.715,
        longitude: -74.004,
        address: "East Section, Main Farm",
        soilType: "Clay Loam",
        drainageType: "Poor",
        irrigationType: "Flood",
        isActive: true,
      },
    })
  );

  return fields;
}

async function createCrops(fields: any[]) {
  const crops = [];
  const now = new Date();

  // Active crops in various stages
  crops.push(
    await prisma.crop.create({
      data: {
        userId: TEST_USER_ID,
        fieldId: fields[0].id,
        name: "Tomatoes",
        variety: "Beefsteak",
        plantingDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
        expectedHarvestDate: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          15
        ),
        status: "GROWING",
        area: 5.2,
      },
    })
  );

  crops.push(
    await prisma.crop.create({
      data: {
        userId: TEST_USER_ID,
        fieldId: fields[0].id,
        name: "Corn",
        variety: "Sweet Corn",
        plantingDate: new Date(now.getFullYear(), now.getMonth() - 1, 20),
        expectedHarvestDate: new Date(
          now.getFullYear(),
          now.getMonth() + 2,
          10
        ),
        status: "PLANTED",
        area: 10.5,
      },
    })
  );

  crops.push(
    await prisma.crop.create({
      data: {
        userId: TEST_USER_ID,
        fieldId: fields[1].id,
        name: "Lettuce",
        variety: "Romaine",
        plantingDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
        expectedHarvestDate: new Date(now.getFullYear(), now.getMonth(), 25),
        status: "FLOWERING",
        area: 3.8,
      },
    })
  );

  crops.push(
    await prisma.crop.create({
      data: {
        userId: TEST_USER_ID,
        fieldId: fields[1].id,
        name: "Carrots",
        variety: "Nantes",
        plantingDate: new Date(now.getFullYear(), now.getMonth() - 2, 10),
        expectedHarvestDate: new Date(now.getFullYear(), now.getMonth(), 20),
        status: "FRUITING",
        area: 4.2,
      },
    })
  );

  crops.push(
    await prisma.crop.create({
      data: {
        userId: TEST_USER_ID,
        fieldId: fields[2].id,
        name: "Wheat",
        variety: "Hard Red Winter",
        plantingDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        expectedHarvestDate: new Date(
          now.getFullYear(),
          now.getMonth() + 3,
          15
        ),
        status: "GROWING",
        area: 15.0,
      },
    })
  );

  // Recently harvested crop
  crops.push(
    await prisma.crop.create({
      data: {
        userId: TEST_USER_ID,
        fieldId: fields[0].id,
        name: "Strawberries",
        variety: "June-bearing",
        plantingDate: new Date(now.getFullYear(), now.getMonth() - 4, 1),
        expectedHarvestDate: new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          15
        ),
        actualHarvestDate: new Date(now.getFullYear(), now.getMonth() - 1, 18),
        status: "HARVESTED",
        area: 2.5,
      },
    })
  );

  return crops;
}

async function createTasks(crops: any[]) {
  const now = new Date();

  // Pending tasks
  await prisma.task.create({
    data: {
      userId: TEST_USER_ID,
      cropId: crops[0].id,
      title: "Water tomatoes",
      description: "Check soil moisture and water if needed",
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
      priority: "HIGH",
      category: "IRRIGATION",
      status: "PENDING",
    },
  });

  await prisma.task.create({
    data: {
      userId: TEST_USER_ID,
      cropId: crops[1].id,
      title: "Apply fertilizer to corn",
      description: "Side-dress with nitrogen fertilizer",
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
      priority: "MEDIUM",
      category: "FERTILIZATION",
      status: "PENDING",
    },
  });

  // Overdue task
  await prisma.task.create({
    data: {
      userId: TEST_USER_ID,
      cropId: crops[2].id,
      title: "Inspect lettuce for pests",
      description: "Check for aphids and other pests",
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
      priority: "URGENT",
      category: "PEST_CONTROL",
      status: "PENDING",
    },
  });

  // In progress task
  await prisma.task.create({
    data: {
      userId: TEST_USER_ID,
      cropId: crops[3].id,
      title: "Thin carrot seedlings",
      description: "Thin to 2 inches apart",
      dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      priority: "MEDIUM",
      category: "MAINTENANCE",
      status: "IN_PROGRESS",
    },
  });

  // Completed tasks
  await prisma.task.create({
    data: {
      userId: TEST_USER_ID,
      cropId: crops[4].id,
      title: "Plant wheat seeds",
      description: "Drill wheat seeds at recommended depth",
      dueDate: new Date(now.getFullYear(), now.getMonth() - 3, 5),
      completedAt: new Date(now.getFullYear(), now.getMonth() - 3, 3),
      priority: "HIGH",
      category: "PLANTING",
      status: "COMPLETED",
    },
  });

  await prisma.task.create({
    data: {
      userId: TEST_USER_ID,
      cropId: crops[5].id,
      title: "Harvest strawberries",
      description: "Pick ripe strawberries",
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      completedAt: new Date(now.getFullYear(), now.getMonth() - 1, 18),
      priority: "HIGH",
      category: "HARVESTING",
      status: "COMPLETED",
    },
  });
}

async function createIrrigationLogs(crops: any[]) {
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const crop = crops[Math.floor(Math.random() * (crops.length - 1))]; // Exclude harvested crop

    await prisma.irrigationLog.create({
      data: {
        userId: TEST_USER_ID,
        cropId: crop.id,
        date: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysAgo
        ),
        duration: 30 + Math.floor(Math.random() * 90), // 30-120 minutes
        waterAmount: 500 + Math.floor(Math.random() * 1500), // 500-2000 liters
        method: ["DRIP", "SPRINKLER", "FLOOD"][
          Math.floor(Math.random() * 3)
        ] as any,
        notes: i % 3 === 0 ? "Soil was dry, increased duration" : undefined,
      },
    });
  }
}

async function createFertilizerLogs(crops: any[]) {
  const now = new Date();
  const fertilizerTypes = [
    "10-10-10 NPK",
    "Urea",
    "Compost",
    "Fish Emulsion",
    "Bone Meal",
  ];

  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 45);
    const crop = crops[Math.floor(Math.random() * (crops.length - 1))];

    await prisma.fertilizerLog.create({
      data: {
        userId: TEST_USER_ID,
        cropId: crop.id,
        date: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysAgo
        ),
        fertilizerType:
          fertilizerTypes[Math.floor(Math.random() * fertilizerTypes.length)],
        amount: 5 + Math.floor(Math.random() * 45), // 5-50 kg
        applicationMethod: ["BROADCAST", "BAND", "FOLIAR"][
          Math.floor(Math.random() * 3)
        ] as any,
        notes:
          i % 4 === 0
            ? "Applied according to soil test recommendations"
            : undefined,
      },
    });
  }
}

async function createPestDiseaseLogs(crops: any[]) {
  const now = new Date();
  const pests = ["Aphids", "Caterpillars", "Beetles", "Whiteflies"];
  const diseases = ["Powdery Mildew", "Blight", "Root Rot", "Leaf Spot"];

  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const crop = crops[Math.floor(Math.random() * (crops.length - 1))];
    const isPest = Math.random() > 0.5;

    await prisma.pestDiseaseLog.create({
      data: {
        userId: TEST_USER_ID,
        cropId: crop.id,
        date: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysAgo
        ),
        type: isPest ? "PEST" : "DISEASE",
        name: isPest
          ? pests[Math.floor(Math.random() * pests.length)]
          : diseases[Math.floor(Math.random() * diseases.length)],
        severity: ["LOW", "MEDIUM", "HIGH"][
          Math.floor(Math.random() * 3)
        ] as any,
        affectedArea: 0.5 + Math.random() * 4.5, // 0.5-5 square meters
        treatment:
          i % 2 === 0 ? "Applied organic pesticide" : "Removed affected plants",
        notes: "Monitoring closely",
      },
    });
  }
}

async function createHarvestLogs(crops: any[]) {
  const now = new Date();
  const harvestedCrop = crops[crops.length - 1]; // The strawberries

  // Multiple harvest sessions for strawberries
  for (let i = 0; i < 5; i++) {
    await prisma.harvestLog.create({
      data: {
        userId: TEST_USER_ID,
        cropId: harvestedCrop.id,
        harvestDate: new Date(now.getFullYear(), now.getMonth() - 1, 15 + i),
        quantity: 15 + Math.floor(Math.random() * 35), // 15-50 kg
        unit: "kg",
        qualityGrade: ["EXCELLENT", "GOOD", "FAIR"][
          Math.floor(Math.random() * 3)
        ] as any,
        notes: i === 0 ? "First harvest of the season" : undefined,
      },
    });
  }
}

async function createEquipment() {
  const equipment = [];

  equipment.push(
    await prisma.equipment.create({
      data: {
        userId: TEST_USER_ID,
        name: "John Deere 5075E",
        equipmentType: "TRACTOR",
        category: "POWER",
        brand: "John Deere",
        model: "5075E",
        status: "ACTIVE",
        condition: "GOOD",
        fuelType: "DIESEL",
        horsepower: 75,
        hoursUsed: 1250,
        serviceInterval: 250,
        lastServiceDate: new Date(
          new Date().setMonth(new Date().getMonth() - 2)
        ),
        nextServiceDue: new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        ),
      },
    })
  );

  equipment.push(
    await prisma.equipment.create({
      data: {
        userId: TEST_USER_ID,
        name: "Disc Harrow",
        equipmentType: "DISC",
        category: "TILLAGE",
        status: "ACTIVE",
        condition: "EXCELLENT",
        workingWidth: 12,
      },
    })
  );

  equipment.push(
    await prisma.equipment.create({
      data: {
        userId: TEST_USER_ID,
        name: "Boom Sprayer",
        equipmentType: "SPRAYER",
        category: "SPRAYING",
        status: "MAINTENANCE",
        condition: "FAIR",
        workingWidth: 30,
      },
    })
  );

  return equipment;
}

async function createFinancialAccounts() {
  const accounts = [];

  accounts.push(
    await prisma.financialAccount.create({
      data: {
        userId: TEST_USER_ID,
        accountName: "Farm Operating Account",
        accountType: "CHECKING",
        balance: 45000,
        isActive: true,
      },
    })
  );

  accounts.push(
    await prisma.financialAccount.create({
      data: {
        userId: TEST_USER_ID,
        accountName: "Farm Savings",
        accountType: "SAVINGS",
        balance: 125000,
        isActive: true,
      },
    })
  );

  return accounts;
}

async function createFinancialTransactions(
  accounts: any[],
  crops: any[],
  fields: any[]
) {
  const now = new Date();

  // Income transactions
  for (let i = 0; i < 8; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    await prisma.financialTransaction.create({
      data: {
        userId: TEST_USER_ID,
        accountId: accounts[0].id,
        cropId:
          i < 4
            ? crops[Math.floor(Math.random() * crops.length)].id
            : undefined,
        amount: 1000 + Math.floor(Math.random() * 9000), // $1,000-$10,000
        transactionType: "INCOME",
        description: "Crop sales",
        transactionDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysAgo
        ),
        paymentMethod: "BANK_TRANSFER",
        paymentStatus: "PAID",
      },
    });
  }

  // Expense transactions
  const expenseDescriptions = [
    "Seeds purchase",
    "Fertilizer purchase",
    "Equipment maintenance",
    "Fuel",
    "Labor costs",
    "Irrigation supplies",
    "Pest control products",
    "Equipment rental",
  ];

  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    await prisma.financialTransaction.create({
      data: {
        userId: TEST_USER_ID,
        accountId: accounts[0].id,
        cropId:
          i < 8
            ? crops[Math.floor(Math.random() * crops.length)].id
            : undefined,
        fieldId:
          i >= 8
            ? fields[Math.floor(Math.random() * fields.length)].id
            : undefined,
        amount: 100 + Math.floor(Math.random() * 2900), // $100-$3,000
        transactionType: "EXPENSE",
        description:
          expenseDescriptions[
            Math.floor(Math.random() * expenseDescriptions.length)
          ],
        transactionDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysAgo
        ),
        paymentMethod: ["CASH", "CHECK", "CREDIT_CARD"][
          Math.floor(Math.random() * 3)
        ] as any,
        paymentStatus: Math.random() > 0.2 ? "PAID" : "PENDING",
      },
    });
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
