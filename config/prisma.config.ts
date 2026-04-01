import { config } from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

config({ path: path.resolve(__dirname, "../.env") });

export default defineConfig ({
  schema: path.resolve(__dirname, "./schema.prisma"),
  migrations: { path: path.resolve(__dirname, "./migrations") },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});