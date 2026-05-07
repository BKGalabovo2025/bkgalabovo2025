export interface PlayerRanking {
  memberId: string;
  memberName: string;
  totalPoints: number;
  tournamentsPlayed: number;
  wins: number;
  losses: number;
  bestPlacement: number | null;
  categoryBreakdown: {
    category: string;
    points: number;
    played: number;
  }[];
}

export interface RankingEntry extends PlayerRanking {
  position: number;
}
