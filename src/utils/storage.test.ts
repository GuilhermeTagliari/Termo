import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveGameState,
  loadGameState,
  isLockedForToday,
  isWonToday,
  updateStatistics,
  loadStatistics,
  recordSessionWin,
  loadSessionStats,
} from './storage';
import type { GameState } from '../types';

const TODAY = '2026-05-26';
const YESTERDAY = '2026-05-25';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: [],
    currentRow: 0,
    currentCol: 0,
    targetWord: 'GATOS',
    status: 'playing',
    invalidShake: false,
    wordLength: 5,
    ...overrides,
  };
}

// ── saveGameState / loadGameState ─────────────────────────────────────────────

describe('saveGameState / loadGameState', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(TODAY)); });
  afterEach(() => { vi.useRealTimers(); });

  it('retorna null quando nada foi salvo', () => {
    expect(loadGameState(5)).toBeNull();
  });

  it('salva e carrega o estado no mesmo dia', () => {
    const state = makeState({ status: 'playing' });
    saveGameState(state);
    expect(loadGameState(5)).toEqual(state);
  });

  it('retorna null quando a data salva é diferente', () => {
    saveGameState(makeState());
    vi.setSystemTime(new Date('2026-05-27'));
    expect(loadGameState(5)).toBeNull();
  });

  it('retorna null quando o valor no localStorage está corrompido', () => {
    localStorage.setItem('termo_game_state_5', 'not-json');
    expect(loadGameState(5)).toBeNull();
  });

  it('isola estados por wordLength', () => {
    const state5 = makeState({ wordLength: 5 });
    const state6 = makeState({ wordLength: 6, targetWord: 'CARROS' });
    saveGameState(state5);
    saveGameState(state6);
    expect(loadGameState(5)).toEqual(state5);
    expect(loadGameState(6)).toEqual(state6);
  });
});

// ── isLockedForToday / isWonToday ─────────────────────────────────────────────

describe('isLockedForToday / isWonToday', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(TODAY)); });
  afterEach(() => { vi.useRealTimers(); });

  it('isLockedForToday retorna false quando não há estado', () => {
    expect(isLockedForToday(5)).toBe(false);
  });

  it('isLockedForToday retorna true quando status é lost', () => {
    saveGameState(makeState({ status: 'lost' }));
    expect(isLockedForToday(5)).toBe(true);
  });

  it('isLockedForToday retorna false quando status é won', () => {
    saveGameState(makeState({ status: 'won' }));
    expect(isLockedForToday(5)).toBe(false);
  });

  it('isWonToday retorna true quando status é won', () => {
    saveGameState(makeState({ status: 'won' }));
    expect(isWonToday(5)).toBe(true);
  });

  it('isWonToday retorna false quando status é playing', () => {
    saveGameState(makeState({ status: 'playing' }));
    expect(isWonToday(5)).toBe(false);
  });
});

// ── updateStatistics ──────────────────────────────────────────────────────────

describe('updateStatistics', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('incrementa played e won na primeira vitória', () => {
    vi.setSystemTime(new Date(TODAY));
    const stats = updateStatistics(5, true, 3);
    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.guessDistribution[3]).toBe(1);
    expect(stats.currentStreak).toBe(1);
    expect(stats.maxStreak).toBe(1);
  });

  it('incrementa played mas não won em derrota', () => {
    vi.setSystemTime(new Date(TODAY));
    const stats = updateStatistics(5, false, 6);
    expect(stats.played).toBe(1);
    expect(stats.won).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });

  it('zera streak em derrota', () => {
    vi.setSystemTime(new Date(YESTERDAY));
    updateStatistics(5, true, 2);
    vi.setSystemTime(new Date(TODAY));
    const stats = updateStatistics(5, false, 6);
    expect(stats.currentStreak).toBe(0);
  });

  it('continua streak em vitórias consecutivas', () => {
    vi.setSystemTime(new Date(YESTERDAY));
    updateStatistics(5, true, 2); // dia 1: streak = 1

    vi.setSystemTime(new Date(TODAY));
    const stats = updateStatistics(5, true, 3); // dia 2: streak = 2
    expect(stats.currentStreak).toBe(2);
    expect(stats.maxStreak).toBe(2);
  });

  it('reinicia streak (para 1) após dia sem jogar', () => {
    vi.setSystemTime(new Date('2026-05-24'));
    updateStatistics(5, true, 1); // streak = 1

    // pula um dia (2026-05-25 não jogado)
    vi.setSystemTime(new Date(TODAY)); // 2026-05-26
    const stats = updateStatistics(5, true, 1); // streak deve reiniciar = 1
    expect(stats.currentStreak).toBe(1);
  });

  it('é idempotente no mesmo dia', () => {
    vi.setSystemTime(new Date(TODAY));
    updateStatistics(5, true, 3);
    const second = updateStatistics(5, true, 3);
    expect(second.played).toBe(1); // não incrementa de novo
  });

  it('atualiza maxStreak ao longo de 3 dias consecutivos', () => {
    vi.setSystemTime(new Date('2026-05-24'));
    updateStatistics(5, true, 1);

    vi.setSystemTime(new Date(YESTERDAY));
    updateStatistics(5, true, 1);

    vi.setSystemTime(new Date(TODAY));
    const stats = updateStatistics(5, true, 1);
    expect(stats.currentStreak).toBe(3);
    expect(stats.maxStreak).toBe(3);
  });

  it('loadStatistics retorna defaults quando não há dados', () => {
    const stats = loadStatistics(5);
    expect(stats.played).toBe(0);
    expect(stats.won).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.guessDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  });
});

// ── recordSessionWin / loadSessionStats ───────────────────────────────────────

describe('recordSessionWin / loadSessionStats', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(TODAY)); });
  afterEach(() => { vi.useRealTimers(); });

  it('retorna stats zeradas quando nada foi salvo', () => {
    const s = loadSessionStats();
    expect(s.wordsWon).toBe(0);
    expect(s.bestGuessCount).toBeNull();
  });

  it('registra a primeira vitória da sessão', () => {
    const s = recordSessionWin(4);
    expect(s.wordsWon).toBe(1);
    expect(s.bestGuessCount).toBe(4);
  });

  it('acumula wordsWon e mantém o menor bestGuessCount', () => {
    recordSessionWin(4);
    const s = recordSessionWin(2);
    expect(s.wordsWon).toBe(2);
    expect(s.bestGuessCount).toBe(2); // min(4, 2)
  });

  it('não piora bestGuessCount com resultado pior', () => {
    recordSessionWin(2);
    const s = recordSessionWin(5);
    expect(s.bestGuessCount).toBe(2);
  });

  it('retorna stats zeradas quando a data salva é outra', () => {
    recordSessionWin(3);
    vi.setSystemTime(new Date('2026-05-27'));
    const s = loadSessionStats();
    expect(s.wordsWon).toBe(0);
    expect(s.bestGuessCount).toBeNull();
  });
});
