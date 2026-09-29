import { Router } from "express";

export const sesionesRouter = Router();

sesionesRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "sesiones",
    status: "ready",
    implemented: false,
  });
});
