import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: "../.env" });

export default defineConfig({
  schema: "src/database/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
