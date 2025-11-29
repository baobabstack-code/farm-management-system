import { Worker, Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { ForecastService } from "@/services/forecastService";

// Note: This worker needs to be run in a separate process or via a custom server entry point.
// For Next.js serverless, this pattern is tricky. Usually we use a separate Node script or QStash.
// We will provide this as a script that can be run via `node src/workers/forecastWorker.ts` (compiled).

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

console.log("Starting Forecast Worker...");

const worker = new Worker(
  "animal-forecast",
  async (job: Job) => {
    console.log(`Processing job ${job.id} for forecast ${job.data.forecastId}`);
    const { forecastId, groupId, model, horizonDays } = job.data;

    try {
      await prisma.animalForecast.update({
        where: { id: forecastId },
        data: { status: "running" },
      });

      const features = await ForecastService.buildFeatures(
        groupId,
        horizonDays
      );
      const output = await ForecastService.predict(features, model);

      await prisma.animalForecast.update({
        where: { id: forecastId },
        data: {
          status: "completed",
          outputJson: output as any, // Prisma Json type workaround
          score: output.score,
          runAt: new Date(),
        },
      });

      console.log(`Job ${job.id} completed successfully.`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await prisma.animalForecast.update({
        where: { id: forecastId },
        data: { status: "failed" },
      });
      throw error;
    }
  },
  { connection }
);

worker.on("completed", (job: Job | undefined) => {
  console.log(`Job ${job?.id} has completed!`);
});

worker.on("failed", (job: Job | undefined, err: Error) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
