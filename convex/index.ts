// Export the Convex API for both mobile and web apps
// This is safe to import in browsers - it only contains function references, not implementations
export { api } from "./_generated/api";
export type { Doc, Id } from "./_generated/dataModel";

// Note: Server-side functions (queries/mutations) are NOT exported here
// They should only be imported by the Convex runtime, not by client applications
