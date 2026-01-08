import { Request, Response, RequestHandler } from "express";
// import { verifyGitHubSignature } from "../utils/cryptoUtils.js";
// import { redisClient } from "../utils/redisClient.js";
import { Project } from "../models/projectModel.js";
import { User } from "../models/userModel.js";
import { Pipeline } from "../models/pipelineModel.js";
import { createLog } from "./logController.js";
import { logLevels } from "../utils/enums/logLevels.js";
import { io } from "../sockets/socket.js";

/**
 * Triggers the pipeline runner via cURL
 */
const triggerPipeline = async (projectId: string, trigger: string, commitHash?: string, author?: string): Promise<string> => {
  const runnerUrl = process.env.PIPELINE_RUNNER_URL;

  const payload = JSON.stringify({ projectId, trigger, commitHash, author });
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
    const sshUrl = repository.ssh_url;
    const commitHash = rawPayload.head_commit?.id || rawPayload.after;
    const username = rawPayload.head_commit?.committer?.username || rawPayload.head_commit?.committer?.name || rawPayload.pusher?.name;
    const author = `${username} via Github`;

    const project = await Project.findOne({
      $or: [{ repoUrl: repoUrl }, { repoUrl: sshUrl }],
    });

    if (project && project.autoDeploy && project.branch === branch) {
      try {
        const stdout = await triggerPipeline(project.id, "github", commitHash, username);

        // Find the newly created pipeline and update its trigger intent
        const latestPipeline = await Pipeline.findOne({ projectId: project.id }).sort({ createdAt: -1 });
        if (latestPipeline) {
          await Pipeline.findByIdAndUpdate(latestPipeline._id, {
            trigger: "github",
            triggerAuthor: username, // Use username for GitHub
            author: username,
          });
        }

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
    const { projectId, commitHash } = req.body;

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
    let author = "Unknown via Deployzilla";

    if (user) {
      const formattedForename = user.forename.charAt(0).toUpperCase() + user.forename.slice(1).toLowerCase();
      author = `${formattedForename} ${user.name}`;
    }

    const startTime = new Date();
    const stdout = await triggerPipeline(project.id, "manual", commitHash, author);
    console.log("Runner output:", stdout);

    let pipelineId: string | undefined;
    try {
      const responseCtx = JSON.parse(stdout);
      pipelineId = responseCtx._id || responseCtx.id || responseCtx.pipelineId;
      console.log("Parsed Pipeline ID:", pipelineId);
    } catch (e) {
      console.warn("Failed to parse runner stdout:", e);
    }

    // Attempt to find the new pipeline.
    // If we have an ID, great. If not, we poll for a pipeline created AFTER our start time.
    let latestPipeline;
    let attempts = 0;
    while (attempts < 5) {
      if (pipelineId) {
        latestPipeline = await Pipeline.findById(pipelineId);
      } else {
        // Find the most recent pipeline for this project
        const candidate = await Pipeline.findOne({ projectId: project.id }).sort({ createdAt: -1 });

        // Check if it's actually new (created after we started this request - buffer of 1s)
        if (candidate && new Date(candidate.createdAt).getTime() >= startTime.getTime() - 1000) {
          latestPipeline = candidate;
        }
      }

      if (latestPipeline) break;

      // Wait 500ms before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    if (latestPipeline) {
      // Ensure we overwrite explicitly
      const result = await Pipeline.findByIdAndUpdate(
        latestPipeline._id,
        {
          trigger: "manual",
          triggerAuthor: author,
          author: author,
        },
        { new: true },
      );
      console.log("Updated pipeline metadata:", result?.trigger, result?.author);

      io?.emit("pipeline-started", {
        projectId: project.id,
        pipelineId: latestPipeline._id,
        pipeline: {
          _id: latestPipeline._id,
          commitHash: latestPipeline.commitHash,
          author: author,
          trigger: "manual",
          createdAt: latestPipeline.createdAt,
        },
      });
    } else {
      // Fallback if no pipeline found (unlikely if runner worked)
      io?.emit("pipeline-started", { projectId: project.id });
    }

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
