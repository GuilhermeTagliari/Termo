import type { GameState, SessionStats, Statistics } from '../types';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function gameStateKey(wordLength: number): string {
  return `termo_game_state_${wordLength}`;
}

function statsKey(wordLength: number): string {
  return `termo_statistics_${wordLength}`;
}

const SESSION_KEY = 'termo_session';

export function saveGameState(state: GameState): void {
  const payload = { date: todayKey(), state };
  localStorage.setItem(gameStateKey(state.wordLength), JSON.stringify(payload));
}

export function loadGameState(wordLength: number): GameState | null {
  try {
    const raw = localStorage.getItem(gameStateKey(wordLength));
    if (!raw) return null;
    const { date, state } = JSON.parse(raw) as { date: string; state: GameState };
    if (date !== todayKey()) return null;
    return state;
  } catch {
    return null;
  }
}

export function isLockedForToday(wordLength: number): boolean {
  const saved = loadGameState(wordLength);
  return saved !== null && saved.status === 'lost';
}

export function isWonToday(wordLength: number): boolean {
  const saved = loadGameState(wordLength);
  return saved !== null && saved.status === 'won';
}

export function loadStatistics(wordLength: number): Statistics {
  try {
    const raw = localStorage.getItem(statsKey(wordLength));
    if (raw) return JSON.parse(raw) as Statistics;
  } catch {
    // ignore
  }
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    lastPlayedDate: '',
    lastWonDate: '',
  };
}

export function saveStatistics(wordLength: number, stats: Statistics): void {
  localStorage.setItem(statsKey(wordLength), JSON.stringify(stats));
}

export function updateStatistics(wordLength: number, won: boolean, guessCount: number): Statistics {
  const stats = loadStatistics(wordLength);
  const today = todayKey();

  if (stats.lastPlayedDate === today) return stats;

  stats.played += 1;
  stats.lastPlayedDate = today;

  if (won) {
    stats.won += 1;
    stats.lastWonDate = today;
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] ?? 0) + 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    stats.currentStreak =
      stats.currentStreak === 0 || stats.lastWonDate === yKey
        ? stats.currentStreak + 1
        : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  saveStatistics(wordLength, stats);
  return stats;
}

export function loadSessionStats(): SessionStats {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw) as SessionStats;
      if (s.date === today) return s;
    }
  } catch {
    // ignore
  }
  return { date: today, wordsWon: 0, bestGuessCount: null };
}

export function recordSessionWin(guessCount: number): SessionStats {
  const s = loadSessionStats();
  s.wordsWon += 1;
  s.bestGuessCount =
    s.bestGuessCount === null ? guessCount : Math.min(s.bestGuessCount, guessCount);
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
  return s;
}
