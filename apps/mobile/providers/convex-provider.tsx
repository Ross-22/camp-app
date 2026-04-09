import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";
import { Text, View } from "react-native";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL;

const convex = CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null;

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!convex) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          backgroundColor: "#ffffff",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
          App configuration missing
        </Text>
        <Text style={{ textAlign: "center", color: "#4b5563" }}>
          Set EXPO_PUBLIC_CONVEX_URL in your EAS profile or local env file, then
          rebuild the app.
        </Text>
      </View>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
