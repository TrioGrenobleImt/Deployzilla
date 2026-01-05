// import Redis from "ioredis";

// const redisUrl = process.env.REDIS_URI || "redis://localhost:6379";

// /**
//  * Centralized Redis client for publishing events.
//  */
// export const redisPublisher = new Redis(redisUrl);

// redisPublisher.on("error", (err) => {
//   console.error("Redis error:", err);
// });

// redisPublisher.on("connect", () => {
//   console.log("Redis connected 🚀");
// });
