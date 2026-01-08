import { Router } from "express";
import { createProject, getProjects, updateProject, deleteProject, getProjectStats } from "../controllers/projectController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { userRoles } from "../utils/enums/userRoles.js";

export const projectRouter = Router();

/**
 * @route GET /api/projects
 * @access Private
 */
projectRouter.get("/", verifyToken(), getProjects);

/**
 * @route GET /api/projects/stats
 * @access Private/Admin
 */
projectRouter.get("/stats", verifyToken({ role: userRoles.ADMIN }), getProjectStats);


/**
 * @route POST /api/projects
 * @access Private/Admin
 */
projectRouter.post("/", verifyToken({ role: userRoles.ADMIN }), createProject);

/**
 * @route PATCH /api/projects/:id
 * @access Private/Admin
 */
projectRouter.patch("/:id", verifyToken({ role: userRoles.ADMIN }), updateProject);

/**
 * @route DELETE /api/projects/:id
 * @access Private/Admin
 */
projectRouter.delete("/:id", verifyToken({ role: userRoles.ADMIN }), deleteProject);
