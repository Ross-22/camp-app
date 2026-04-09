import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all campers (real-time by default)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const campers = await ctx.db.query("campers").order("asc").collect();
    // Sort by name
    return campers.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Alias for backward compatibility
export const getAllCampers = list;

// Get a single camper by their external ID (QR code)
export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    const camper = await ctx.db
      .query("campers")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();
    return camper;
  },
});

// Get a single camper by Convex document ID
export const getById = query({
  args: { id: v.id("campers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get dashboard stats (total campers and today's meals per type)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const campers = await ctx.db.query("campers").collect();
    const totalCampers = campers.length;

    // Get today's attendance records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_timestamp")
      .filter((q) => q.gte(q.field("timestamp"), todayStart))
      .collect();

    const meals = {
      breakfast: todayAttendance.filter(
        (a) => a.type === "meal" && a.mealType === "breakfast",
      ).length,
      lunch: todayAttendance.filter(
        (a) => a.type === "meal" && a.mealType === "lunch",
      ).length,
      dinner: todayAttendance.filter(
        (a) => a.type === "meal" && a.mealType === "dinner",
      ).length,
    };

    return { totalCampers, meals };
  },
});

// Get attendance records for a specific camper
export const getAttendance = query({
  args: { camperId: v.id("campers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_camperId", (q) => q.eq("camperId", args.camperId))
      .order("desc")
      .collect();
  },
});

// Get today's attendance for a specific camper
export const getTodayAttendance = query({
  args: { camperId: v.id("campers") },
  handler: async (ctx, args) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_camperId", (q) => q.eq("camperId", args.camperId))
      .filter((q) => q.gte(q.field("timestamp"), todayStart))
      .collect();

    return {
      checkedIn: attendance.some((a) => a.type === "check_in"),
      meals: {
        breakfast: attendance.some(
          (a) => a.type === "meal" && a.mealType === "breakfast",
        ),
        lunch: attendance.some(
          (a) => a.type === "meal" && a.mealType === "lunch",
        ),
        dinner: attendance.some(
          (a) => a.type === "meal" && a.mealType === "dinner",
        ),
      },
    };
  },
});

// Get team stats (scores, deductions, member count per team)
export const getTeamStats = query({
  args: {},
  handler: async (ctx) => {
    // Get all teams and campers
    const teams = await ctx.db.query("teams").collect();
    const campers = await ctx.db.query("campers").collect();

    // Group campers by team to get member counts and total deductions
    const teamMemberData = new Map<
      string,
      { members: number; totalDeductions: number }
    >();

    for (const camper of campers) {
      const team = camper.team;
      const current = teamMemberData.get(team) || {
        members: 0,
        totalDeductions: 0,
      };

      teamMemberData.set(team, {
        members: current.members + 1,
        totalDeductions: current.totalDeductions + (camper.deductions ?? 0),
      });
    }

    // Combine team data with member info, using stored netScore or calculating it
    const teamStats = teams.map((team) => {
      const memberData = teamMemberData.get(team.name) || {
        members: 0,
        totalDeductions: 0,
      };
      return {
        name: team.name,
        members: memberData.members,
        totalScore: team.score,
        totalDeductions: memberData.totalDeductions,
        // Use stored netScore if available, otherwise calculate it
        netScore: team.netScore ?? team.score - memberData.totalDeductions,
      };
    });

    // Add teams that have campers but no team record yet
    for (const [teamName, memberData] of teamMemberData.entries()) {
      const existingTeam = teamStats.find((t) => t.name === teamName);
      if (!existingTeam) {
        teamStats.push({
          name: teamName,
          members: memberData.members,
          totalScore: 0, // No team record means 0 score
          totalDeductions: memberData.totalDeductions,
          netScore: 0 - memberData.totalDeductions, // Calculate for teams without records
        });
      }
    }

    // Sort by net score (descending)
    teamStats.sort((a, b) => b.netScore - a.netScore);

    return teamStats;
  },
});
