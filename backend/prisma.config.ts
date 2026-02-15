import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: "../.env" });

export default defineConfig({
  schema: "src/database/schema.prisma",
  migrations: {
    path: "../migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
