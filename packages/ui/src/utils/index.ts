// Shared utility functions
export const formatScore = (score: number): string => {
  return score.toLocaleString();
};

export const getTeamColor = (teamName: string): string => {
  const colors: { [key: string]: string } = {
    'Red Team': '#ef4444',
    'Blue Team': '#3b82f6',
    'Green Team': '#22c55e',
    'Yellow Team': '#eab308',
  };
  return colors[teamName] || '#6b7280';
};

export const calculateTeamScore = (campers: any[]): number => {
  return campers.reduce((total, camper) => total + (camper.points || 0), 0);
};