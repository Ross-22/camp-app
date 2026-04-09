import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  campers: defineTable({
    externalId: v.string(), // The QR code ID
    name: v.string(),
    team: v.string(),
    church: v.optional(v.string()), // Which church the camper is from (optional for backwards compatibility)
    age: v.optional(v.number()), // Camper age (optional for existing records)
    gender: v.optional(v.string()), // Camper gender (optional for existing records)
    foodAllergies: v.optional(v.string()), // Optional food allergy notes
    creditScore: v.optional(v.number()), // Deprecated, kept for backwards compatibility
    score: v.optional(v.number()), // Deprecated, kept for backwards compatibility
    deductions: v.optional(v.number()), // Individual penalty/deduction counter
    createdAt: v.number(), // Unix timestamp in milliseconds
  })
    .index("by_externalId", ["externalId"])
    .index("by_name", ["name"])
    .index("by_team", ["team"]),

  teams: defineTable({
    name: v.string(), // Team name
    score: v.number(), // Team score
    netScore: v.optional(v.number()), // Calculated net score (score - total member deductions)
    createdAt: v.number(), // Unix timestamp in milliseconds
  }).index("by_name", ["name"]),

  attendance: defineTable({
    camperId: v.id("campers"), // Reference to camper document
    type: v.union(v.literal("check_in"), v.literal("meal")),
    mealType: v.optional(
      v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner")),
    ),
    timestamp: v.number(), // Unix timestamp in milliseconds
  })
    .index("by_camperId", ["camperId"])
    .index("by_timestamp", ["timestamp"]),
});
