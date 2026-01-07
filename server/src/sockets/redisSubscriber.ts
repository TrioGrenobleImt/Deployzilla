import { redisSubscriberClient } from "../utils/redisClient.js";
import { io } from "./socket.js";
import { Pipeline } from "../models/pipelineModel.js";

/**
 * Listens for pipeline events from Redis and broadcasts them via Socket.IO.
 * The runner publishes to the "pipeline-logs" channel.
 * Expected payload format:
 * {
 *   "type": "status" | "log" | "completed",
 *   "data": { ... }
 * }
 */
export function initRedisSubscriber() {
  redisSubscriberClient.subscribe("pipeline-logs", "pipeline-status", (err, count) => {
    if (err) {
      console.error("Failed to subscribe to Redis channels:", err.message);
      return;
    }
    console.log(`Subscribed to ${count} Redis channels. Listening for pipeline-logs and pipeline-status...`);
  });

  redisSubscriberClient.on("message", async (channel, message) => {
    try {
      if (channel === "pipeline-logs") {
        console.log("Raw Redis log received:", message);
        let event;

        // Try to parse as JSON first
        if (message.startsWith("{")) {
          try {
            event = JSON.parse(message);
          } catch (e) {
            console.warn("Log message started with { but failed to parse as JSON:", (e as any).message);
          }
        }

        // If not JSON, handle the "pipelineId|message" format
        if (!event) {
          const pipeIndex = message.indexOf("|");
          if (pipeIndex !== -1) {
            const pipelineId = message.substring(0, pipeIndex);
            const content = message.substring(pipeIndex + 1);

            event = {
              type: "log",
              data: {
                id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toLocaleTimeString(),
                level: content.toLowerCase().includes("error") || content.toLowerCase().includes("failed") ? "error" : "info",
                message: content,
                pipelineId: pipelineId,
              },
            };
          }
        }

        if (event) {
          console.log("Processing log event:", event.type);
          if (event.type === "log") {
            // Save log to MongoDB
            const logData = event.data;
            if (logData.pipelineId) {
              await Pipeline.findByIdAndUpdate(logData.pipelineId, {
                $push: { logs: logData },
              });
            }
            io?.emit("pipeline-log", event.data);
          }
        }
      } else if (channel === "pipeline-status") {
        console.log("Raw Redis status received:", message);
        let payload;

        if (message.startsWith("{")) {
          try {
            payload = JSON.parse(message);
          } catch (e: any) {
            console.warn("Status message started with { but failed to parse as JSON:", e.message);
          }
        }

        if (!payload) {
          const parts = message.split("|");
          if (parts.length >= 2) {
            let jobs: any[] = [];
            const rawJobs = parts[2];
            if (rawJobs) {
              if (rawJobs.startsWith("[")) {
                try {
                  jobs = JSON.parse(rawJobs);
                } catch (e) {
                  console.warn("Failed to parse jobs JSON array from status message:", rawJobs);
                }
              } else {
                // Handle single job name format: pipelineId|status|jobName
                jobs = [{ name: rawJobs.trim(), status: parts[1].trim() }];
              }
            }
            payload = {
              pipelineId: parts[0].trim(),
              status: parts[1].trim(),
              jobs: jobs,
            };
          }
        }

        if (!payload || !payload.pipelineId) {
          console.warn("Could not parse pipeline-status message or missing pipelineId:", message);
          return;
        }

        const { pipelineId, status, jobs } = payload;

        // Get the current job name (from the third part of the message)
        const currentJobName = jobs && jobs.length > 0 ? jobs[0].name : null;

        // Get projectId from the existing pipeline
        const existingPipeline = await Pipeline.findById(pipelineId);
        const projectId = existingPipeline?.projectId;
        const wasRunning = existingPipeline?.status === "RUNNING";

        // Update status and currentStage in MongoDB
        if (existingPipeline) {
          const updateData: any = { status };
          if (currentJobName) {
            updateData.currentStage = currentJobName;
          }
          await Pipeline.findByIdAndUpdate(pipelineId, updateData);
          console.log(`Updated pipeline ${pipelineId} to status ${status}, currentStage: ${currentJobName}`);
        }

        // Emit pipeline-started when first transitioning to RUNNING
        if (status === "RUNNING" && !wasRunning && projectId) {
          const pipeline = await Pipeline.findById(pipelineId);
          io?.emit("pipeline-started", {
            projectId,
            pipelineId,
            pipeline: {
              _id: pipeline?._id,
              commitHash: pipeline?.commitHash,
              author: pipeline?.author,
              createdAt: pipeline?.createdAt,
            },
          });
        }

        // Broadcast status change to frontend for timeline (from Redis data)
        if (jobs && Array.isArray(jobs)) {
          const runningJob = jobs.find((j) => j.status === "RUNNING");
          if (runningJob) {
            const stageMap: { [key: string]: string } = {
              // Stage 1: Clone
              "git-clone": "1",
              "GIT-CLONE": "1",
              CLONE: "1",
              // Stage 2: Dépendances
              "npm-install": "2",
              "NPM-INSTALL": "2",
              DEPENDENCIES: "2",
              // Stage 3: Eslint
              eslint: "3",
              ESLINT: "3",
              "npm-lint": "3",
              "NPM-LINT": "3",
              // Stage 4: Tests unitaires
              "unit-tests": "4",
              "UNIT-TESTS": "4",
              TESTS: "4",
              "npm-test": "4",
              "NPM-TEST": "4",
              // Stage 5: Build
              "docker-build": "5",
              "DOCKER-BUILD": "5",
              BUILD: "5",
              // Stage 6: Déploiement
              deploy: "6",
              DEPLOY: "6",
              "kubernetes-prep": "6",
              "KUBERNETES-PREP": "6",
              // Stage 7: Tests Intrusions
              "intrusion-tests": "7",
              "INTRUSION-TESTS": "7",
              INTRUSION: "7",
            };
            const stageId = stageMap[runningJob.name] || stageMap[runningJob.name.toUpperCase()];
            if (stageId && projectId) {
              io?.emit("pipeline-status", { stageId, status: "running", projectId });
            }
          }
        }

        // Broadcast completion with full pipeline data from DB
        if ((status === "SUCCESS" || status === "FAILED") && projectId) {
          const completedPipeline = await Pipeline.findById(pipelineId);
          io?.emit("pipeline-completed", {
            success: status === "SUCCESS",
            pipelineId,
            projectId,
            pipeline: completedPipeline,
          });
        }
      }
    } catch (error) {
      console.error("Error processing Redis message:", error);
    }
  });
}
