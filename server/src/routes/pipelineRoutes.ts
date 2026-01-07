import { Router } from "express";
import { getProjectPipelines } from "../controllers/pipelineController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const pipelineRouter = Router();

/**
 * @route GET /api/pipelines/project/:projectId
 * @access Private
 */
pipelineRouter.get("/project/:projectId", verifyToken(), getProjectPipelines);
