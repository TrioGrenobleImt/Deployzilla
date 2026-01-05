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
