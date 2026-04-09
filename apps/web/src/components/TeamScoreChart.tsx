"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useEffect, useRef, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface TeamScoreChartProps {
  data: {
    labels: string[];
    deductionLabels?: Array<string | null>;
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
    maxScore?: number; // Optional max score for consistent scaling
  };
  revealedTeams?: Set<string>; // Track which teams have been revealed
}

export default function TeamScoreChart({
  data,
  revealedTeams = new Set(),
}: TeamScoreChartProps) {
  const LABEL_FADE_DURATION_MS = 350;
  const chartRef = useRef<ChartJS<"bar"> | null>(null);
  const [animatedTeams, setAnimatedTeams] = useState<Set<string>>(new Set());
  const [labelHiddenTeams, setLabelHiddenTeams] = useState<Set<string>>(
    new Set(),
  );
  const [deductionLabelHiddenTeams, setDeductionLabelHiddenTeams] = useState<
    Set<string>
  >(new Set());
  const [transitionValues, setTransitionValues] = useState<
    Record<string, number>
  >({});
  const [barCenters, setBarCenters] = useState<number[]>([]);
  const [xAxisBottom, setXAxisBottom] = useState<number>(0);
  const previousValuesRef = useRef<Map<string, number>>(new Map());
  const previousDeductionLabelsRef = useRef<Map<string, string | null>>(
    new Map(),
  );

  const updateBarCenters = () => {
    const chart = chartRef.current;
    if (!chart) return;

    const meta = chart.getDatasetMeta(0);
    const centers = meta.data.map((bar: any) => bar.x);
    setBarCenters(centers);
    setXAxisBottom(chart.scales.x?.bottom ?? 0);
  };

  // Track when teams finish animating (with 1.5s delay to match animation duration)
  useEffect(() => {
    const newAnimated = new Set(animatedTeams);
    let hasChanges = false;

    revealedTeams.forEach((teamName) => {
      if (!animatedTeams.has(teamName)) {
        hasChanges = true;
        setTimeout(() => {
          setAnimatedTeams((prev) => new Set([...prev, teamName]));
        }, 1500); // Match animation duration
      }
    });

    // Remove teams that are no longer revealed
    animatedTeams.forEach((teamName) => {
      if (!revealedTeams.has(teamName)) {
        newAnimated.delete(teamName);
        hasChanges = true;
      }
    });

    if (hasChanges && newAnimated.size !== animatedTeams.size) {
      setAnimatedTeams(newAnimated);
    }
  }, [revealedTeams, animatedTeams]);

  useEffect(() => {
    const refreshCenters = () => {
      setTimeout(updateBarCenters, 0);
    };

    refreshCenters();
    window.addEventListener("resize", refreshCenters);

    return () => {
      window.removeEventListener("resize", refreshCenters);
    };
  }, [data]);

  useEffect(() => {
    const currentValues = new Map<string, number>();
    const changedTeams: Array<{ teamName: string; previousValue: number }> = [];

    data.labels.forEach((teamName, index) => {
      const currentValue = data.datasets[0]?.data[index] ?? 0;
      currentValues.set(teamName, currentValue);

      const previousValue = previousValuesRef.current.get(teamName);
      if (
        previousValue !== undefined &&
        previousValue > 0 &&
        currentValue > 0 &&
        previousValue !== currentValue &&
        animatedTeams.has(teamName)
      ) {
        changedTeams.push({ teamName, previousValue });
      }
    });

    previousValuesRef.current = currentValues;

    if (changedTeams.length === 0) return;

    const changedTeamNames = changedTeams.map(({ teamName }) => teamName);
    setTransitionValues((prev) => {
      const next = { ...prev };
      changedTeams.forEach(({ teamName, previousValue }) => {
        next[teamName] = previousValue;
      });
      return next;
    });
    setLabelHiddenTeams((prev) => new Set([...prev, ...changedTeamNames]));

    const timeoutId = window.setTimeout(() => {
      setTransitionValues((prev) => {
        const next = { ...prev };
        changedTeamNames.forEach((teamName) => {
          delete next[teamName];
        });
        return next;
      });

      setLabelHiddenTeams((prev) => {
        const next = new Set(prev);
        changedTeamNames.forEach((teamName) => {
          next.delete(teamName);
        });
        return next;
      });
    }, LABEL_FADE_DURATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [data, animatedTeams]);

  useEffect(() => {
    const currentDeductionLabels = new Map<string, string | null>();
    const changedTeams: string[] = [];

    data.labels.forEach((teamName, index) => {
      const currentLabel = data.deductionLabels?.[index] ?? null;
      currentDeductionLabels.set(teamName, currentLabel);

      const previousLabel =
        previousDeductionLabelsRef.current.get(teamName) ?? null;
      if (currentLabel && previousLabel !== currentLabel) {
        changedTeams.push(teamName);
      }
    });

    previousDeductionLabelsRef.current = currentDeductionLabels;

    if (changedTeams.length === 0) return;

    setDeductionLabelHiddenTeams((prev) => new Set([...prev, ...changedTeams]));

    const timeoutId = window.setTimeout(() => {
      setDeductionLabelHiddenTeams((prev) => {
        const next = new Set(prev);
        changedTeams.forEach((teamName) => {
          next.delete(teamName);
        });
        return next;
      });
    }, 30);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [data.labels, data.deductionLabels]);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 28,
      },
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 14,
          topRight: 14,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => `${context[0].label}`,
          label: (context) =>
            `Score: ${context.parsed.y?.toLocaleString() ?? "0"}`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 14,
            weight: "bold" as const,
          },
          color: "#cbd5e1",
        },
      },
      y: {
        beginAtZero: true,
        // Set a consistent max scale based on the highest score
        max: data.maxScore ? Math.ceil(data.maxScore * 1.1) : undefined,
        grid: {
          display: false, // Remove grid lines
        },
        ticks: {
          display: false, // Hide y-axis labels since we'll show scores on bars
        },
      },
    },
    animation: {
      duration: 1500, // Longer duration for more dramatic effect
      easing: "easeOutQuart", // Smooth animation for reveal effect
      onComplete: () => {
        updateBarCenters();
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <div className="relative w-full h-full">
      <Bar ref={chartRef} data={data} options={options} />

      {xAxisBottom > 0 && (
        <div
          className="absolute left-0 w-full pointer-events-none"
          style={{ top: xAxisBottom + 8 }}
        >
          {data.labels.map((teamName, index) => {
            const deductionLabel = data.deductionLabels?.[index] ?? null;
            const centerX = barCenters[index];

            if (!deductionLabel) return null;

            return (
              <div
                key={`${teamName}-${deductionLabel}`}
                className="absolute -translate-x-1/2"
                style={{ left: centerX ?? "50%" }}
              >
                <div
                  className={`text-slate-200 drop-shadow-[0_4px_10px_rgba(2,6,23,0.55)] font-semibold text-base md:text-lg text-center whitespace-nowrap transition-opacity duration-500 ease-out ${
                    deductionLabelHiddenTeams.has(teamName)
                      ? "opacity-0"
                      : "opacity-100"
                  }`}
                >
                  {deductionLabel}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Score labels positioned completely above the chart */}
      <div className="absolute -top-12 md:-top-14 left-0 w-full h-10 md:h-12 pointer-events-none">
        <div className="relative w-full h-full">
          {data.labels.map((teamName, index) => {
            const dataValue = data.datasets[0]?.data[index] || 0;
            const displayedValue = transitionValues[teamName] ?? dataValue;
            const centerX = barCenters[index];
            const shouldShowLabel =
              animatedTeams.has(teamName) && !labelHiddenTeams.has(teamName);

            return (
              <div
                key={teamName}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: centerX ?? "50%" }}
              >
                {/* Score label fades in after the bar animation completes */}
                {displayedValue > 0 && (
                  <div
                    className={`text-slate-100 drop-shadow-[0_6px_14px_rgba(2,6,23,0.7)] font-extrabold text-3xl md:text-4xl text-center transition-opacity duration-[350ms] ease-in-out ${
                      shouldShowLabel ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {displayedValue.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
