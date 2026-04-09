"use client";

import { useQuery } from "convex/react";
import { api } from "@camp/convex";
import type { Doc } from "@camp/convex";
import { getTeamColor } from "@camp/ui/utils";
import TeamScoreChart from "@/components/TeamScoreChart";
import { useEffect, useMemo, useState } from "react";

type TeamRevealStage = "gross" | "net";

function shuffleTeams<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Dashboard() {
  const teamStats = useQuery(api.campers.getTeamStats);
  const [teamRevealStages, setTeamRevealStages] = useState<
    Record<string, TeamRevealStage>
  >({});
  const [randomizedTeamOrder, setRandomizedTeamOrder] = useState<string[]>([]);

  useEffect(() => {
    if (!teamStats) return;

    const teamNames = teamStats.map((team: any) => team.name);
    setRandomizedTeamOrder((previousOrder) => {
      const sameTeams =
        previousOrder.length === teamNames.length &&
        previousOrder.every((name) => teamNames.includes(name));

      if (sameTeams) {
        return previousOrder;
      }

      return shuffleTeams(teamNames);
    });
  }, [teamStats]);

  const orderedTeams = useMemo(() => {
    if (!teamStats) return [];
    if (randomizedTeamOrder.length === 0) return teamStats;

    const teamByName = new Map(teamStats.map((team: any) => [team.name, team]));
    return randomizedTeamOrder
      .map((name) => teamByName.get(name))
      .filter((team): team is any => Boolean(team));
  }, [teamStats, randomizedTeamOrder]);

  const chartData = useMemo(() => {
    if (!teamStats) return null;

    // Find the maximum possible score to set a consistent scale
    const maxScore = Math.max(
      ...teamStats.map((team: any) => {
        const netScore = team.totalScore - team.totalDeductions;
        return Math.max(team.totalScore, netScore);
      }),
      0,
    );

    const teamScores = orderedTeams.map((team: any) => {
      const netScore = team.totalScore - team.totalDeductions;
      const revealStage = teamRevealStages[team.name];
      const displayedScore =
        revealStage === "gross"
          ? team.totalScore
          : revealStage === "net"
            ? netScore
            : 0;

      return {
        name: team.name,
        score: displayedScore,
        actualScore: netScore,
        deductionLabel:
          revealStage === "net"
            ? `Deductions: ${team.totalDeductions.toLocaleString()}`
            : null,
        color: getTeamColor(team.name + " Team"),
      };
    });

    return {
      labels: teamScores.map((team: any) => team.name),
      datasets: [
        {
          label: "Team Scores",
          data: teamScores.map((team: any) => team.score),
          backgroundColor: teamScores.map((team: any) => team.color),
          borderColor: teamScores.map((team: any) => team.color),
          borderWidth: 2,
        },
      ],
      deductionLabels: teamScores.map((team: any) => team.deductionLabel),
      maxScore, // Pass max score for consistent scaling
    };
  }, [teamStats, orderedTeams, teamRevealStages]);

  const revealedTeams = useMemo(() => {
    return new Set<string>(
      orderedTeams
        .filter((team: any) => teamRevealStages[team.name])
        .map((team: any) => team.name),
    );
  }, [orderedTeams, teamRevealStages]);

  const handleRevealTeam = (teamName: string) => {
    setTeamRevealStages((prev) => ({
      ...prev,
      [teamName]:
        prev[teamName] === "gross"
          ? "net"
          : prev[teamName] === "net"
            ? "net"
            : "gross",
    }));
  };

  const handleRevealAll = () => {
    if (!teamStats) return;
    setTeamRevealStages((prev) => {
      const nextStages = { ...prev };
      for (const team of teamStats) {
        if (!nextStages[team.name]) {
          nextStages[team.name] = "gross";
        }
      }
      return nextStages;
    });
  };

  const handleResetAll = () => {
    setTeamRevealStages({});
  };

  if (!teamStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-slate-300 tracking-wide">
          Loading camp data...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden py-3 md:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
        {/* Team Scores Chart */}
        <div className="rounded-3xl border border-[var(--surface-border)] bg-[var(--surface)] backdrop-blur-xl shadow-[0_24px_60px_rgba(2,6,23,0.45)] px-5 md:px-8 pb-5 pt-16 md:pt-20 flex-1 min-h-0 flex flex-col">
          {chartData && (
            <div className="relative h-[49vh] md:h-[56vh] mt-2 md:mt-3 mb-1 md:mb-2">
              <TeamScoreChart data={chartData} revealedTeams={revealedTeams} />
            </div>
          )}

          {/* Team Reveal Controls */}
          <div className="border-t border-slate-500/30 pt-4 md:pt-5 mt-auto">
            <div className="flex flex-col items-center space-y-3">
              {/* Control Buttons */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleRevealAll}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold tracking-wide hover:bg-emerald-400 transition-colors shadow-[0_8px_24px_rgba(16,185,129,0.35)]"
                >
                  Reveal All Scores
                </button>
                <button
                  onClick={handleResetAll}
                  className="px-6 py-2.5 rounded-xl bg-slate-700 text-slate-100 font-semibold tracking-wide hover:bg-slate-600 transition-colors shadow-[0_8px_24px_rgba(15,23,42,0.35)]"
                >
                  Reset All Scores
                </button>
              </div>

              {/* Team Reveal Buttons */}
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                {orderedTeams.map((team: any) => (
                  <button
                    key={team.name}
                    onClick={() => handleRevealTeam(team.name)}
                    disabled={teamRevealStages[team.name] === "net"}
                    className={`w-44 md:w-48 px-4 py-3 rounded-2xl font-semibold text-white text-sm md:text-base tracking-wide whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      teamRevealStages[team.name]
                        ? "bg-slate-500"
                        : "hover:shadow-[0_12px_30px_rgba(15,23,42,0.35)]"
                    }`}
                    style={{
                      backgroundColor: teamRevealStages[team.name]
                        ? "#64748b"
                        : getTeamColor(team.name + " Team"),
                    }}
                  >
                    {teamRevealStages[team.name] === "gross"
                      ? `${team.name}: Apply Deductions`
                      : teamRevealStages[team.name] === "net"
                        ? `${team.name}: Final Revealed`
                        : `Reveal ${team.name}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
