import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";

// You'll need to replace this with your actual Convex deployment URL
// Run `npx convex dev` to get your deployment URL
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || "";

if (!CONVEX_URL) {
  console.warn(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
    "Run `npx convex dev` and add your deployment URL to .env"
  );
}

const convex = new ConvexReactClient(CONVEX_URL);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
