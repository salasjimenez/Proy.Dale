import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { escenariosRouter } from "./escenarios.routes.js";
import { progresoRouter } from "./progreso.routes.js";
import { mapaRouter } from "./mapa.routes.js";
import { sesionesRouter } from "./sesiones.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/escenarios", escenariosRouter);
apiRouter.use("/sesiones", sesionesRouter);
apiRouter.use("/progreso", progresoRouter);
apiRouter.use("/mapa", mapaRouter);
