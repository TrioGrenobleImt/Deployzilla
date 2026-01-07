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
                jobs = [{ name: rawJobs, status: parts[1] }];
              }
            }
            payload = {
              pipelineId: parts[0],
              status: parts[1],
              jobs: jobs,
            };
          }
        }

        if (!payload || !payload.pipelineId) {
          console.warn("Could not parse pipeline-status message or missing pipelineId:", message);
          return;
        }

        const { pipelineId, status, jobs } = payload;

        // Update MongoDB
        const updatedPipeline = await Pipeline.findByIdAndUpdate(pipelineId, { status, jobs }, { new: true });

        if (updatedPipeline) {
          console.log(`Updated pipeline ${pipelineId} to status ${status}`);

          // Broadcast update for history/stats refresh
          io?.emit("pipeline-updated", {
            projectId: updatedPipeline.projectId,
            pipelineId: updatedPipeline._id,
            status: updatedPipeline.status,
          });

          // Broadcast status change to frontend for timeline
          if (jobs && Array.isArray(jobs)) {
            const runningJob = jobs.find((j) => j.status === "RUNNING");
            if (runningJob) {
              const stageMap: { [key: string]: string } = {
                "git-clone": "1",
                CLONE: "1",
                eslint: "2",
                ESLINT: "2",
                sonar: "3",
                SONAR: "3",
                "docker-build": "4",
                BUILD: "4",
                "kubernetes-prep": "4",
                deploy: "5",
                DEPLOY: "5",
                "intrusion-tests": "6",
              };
              const stageId = stageMap[runningJob.name] || stageMap[runningJob.name.toUpperCase()];
              if (stageId) {
                io?.emit("pipeline-status", { stageId, status: "running", projectId: updatedPipeline.projectId });
              }
            }
          }

          // Broadcast completion
          if (status === "SUCCESS" || status === "FAILED") {
            io?.emit("pipeline-completed", {
              success: status === "SUCCESS",
              pipelineId,
              projectId: updatedPipeline.projectId,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error processing Redis message:", error);
    }
  });
}
