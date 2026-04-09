import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Register a new camper
export const create = mutation({
  args: {
    externalId: v.string(), // The QR code ID
    name: v.string(),
    team: v.string(),
    church: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if camper already exists with this external ID
    const existing = await ctx.db
      .query("campers")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (existing) {
      throw new Error("Camper with this ID already exists");
    }

    // Ensure team record exists (create if it doesn't)
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.team))
      .first();

    if (!existingTeam) {
      await ctx.db.insert("teams", {
        name: args.team,
        score: 0,
        netScore: 0, // Initial net score
        createdAt: Date.now(),
      });
    }

    const camperId = await ctx.db.insert("campers", {
      externalId: args.externalId,
      name: args.name,
      team: args.team,
      church: args.church,
      deductions: 0,
      createdAt: Date.now(),
    });

    return camperId;
  },
});

// Mark check-in attendance for a camper
export const markCheckIn = mutation({
  args: {
    camperId: v.id("campers"),
  },
  handler: async (ctx, args) => {
    const camper = await ctx.db.get(args.camperId);

    if (!camper) {
      throw new Error("Camper not found");
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const existingCheckIn = await ctx.db
      .query("attendance")
      .withIndex("by_camperId", (q) => q.eq("camperId", args.camperId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), todayStart),
          q.eq(q.field("type"), "check_in")
        )
      )
      .first();

    if (existingCheckIn) {
      throw new Error("Camper already checked in today");
    }

    const attendanceId = await ctx.db.insert("attendance", {
      camperId: args.camperId,
      type: "check_in",
      timestamp: Date.now(),
    });

    return attendanceId;
  },
});

// Mark meal attendance for a camper
export const markMeal = mutation({
  args: {
    camperId: v.id("campers"),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner")),
  },
  handler: async (ctx, args) => {
    const camper = await ctx.db.get(args.camperId);

    if (!camper) {
      throw new Error("Camper not found");
    }

    // Check if already marked for this meal today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const existingMeal = await ctx.db
      .query("attendance")
      .withIndex("by_camperId", (q) => q.eq("camperId", args.camperId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), todayStart),
          q.eq(q.field("type"), "meal"),
          q.eq(q.field("mealType"), args.mealType)
        )
      )
      .first();

    if (existingMeal) {
      throw new Error(`Camper already marked for ${args.mealType} today`);
    }

    const attendanceId = await ctx.db.insert("attendance", {
      camperId: args.camperId,
      type: "meal",
      mealType: args.mealType,
      timestamp: Date.now(),
    });

    return attendanceId;
  },
});

// Unmark meal attendance for a camper (undo functionality)
export const unmarkMeal = mutation({
  args: {
    camperId: v.id("campers"),
    mealType: v.union(v.literal("breakfast"), v.literal("lunch"), v.literal("dinner")),
  },
  handler: async (ctx, args) => {
    const camper = await ctx.db.get(args.camperId);

    if (!camper) {
      throw new Error("Camper not found");
    }

    // Find today's meal attendance record for this camper and meal type
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const existingMeal = await ctx.db
      .query("attendance")
      .withIndex("by_camperId", (q) => q.eq("camperId", args.camperId))
      .filter((q) =>
        q.and(
          q.gte(q.field("timestamp"), todayStart),
          q.eq(q.field("type"), "meal"),
          q.eq(q.field("mealType"), args.mealType)
        )
      )
      .first();

    if (!existingMeal) {
      throw new Error(`No ${args.mealType} record found to unmark for today`);
    }

    // Delete the attendance record
    await ctx.db.delete(existingMeal._id);

    return { success: true };
  },
});

// Update camper info
export const update = mutation({
  args: {
    camperId: v.id("campers"),
    name: v.optional(v.string()),
    team: v.optional(v.string()),
    church: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { camperId, ...updates } = args;

    // Filter out undefined values
    const validUpdates: { name?: string; team?: string; church?: string } = {};
    if (updates.name !== undefined) validUpdates.name = updates.name;
    if (updates.team !== undefined) validUpdates.team = updates.team;
    if (updates.church !== undefined) validUpdates.church = updates.church;

    await ctx.db.patch(camperId, validUpdates);
  },
});

// Update deductions counter for a camper
export const updateDeductions = mutation({
  args: {
    camperId: v.id("campers"),
    amount: v.number(), // Positive to add, negative to subtract
  },
  handler: async (ctx, args) => {
    const camper = await ctx.db.get(args.camperId);

    if (!camper) {
      throw new Error("Camper not found");
    }

    const currentDeductions = camper.deductions ?? 0;
    const newDeductions = Math.max(0, currentDeductions + args.amount);

    await ctx.db.patch(args.camperId, {
      deductions: newDeductions,
    });

    // Recalculate the team's net score since deductions changed
    const team = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", camper.team))
      .first();

    if (team) {
      // Calculate total deductions for this team
      const teamCampers = await ctx.db
        .query("campers")
        .withIndex("by_team", (q) => q.eq("team", camper.team))
        .collect();

      const totalDeductions = teamCampers.reduce((sum, teamCamper) => {
        // Use the new deductions value for the current camper
        if (teamCamper._id === args.camperId) {
          return sum + newDeductions;
        }
        return sum + (teamCamper.deductions ?? 0);
      }, 0);

      const newNetScore = team.score - totalDeductions;
      
      await ctx.db.patch(team._id, {
        netScore: newNetScore,
      });
    }

    return { deductions: newDeductions };
  },
});

// Migration: Populate netScore for all existing teams
export const populateNetScores = mutation({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    let updatedCount = 0;

    for (const team of teams) {
      if (team.netScore === undefined) {
        // Calculate total deductions for this team
        const teamCampers = await ctx.db
          .query("campers")
          .withIndex("by_team", (q) => q.eq("team", team.name))
          .collect();

        const totalDeductions = teamCampers.reduce((sum, camper) => {
          return sum + (camper.deductions ?? 0);
        }, 0);

        const netScore = team.score - totalDeductions;
        
        await ctx.db.patch(team._id, {
          netScore: netScore,
        });
        
        updatedCount++;
      }
    }

    return { message: `Updated ${updatedCount} teams with netScore` };
  },
});

// Recalculate and update net score for a specific team
export const recalculateTeamNetScore = mutation({
  args: {
    teamName: v.string(),
  },
  handler: async (ctx, args) => {
    // Get team record
    const team = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.teamName))
      .first();

    if (!team) {
      throw new Error(`Team "${args.teamName}" not found`);
    }

    // Calculate total deductions for this team
    const teamCampers = await ctx.db
      .query("campers")
      .withIndex("by_team", (q) => q.eq("team", args.teamName))
      .collect();

    const totalDeductions = teamCampers.reduce((sum, camper) => {
      return sum + (camper.deductions ?? 0);
    }, 0);

    // Update net score
    const newNetScore = team.score - totalDeductions;
    
    await ctx.db.patch(team._id, {
      netScore: newNetScore,
    });

    return { teamName: args.teamName, netScore: newNetScore };
  },
});

// Add or update team score in the teams table
export const updateTeamScore = mutation({
  args: {
    teamName: v.string(),
    amount: v.number(), // Amount to add (can be negative to subtract)
  },
  handler: async (ctx, args) => {
    // Find existing team record
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.teamName))
      .first();

    // Calculate total deductions for this team
    const teamCampers = await ctx.db
      .query("campers")
      .withIndex("by_team", (q) => q.eq("team", args.teamName))
      .collect();

    const totalDeductions = teamCampers.reduce((sum, camper) => {
      return sum + (camper.deductions ?? 0);
    }, 0);

    if (existingTeam) {
      // Update existing team
      const newScore = Math.max(0, existingTeam.score + args.amount);
      const newNetScore = newScore - totalDeductions;
      await ctx.db.patch(existingTeam._id, {
        score: newScore,
        netScore: newNetScore,
      });
      return { teamName: args.teamName, score: newScore, netScore: newNetScore };
    } else {
      // Create new team record
      const newScore = Math.max(0, args.amount);
      const newNetScore = newScore - totalDeductions;
      const teamId = await ctx.db.insert("teams", {
        name: args.teamName,
        score: newScore,
        netScore: newNetScore,
        createdAt: Date.now(),
      });
      return { teamName: args.teamName, score: newScore, netScore: newNetScore };
    }
  },
});

// Set team score to a specific value in the teams table
export const setTeamScore = mutation({
  args: {
    teamName: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const score = Math.max(0, args.score);
    
    // Calculate total deductions for this team
    const teamCampers = await ctx.db
      .query("campers")
      .withIndex("by_team", (q) => q.eq("team", args.teamName))
      .collect();

    const totalDeductions = teamCampers.reduce((sum, camper) => {
      return sum + (camper.deductions ?? 0);
    }, 0);

    const netScore = score - totalDeductions;
    
    // Find existing team record
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_name", (q) => q.eq("name", args.teamName))
      .first();

    if (existingTeam) {
      // Update existing team
      await ctx.db.patch(existingTeam._id, {
        score: score,
        netScore: netScore,
      });
    } else {
      // Create new team record
      await ctx.db.insert("teams", {
        name: args.teamName,
        score: score,
        netScore: netScore,
        createdAt: Date.now(),
      });
    }

    return { teamName: args.teamName, score: score, netScore: netScore };
  },
});
