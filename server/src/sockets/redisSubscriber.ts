import { redisSubscriberClient } from "../utils/redisClient.js";
import { io } from "./socket.js";

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
  redisSubscriberClient.subscribe("pipeline-logs", (err, count) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err.message);
      return;
    }
    console.log(`Subscribed to ${count} Redis channels. Listening for pipeline-logs...`);
  });

  redisSubscriberClient.on("message", async (channel, message) => {
    if (channel === "pipeline-logs") {
      console.log("Raw Redis message received:", message);
      try {
        let event;

        // Try to parse as JSON first
        if (message.startsWith("{")) {
          try {
            event = JSON.parse(message);
          } catch (e) {
            console.warn("Message started with { but failed to parse as JSON:", e.message);
          }
        }

        // If not JSON, handle the "pipelineId|message" format
        if (!event) {
          const pipeIndex = message.indexOf("|");
          if (pipeIndex !== -1) {
            const pipelineId = message.substring(0, pipeIndex);
            const content = message.substring(pipeIndex + 1);

            // Mapping raw messages to frontend events
            // Heuristic: If it looks like a stage status update, we could handle it.
            // For now, treat everything as a log.
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

            // Simple heuristic for "completed" or "failed" to update UI status
            if (content.includes("Pipeline Successful") || content.includes("Deployment successful")) {
              io?.emit("pipeline-completed", { success: true, pipelineId });
            } else if (content.includes("Pipeline Failed") || content.includes("failed")) {
              io?.emit("pipeline-completed", { success: false, pipelineId });
            }
          }
        }

        if (!event) {
          console.warn("Could not parse Redis message:", message);
          return;
        }

        console.log("Processing event:", event.type);

        // Broadcast to all connected clients
        if (event.type === "status") {
          io?.emit("pipeline-status", event.data);
        } else if (event.type === "log") {
          io?.emit("pipeline-log", event.data);
        } else if (event.type === "completed") {
          io?.emit("pipeline-completed", event.data);
        }
      } catch (error) {
        console.error("Error processing Redis message:", error);
      }
    }
  });
}
