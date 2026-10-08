import { createApp } from "./app.js";
import { prisma } from "./utils/prisma.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`[api] UNO SUJATA API listening on http://localhost:${port}`);
});

// Close HTTP and database connections cleanly on shutdown.
async function shutdown(signal: string) {
  console.log(`[api] ${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
