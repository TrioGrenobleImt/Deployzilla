import Redis from "ioredis";

const redisUrl = process.env.REDIS_URI || "redis://localhost:6379";
const redisPassword = process.env.REDIS_PASSWORD;

/**
 * Centralized Redis client for subscribing to events.
 */
export const redisSubscriberClient = new Redis(redisUrl, {
  password: redisPassword || undefined,
});

const setupClient = (client: Redis, name: string) => {
  client.on("error", (err) => {
    console.error(`Redis ${name} error:`, err);
  });

  client.on("connect", () => {
    console.log(`Redis ${name} connected 🎧`);
  });
};

setupClient(redisSubscriberClient, "Subscriber");
