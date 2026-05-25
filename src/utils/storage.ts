import type { GameState, Statistics } from '../types';

const GAME_STATE_KEY = 'termo_game_state';
const STATS_KEY = 'termo_statistics';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function saveGameState(state: GameState): void {
  const payload = { date: todayKey(), state };
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify(payload));
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return null;
    const { date, state } = JSON.parse(raw) as { date: string; state: GameState };
    if (date !== todayKey()) return null;
    return state;
  } catch {
    return null;
  }
}

export function loadStatistics(): Statistics {
  try {
    const raw = localStorage.getItem(STATS_KEY);
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

export function saveStatistics(stats: Statistics): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function updateStatistics(won: boolean, guessCount: number): Statistics {
  const stats = loadStatistics();
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
    stats.currentStreak = stats.lastWonDate === today && (stats.currentStreak === 0 || stats.lastPlayedDate === yKey || stats.lastWonDate === yKey)
      ? stats.currentStreak + 1
      : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  } else {
    stats.currentStreak = 0;
  }

  saveStatistics(stats);
  return stats;
}
