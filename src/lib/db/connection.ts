import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Enhanced Prisma configuration with connection pooling and timeouts
const createPrismaClient = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Enhanced connection test with retry logic
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connected successfully");
      return true;
    } catch (error) {
      console.error(
        `❌ Database connection attempt ${attempt}/${retries} failed:`,
        error
      );

      if (attempt === retries) {
        console.error("❌ All database connection attempts failed");
        return false;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Database operation with retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  operationName = "database operation"
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.error(
        `❌ ${operationName} attempt ${attempt}/${retries} failed:`,
        error
      );

      // Check if it's a connection error
      const isConnectionError =
        error?.code === "P1001" || // Can't reach database server
        error?.message?.includes("timeout") ||
        error?.message?.includes("connection") ||
        error?.message?.includes("ECONNREFUSED");

      if (attempt === retries || !isConnectionError) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏳ Retrying ${operationName} in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
}

// Enhanced graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("✅ Database disconnected successfully");
  } catch (error) {
    console.error("❌ Error disconnecting database:", error);
  }
}

// Connection health check
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;

    return {
      connected: true,
      latency,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
    };
  }
}
