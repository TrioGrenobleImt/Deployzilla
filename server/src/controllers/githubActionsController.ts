import { Request, Response, RequestHandler } from "express";
// import { verifyGitHubSignature } from "../utils/cryptoUtils.js";
import { Project } from "../models/projectModel.js";

/**
 * Triggers the pipeline runner via cURL
 */
const triggerPipeline = async (repoUrl: string, branch: string): Promise<string> => {
  const runnerUrl = process.env.PIPELINE_RUNNER_URL;

  const payload = JSON.stringify({ repoUrl, branch });
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

    const project = await Project.findOne({ repoUrl });

    if (project && project.autoDeploy && project.branch === branch) {
      try {
        const stdout = await triggerPipeline(repoUrl, branch);
        res.status(200).send({ message: "Pipeline triggered via webhook", details: stdout });
        return;
      } catch (err: any) {
        const detail = err.stderr || err.message || String(err);
        res.status(500).send({ error: "Internal Server Error", details: detail });
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

    const stdout = await triggerPipeline(project.repoUrl, project.branch);
    res.status(200).json({ message: "Pipeline manually triggered", details: stdout });
  } catch (err: any) {
    const detail = err.stderr || err.message || String(err);
    console.error("Manual trigger error:", detail);
    res.status(500).json({ error: "Failed to trigger pipeline", details: detail });
  }
};
