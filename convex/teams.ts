import { query } from "./_generated/server";

// Get all teams with their stats
export const list = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    return teams;
  },
});

// Alias for backward compatibility
export const getAllTeams = list;
