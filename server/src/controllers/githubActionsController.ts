import { Request, Response, RequestHandler } from "express";
import { verifyGitHubSignature } from "../utils/cryptoUtils.js";
import { Project } from "../models/projectModel.js";
import { Pipeline } from "../models/pipelineModel.js";
// import { redisPublisher } from "../utils/redisClient.js";

/**
 * Handles incoming GitHub webhooks.
 */
export const handleGitHubWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers["x-hub-signature-256"] as string;
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // if (!verifyGitHubSignature(req.body, signature, secret)) {
    //   console.warn("Invalid GitHub signature detected");
    //   res.status(403).send("Invalid signature");
    // }

    const rawPayload = req.body.payload ? JSON.parse(req.body.payload) : req.body;

    const { ref, repository } = rawPayload;

    if (!ref || !repository) {
      res.status(200).send("Not a push event");
      return;
    }

    const branch = ref.replace("refs/heads/", "");
    const repoUrl = repository.clone_url;

    // Finding the project associated with this repository URL
    // We use a regex or exact match depending on how URLs are stored
    const project = await Project.findOne({ repoUrl });

    if (project && project.autoDeploy && branch === project.branch) {
      // Create a new pipeline execution record
      //   const pipeline = await Pipeline.create({
      //     projectId: project._id,
      //     branch,
      //     status: "PENDING",
      //     trigger: "github",
      //   });

      //   // Publish the event to Redis for the runner to pick up
      //   await redisPublisher.publish(
      //     "pipeline:execute",
      //     JSON.stringify({
      //       pipelineId: pipeline._id,
      //       repoUrl: project.repoUrl,
      //       branch,
      //     }),
      //   );

      res.status(200).send({ message: "Pipeline triggered" });
    }

    res.status(200).send("OK - No action required");
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};
