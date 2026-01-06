import crypto from "crypto";

/**
 * Verifies the GitHub webhook signature using HMAC SHA256.
 * @param body The raw request body.
 * @param signature The x-hub-signature-256 header value.
 * @param secret The webhook secret configured in GitHub.
 * @returns boolean
 */
export const verifyGitHubSignature = (body: any, signature: string | undefined, secret: string | undefined): boolean => {
  if (!signature || !secret) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(JSON.stringify(body)).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

const algorithm = "aes-256-cbc";
// Ensure this key is 32 bytes.
// In production, this should be loaded from an environment variable.
const key = process.env.ENCRYPTION_KEY;

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString("hex"), content: encrypted.toString("hex") };
};

export const decrypt = (hash: { iv: string; content: string }) => {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), Buffer.from(hash.iv, "hex"));
  let decrypted = decipher.update(Buffer.from(hash.content, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
