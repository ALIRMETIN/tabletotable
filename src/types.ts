export interface Team {
  code: string;
  name: string;
}

export interface Player {
  number: string;
  firstName: string;
  lastName: string;
  role: string;
  playedSets: number;
  servePoints: number;
  attackPoints: number;
  blockPoints: number;
  team: Team;
}

export interface SetResult {
  score: string;
  isWin: boolean;
  homePoints: number;
  awayPoints: number;
}

export interface MatchResult {
  sets: SetResult[];
  isWin: boolean;
  homeTeam: Team;
  awayTeam: Team;
  stats: TeamStats;
  totalHomePoints: number;
  totalAwayPoints: number;
  homePlayers: Player[];
  awayPlayers: Player[];
  rawData: string[];
}

export interface TeamStats {
  points: number;
  totalPoints: number;
  breaks: number;
  breakAttempts: number;
  aces: number;
  serves: number;
  sideouts: number;
  sideoutAttempts: number;
  receptions: number;
  receptionAttempts: number;
  kills: number;
  attackAttempts: number;
  blocks: number;
  blockAttempts: number;
  cars: number;
  carAttempts: number;
}

export interface TeamSummary {
  team: Team;
  matches: number;
  wins: number;
  sets: number;
  wonSets: number;
  wonPoints: number;
  lostPoints: number;
  winPercentage: number;
  pointsRatio: number;
  breakPercentage: number;
  acePercentage: number;
  sideoutPercentage: number;
  receptionPercentage: number;
  killPercentage: number;
  oppKillPercentage: number;
  blockPercentage: number;
  carPercentage: number;
  aces: number;
  kills: number;
  blocks: number;
}

export type TabType = 'matches' | 'overview' | 'scorers' | 'serving' | 'reception' | 'attacking' | 'blocking';

export interface ParsedData {
  matches: MatchResult[];
  teamStats: TeamSummary[];
}
