import { prisma } from "../connection";
import DatabaseService from "../database-service";

export class FieldService {
  static async findAllByUser(userId: string) {
    return DatabaseService.execute(
      () =>
        prisma.field.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      "find fields by user"
    );
  }

  static async findFirstByUser(userId: string) {
    return DatabaseService.execute(
      () =>
        prisma.field.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      "find first field by user"
    );
  }
}
