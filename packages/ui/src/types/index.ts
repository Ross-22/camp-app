// Shared types between mobile and web
export interface Team {
  _id: string;
  name: string;
  color: string;
  score: number;
}

export interface Camper {
  _id: string;
  name: string;
  teamId: string;
  points: number;
  profileImage?: string;
}