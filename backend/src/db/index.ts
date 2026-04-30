import { PrismaClient } from "@prisma/client";
import { PrismaBunSqlite } from "prisma-adapter-bun-sqlite";

// Prisma 7 requires a driver adapter — using bun:sqlite native adapter
const adapter = new PrismaBunSqlite({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

// Singleton pattern: reuse a single PrismaClient instance across the app
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
