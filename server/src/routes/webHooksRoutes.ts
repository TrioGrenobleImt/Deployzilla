import express, { Router } from "express";
import { handleGitHubWebhook, handleManualTrigger } from "../controllers/githubActionsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const webhookRooter: Router = express.Router();

/**
 * @route POST /webhooks/github
 * @description Receives GitHub webhooks to trigger deployments.
 * @access Public (Requires GitHub HMAC signature)
 */
webhookRooter.post("/github", handleGitHubWebhook);

/**
 * @route POST /webhooks/trigger
 * @description Manually trigger a pipeline for a project.
 * @access Private (Users only)
 */
webhookRooter.post("/trigger", verifyToken(), handleManualTrigger);
