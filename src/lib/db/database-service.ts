import { prisma, withRetry, checkDatabaseHealth } from "./connection";

/**
 * Enhanced database service with automatic retry logic and connection management
 */
export class DatabaseService {
  /**
   * Execute a database operation with automatic retry on connection failures
   */
  static async execute<T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T> {
    return withRetry(operation, 3, operationName);
  }

  /**
   * Check if database is healthy and responsive
   */
  static async isHealthy(): Promise<boolean> {
    const health = await checkDatabaseHealth();
    return health.connected;
  }

  /**
   * Get database connection status and performance metrics
   */
  static async getStatus() {
    const health = await checkDatabaseHealth();

    return {
      status: health.connected ? "connected" : "disconnected",
      latency: health.latency,
      error: health.error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Ensure database connection is active before executing operations
   */
  static async ensureConnection(): Promise<void> {
    try {
      await prisma.$connect();
    } catch (error) {
      console.error("Failed to ensure database connection:", error);
      throw new Error("Database connection unavailable");
    }
  }

  /**
   * Execute a raw query with retry logic
   */
  static async query<T = any>(sql: string, values?: any[]): Promise<T> {
    return this.execute(
      () => prisma.$queryRawUnsafe(sql, ...(values || [])),
      `raw query: ${sql.substring(0, 50)}...`
    );
  }

  /**
   * Execute a transaction with retry logic
   */
  static async transaction<T>(
    operations: (
      tx: Omit<
        typeof prisma,
        | "$connect"
        | "$disconnect"
        | "$on"
        | "$transaction"
        | "$use"
        | "$extends"
      >
    ) => Promise<T>
  ): Promise<T> {
    return this.execute(
      () => prisma.$transaction(operations),
      "database transaction"
    );
  }
}

export default DatabaseService;
