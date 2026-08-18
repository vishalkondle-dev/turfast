// Minimal ambient types so the code compiles in Node dev without @cloudflare/workers-types.
// On Cloudflare these are provided by the runtime.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type D1Database = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type KVNamespace = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type R2Bucket = any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DurableObjectNamespace = any;
}
export {};
