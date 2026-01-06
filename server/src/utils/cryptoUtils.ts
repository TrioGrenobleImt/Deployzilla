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
const rawKey = (process.env.ENCRYPTION_KEY).trim();
let key: Buffer;

if (rawKey.length === 64) {
  key = Buffer.from(rawKey, "hex");
} else {
  key = Buffer.from(rawKey);
}

if (key.length !== 32) {
    console.error(`Invalid ENCRYPTION_KEY length: ${key.length} bytes. Expected 32 bytes.`);
}

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString("hex"), content: encrypted.toString("hex") };
};

export const decrypt = (hash: { iv: string; content: string }) => {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(hash.iv, "hex"));
  let decrypted = decipher.update(Buffer.from(hash.content, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
