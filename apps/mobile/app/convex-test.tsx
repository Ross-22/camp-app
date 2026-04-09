import React from "react";
import { View, Text } from "react-native";

// Test if the Convex package can be imported
try {
  const { api } = require("@camp/convex");
  console.log("✅ @camp/convex imported successfully");
} catch (error) {
  console.error(
    "❌ Failed to import @camp/convex:",
    error instanceof Error ? error.message : String(error),
  );
}

export default function ConvexTest() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Testing Convex Import</Text>
      <Text>Check console for import results</Text>
    </View>
  );
}
