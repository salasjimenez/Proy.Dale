import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();

    const server = app.listen(env.port, () => {
      console.log(`Dale backend listening on http://localhost:${env.port}`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`${signal} received. Shutting down Dale backend...`);

      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error("Dale backend could not start because PostgreSQL is unavailable.");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

void bootstrap();
