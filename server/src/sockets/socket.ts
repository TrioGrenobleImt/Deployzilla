import { Server as SocketIOServer, Socket } from "socket.io";
import http from "http";
import { corsOptions } from "../configuration/corsOptions.js";
import { createLog } from "../controllers/logController.js";
import { logLevels } from "../utils/enums/logLevels.js";
import mongoose from "mongoose";

export let io: SocketIOServer | undefined;

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

    // Handle manual pipeline start (dashboard button)
    socket.on("start-pipeline", async () => {
      if (typeof userId === "string") {
        try {
          await createLog({
            message: "Deployment pipeline triggered from dashboard",
            userId: new mongoose.Types.ObjectId(userId),
            level: logLevels.INFO,
          });
        } catch (error) {
          console.error("Error creating log inside socket:", error);
        }
      }
      // Simulation removed: updates now come from Redis subscriber
    });
  });

  return io;
}
