import { Inngest } from "inngest";

// Validate signing key in production
if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
  console.warn(
    "[Inngest] WARNING: INNGEST_SIGNING_KEY not set in production. " +
    "Webhook requests will not be verified!"
  );
}

// Create the Inngest client with signing key for request verification
export const inngest = new Inngest({
  id: "edufeed",
  name: "EduFeed",
  // Signing key is automatically read from INNGEST_SIGNING_KEY env var
  // This ensures all incoming webhook requests are verified in production
});
