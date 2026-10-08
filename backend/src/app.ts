import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { healthRouter } from "./routes/health.routes.js";
import { apiRouter } from "./routes/index.js";
import { pingRouter } from "./routes/ping.routes.js";

export const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);
app.use(requestIdMiddleware);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.frontendOrigins.includes(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/ping", pingRouter);
app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
