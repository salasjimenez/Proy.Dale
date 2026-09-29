import { Router } from "express";

export const authRouter = Router();

authRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "auth",
    status: "ready",
    implemented: false,
  });
});
