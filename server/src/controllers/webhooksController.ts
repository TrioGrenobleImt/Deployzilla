import { Request, Response, RequestHandler } from "express";
// import { verifyGitHubSignature } from "../utils/cryptoUtils.js";
import { Project } from "../models/projectModel.js";
import { User } from "../models/userModel.js";
import { createLog } from "./logController.js";
import { logLevels } from "../utils/enums/logLevels.js";
import { io } from "../sockets/socket.js";

/**
 * Triggers the pipeline runner via cURL
 */
const triggerPipeline = async (projectId: string, commitHash?: string, author?: string): Promise<string> => {
  const runnerUrl = process.env.PIPELINE_RUNNER_URL;

  const payload = JSON.stringify({ projectId, commitHash, author });
  const curlCommand = `curl -X POST "${runnerUrl}" -H "Content-Type: application/json" -d '${payload}'`;

  const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    import("child_process").then(({ exec }) => {
      exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
          reject({ error, stdout, stderr });
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  });

  if (stderr && stderr.includes("curl: not found")) {
    throw new Error("cURL not found in container. Please rebuild image.");
  }

  return stdout;
};

/**
 * Handles incoming GitHub webhooks.
 */
export const handleGitHubWebhook: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPayload = req.body.payload ? JSON.parse(req.body.payload) : req.body;
    const { ref, repository } = rawPayload;

    if (!ref || !repository) {
      res.status(200).send("Not a push event");
      return;
    }

    const branch = ref.replace("refs/heads/", "");
    const repoUrl = repository.clone_url;
    const commitHash = rawPayload.head_commit?.id || rawPayload.after;
    const author = rawPayload.head_commit?.committer?.username || rawPayload.head_commit?.committer?.name || rawPayload.pusher?.name;

    const project = await Project.findOne({ repoUrl });

    if (project && project.autoDeploy && project.branch === branch) {
      try {
        const stdout = await triggerPipeline(project.id, commitHash, author);

        io?.emit("pipeline-started", { projectId: project.id });

        createLog({
          message: `Pipeline triggered via GitHub Webhook for project ${project.name} (Commit: ${commitHash?.substring(0, 7)})`,
          userId: undefined as any,
          level: logLevels.INFO,
        });

        res.status(200).send({ message: stdout });
        return;
      } catch (err: any) {
        res.status(500).send({ error: err.message });
        return;
      }
    }

    res.status(200).send("OK - No project matching or auto-deploy disabled");
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    res.status(500).send("Internal Server Error");
  }
};

/**
 * Handles manual pipeline trigger from the UI.
 */
export const handleManualTrigger: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      res.status(400).json({ error: "Project ID is required" });
      return;
    }

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const user = await User.findById(req.userId);
    const author = user?.username || "Unknown";

    const stdout = await triggerPipeline(project.id, undefined, author);

    io?.emit("pipeline-started", { projectId: project.id });

    createLog({
      message: `User ${author} manually triggered pipeline for project ${project.name}`,
      userId: req.userId as any,
      level: logLevels.INFO,
    });

    res.status(200).json({ message: stdout });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
