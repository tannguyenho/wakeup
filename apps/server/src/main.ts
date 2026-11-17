import { serve } from "@hono/node-server";
import pg from "pg";
import { buildApp } from "./app";
import { configFromEnvironment } from "./config";

const config = configFromEnvironment();

const pool = config.databaseUrl ? new pg.Pool({ connectionString: config.databaseUrl }) : null;

const app = buildApp(config, {
  logRequests: true,
  isDatabaseUp: pool
    ? async () => {
        try {
          await pool.query("SELECT 1");
          return true;
        } catch {
          return false;
        }
      }
    : undefined,
});

const server = serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`wakeup-server nghe trên cổng ${info.port}`);
});

function shutdown() {
  server.close(() => {
    void pool?.end().finally(() => process.exit(0));
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
