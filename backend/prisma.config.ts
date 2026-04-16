import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // 1. Tell Prisma where your schema is
  schema: "prisma/schema.prisma",

  // 2. Configure where migrations go
  migrations: {
    path: "prisma/migrations",
  },

  // 3. This is where the DB connection goes (NOT inside migrations)
  datasource: {
    url: env("DATABASE_URL"), 
  },
});