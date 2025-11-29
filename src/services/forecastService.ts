import { prisma } from "@/lib/prisma";

export class ForecastService {
  static async buildFeatures(groupId: string, horizonDays: number) {
    // Fetch historical data
    const production = await prisma.animalProduction.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
      take: 90, // last 90 days
    });

    const feed = await prisma.animalFeedRecord.findMany({
      where: { groupId },
      orderBy: { date: "desc" },
      take: 90,
    });

    const group = await prisma.animalGroup.findUnique({
      where: { id: groupId },
      include: { species: true },
    });

    if (!group) throw new Error("Group not found");

    return {
      history: production.map((p) => ({
        date: p.date.toISOString().split("T")[0],
        eggs: p.eggs || 0,
        weight: p.weightKg || 0,
      })),
      feed: feed.map((f) => ({
        date: f.date.toISOString().split("T")[0],
        type: f.feedType,
        quantity: f.quantityKg,
      })),
      metadata: {
        species: group.species.slug,
        breed: group.name, // using name as proxy for breed/strain if not separate
        quantity: group.quantity,
        startDate: group.startDate.toISOString().split("T")[0],
        ageDays: Math.floor(
          (Date.now() - group.startDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      },
      horizon: horizonDays,
    };
  }

  static async predict(features: any, modelName: string) {
    // Mock ML Service call
    // In real world: fetch(process.env.ML_SERVICE_URL + '/predict', ...)

    console.log(
      `Calling ML Service for model ${modelName} with features:`,
      JSON.stringify(features).substring(0, 100) + "..."
    );

    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock response logic
    const startDate = new Date();
    const predictions = [];
    const horizon = features.horizon || 30;
    const currentQty = features.metadata.quantity;

    // Simple decay model for eggs
    let dailyProduction = currentQty * 0.9; // 90% lay rate assumption start

    for (let i = 0; i < horizon; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i + 1);

      // Random fluctuation
      const noise = (Math.random() - 0.5) * 5;
      dailyProduction = Math.max(0, dailyProduction + noise - 0.1); // slight decline

      predictions.push({
        date: date.toISOString().split("T")[0],
        predictedEggs: Math.round(dailyProduction),
      });
    }

    return {
      score: 0.85 + Math.random() * 0.1,
      predictions,
      summary: {
        avgNext7Days: Math.round(
          predictions.slice(0, 7).reduce((a, b) => a + b.predictedEggs, 0) / 7
        ),
        confInterval: [
          Math.round(dailyProduction * 0.9),
          Math.round(dailyProduction * 1.1),
        ],
      },
    };
  }
}
