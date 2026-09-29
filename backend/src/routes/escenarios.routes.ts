import { Router } from "express";

export const escenariosRouter = Router();

escenariosRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "escenarios",
    status: "ready",
    implemented: false,
  });
});
