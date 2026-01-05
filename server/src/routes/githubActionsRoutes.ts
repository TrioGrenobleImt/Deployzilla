import { Router } from "express";
import { handleGitHubWebhook } from "../controllers/githubActionsController.js";

export const githubRouter = Router();

/**
 * @route POST /webhooks/github
 * @description Receives GitHub webhooks to trigger deployments.
 * @access Public (Requires GitHub HMAC signature)
 */
githubRouter.post("/github", handleGitHubWebhook);
