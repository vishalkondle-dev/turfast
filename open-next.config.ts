import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

/**
 * OpenNext Cloudflare config. On `opennextjs-cloudflare build` this wraps the
 * Next.js app into a Workers-compatible bundle. The Durable Object classes
 * (ResourceLock, GameRoom) are re-exported from the worker entry below so the
 * bindings declared in wrangler.jsonc resolve at deploy time.
 */
export default defineCloudflareConfig({});

// Re-export Durable Objects so Wrangler can bind them (see wrangler.jsonc).
export { ResourceLock } from "./src/workers/resource-lock";
export { GameRoom } from "./src/workers/game-room";
