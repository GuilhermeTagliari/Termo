export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'filled';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Tile {
  letter: string;
  status: TileStatus;
}

export interface Row {
  tiles: Tile[];
  submitted: boolean;
}

export interface GameState {
  board: Row[];
  currentRow: number;
  currentCol: number;
  targetWord: string;
  status: GameStatus;
  invalidShake: boolean;
  wordLength: number;
}

export interface Statistics {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  lastPlayedDate: string;
  lastWonDate: string;
}

export interface SessionStats {
  date: string;
  wordsWon: number;
  bestGuessCount: number | null;
}

export interface KeyStatus {
  [key: string]: TileStatus;
}

export const MAX_GUESSES = 6;
