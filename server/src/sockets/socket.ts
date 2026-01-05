import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { corsOptions } from "../configuration/corsOptions.js";
import { createLog } from "../controllers/logController.js";
import { logLevels } from "../utils/enums/logLevels.js";
import mongoose from "mongoose";

let io: SocketIOServer | undefined;

const userSocketMap: Record<string, string> = {};

/**
 * Initializes the Socket.IO server, manages user connections, and tracks online users.
 * @param httpServer - The HTTP server to integrate with Socket.IO.
 * @returns The initialized Socket.IO server instance.
 */
export function initSockets(httpServer: http.Server): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: corsOptions,
  });

  io.on("connection", (socket: Socket) => {
    // userId passed as query string (string | undefined)
    const userId = socket.handshake.query.userId;

    if (typeof userId === "string") {
      userSocketMap[userId] = socket.id;
      io?.emit("getOnlineUsers", Object.keys(userSocketMap)); // Broadcast updated online users
    }

    socket.on("disconnect", () => {
      if (typeof userId === "string") {
        delete userSocketMap[userId];
        io?.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    });

    // CI/CD Pipeline Simulation
    socket.on("start-pipeline", async () => {
      if (typeof userId === "string") {
        try {
            await createLog({
                message: "Deployment pipeline started",
                userId: new mongoose.Types.ObjectId(userId),
                level: logLevels.INFO
            });
        } catch (error) {
            console.error("Error creating log inside socket:", error);
        }
      }
      simulatePipeline(socket);
    });
  });

  return io;
}

function simulatePipeline(socket: Socket) {
  const stages = [
    { id: "1", name: "Source", logs: ["Fetching source from GitHub...", "Authenticating...", "Cloning repository...", "Switching to branch 'main'...", "Source fetched successfully."] },
    { id: "2", name: "Build", logs: ["Installing dependencies (pnpm install)...", "Resolving packages...", "Building project...", "Optimizing assets...", "Build completed successfully."] },
    { id: "3", name: "Tests", logs: ["Running unit tests...", "Executing test suite...", "Running integration tests...", "Validating coverage...", "All tests passed (142/142)."] },
    { id: "4", name: "Docker", logs: ["Building Docker image...", "Step 1/6: FROM node:18...", "Step 2/6: WORKDIR /app...", "Step 3/6: COPY ...", "Pushing image to registry...", "Image pushed successfully."] },
    { id: "5", name: "Deploy", logs: ["Connecting to production server...", "Stopping existing container...", "Pulling new image...", "Starting container...", "Health check passed.", "Deployment successful!"] }
  ];

  let currentStageIndex = 0;
  
  const processStage = () => {
    if (currentStageIndex >= stages.length) {
      socket.emit("pipeline-completed", { success: true });
      return;
    }

    const stage = stages[currentStageIndex];
    socket.emit("pipeline-status", { stageId: stage.id, status: "pending" }); // Actually running

    // Simulate logs for this stage
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex >= stage.logs.length) {
        clearInterval(logInterval);
        socket.emit("pipeline-status", { stageId: stage.id, status: "success" });
        currentStageIndex++;
        setTimeout(processStage, 1000); // Wait before next stage
        return;
      }

      socket.emit("pipeline-log", {
        id: Date.now().toString() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: stage.logs[logIndex],
        step: stage.name
      });
      
      // Update status to running on first log
      if (logIndex === 0) {
         socket.emit("pipeline-status", { stageId: stage.id, status: "running" });
      }

      logIndex++;
    }, 800); // Log speed
  };

  processStage();
}
