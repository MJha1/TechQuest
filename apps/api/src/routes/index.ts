import { Router } from "express";
import { healthRouter } from "./health.routes.js";
import { meRouter } from "./me.routes.js";
import { childrenRouter } from "./children.routes.js";
import { missionsRouter } from "./mission.routes.js";
import { parentRouter } from "./parent.routes.js";

/** Root API router. Feature routers mount here under `/api`. */
export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/me", meRouter);
apiRouter.use("/children", childrenRouter);
apiRouter.use("/missions", missionsRouter);
apiRouter.use("/parent", parentRouter);
