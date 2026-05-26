import { useCallback, useEffect, useReducer, useState } from 'react';
import type { GameState, KeyStatus, Row, SessionStats, Statistics, TileStatus } from '../types';
import { MAX_GUESSES } from '../types';
import { computeGuess, normalizeChar } from '../utils/colorLogic';
import { isValidWord } from '../utils/wordValidator';
import {
  loadGameState,
  loadSessionStats,
  loadStatistics,
  recordSessionWin,
  saveGameState,
  updateStatistics,
} from '../utils/storage';
import { getRandomWordForDay } from '../data/wordsByLength';

function emptyBoard(wordLength: number): Row[] {
  return Array.from({ length: MAX_GUESSES }, () => ({
    tiles: Array.from({ length: wordLength }, () => ({ letter: '', status: 'empty' as TileStatus })),
    submitted: false,
  }));
}

function buildInitialState(wordLength: number): GameState {
  const saved = loadGameState(wordLength);
  if (saved) return saved;
  return {
    board: emptyBoard(wordLength),
    currentRow: 0,
    currentCol: 0,
    targetWord: getRandomWordForDay(wordLength),
    status: 'playing',
    invalidShake: false,
    wordLength,
  };
}

type Action =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'DELETE_LETTER' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'SET_COL'; col: number };

function reducer(state: GameState, action: Action): GameState {
  if (state.status !== 'playing' && action.type !== 'CLEAR_SHAKE') return state;

  const { wordLength } = state;

  switch (action.type) {
    case 'SET_COL': {
      const col = Math.min(Math.max(action.col, 0), wordLength - 1);
      return { ...state, currentCol: col };
    }

    case 'ADD_LETTER': {
      if (state.currentCol >= wordLength) return state;
      const board = state.board.map(r => ({ ...r, tiles: [...r.tiles] }));
      board[state.currentRow].tiles[state.currentCol] = {
        letter: action.letter,
        status: 'filled',
      };
      const nextCol = Math.min(state.currentCol + 1, wordLength - 1);
      return { ...state, board, currentCol: nextCol };
    }

    case 'DELETE_LETTER': {
      const board = state.board.map(r => ({ ...r, tiles: [...r.tiles] }));
      const row = board[state.currentRow];
      if (row.tiles[state.currentCol]?.letter) {
        row.tiles[state.currentCol] = { letter: '', status: 'empty' };
        return { ...state, board };
      }
      if (state.currentCol <= 0) return state;
      const col = state.currentCol - 1;
      row.tiles[col] = { letter: '', status: 'empty' };
      return { ...state, board, currentCol: col };
    }

    case 'SUBMIT_GUESS': {
      const rowTiles = state.board[state.currentRow].tiles;
      if (rowTiles.some(t => t.letter === '')) return { ...state, invalidShake: true };
      const guess = rowTiles.map(t => t.letter).join('');
      const alreadyGuessed = state.board
        .slice(0, state.currentRow)
        .some(r => r.submitted && r.tiles.map(t => t.letter).join('') === guess);
      if (alreadyGuessed) return { ...state, invalidShake: true };
      if (!isValidWord(guess, wordLength)) return { ...state, invalidShake: true };

      const tiles = computeGuess(guess, state.targetWord);
      const board = state.board.map(r => ({ ...r, tiles: [...r.tiles] }));
      board[state.currentRow] = { tiles, submitted: true };

      const won = tiles.every(t => t.status === 'correct');
      const nextRow = state.currentRow + 1;
      const lost = !won && nextRow >= MAX_GUESSES;

      return {
        ...state,
        board,
        currentRow: nextRow,
        currentCol: 0,
        status: won ? 'won' : lost ? 'lost' : 'playing',
        invalidShake: false,
      };
    }

    case 'CLEAR_SHAKE':
      return { ...state, invalidShake: false };

    default:
      return state;
  }
}

export function useGame(wordLength: number) {
  const [state, dispatch] = useReducer(reducer, wordLength, buildInitialState);
  const [statistics, setStatistics] = useState<Statistics>(() => loadStatistics(wordLength));
  const [sessionStats, setSessionStats] = useState<SessionStats>(loadSessionStats);

  // Salva o estado sempre que board/linha/coluna/status mudam (não no shake, que é transiente)
  useEffect(() => {
    if (state.invalidShake) return;
    saveGameState(state);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.board, state.currentRow, state.currentCol, state.status]);

  useEffect(() => {
    if (state.status !== 'won' && state.status !== 'lost') return;
    const updated = updateStatistics(wordLength, state.status === 'won', state.currentRow);
    setStatistics(updated);
    if (state.status === 'won') {
      const session = recordSessionWin(state.currentRow);
      setSessionStats(session);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  useEffect(() => {
    if (!state.invalidShake) return;
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 600);
    return () => clearTimeout(timer);
  }, [state.invalidShake]);

  const addLetter = useCallback((letter: string) => {
    dispatch({ type: 'ADD_LETTER', letter: letter.toUpperCase() });
  }, []);

  const deleteLetter = useCallback(() => {
    dispatch({ type: 'DELETE_LETTER' });
  }, []);

  const submitGuess = useCallback(() => {
    dispatch({ type: 'SUBMIT_GUESS' });
  }, []);

  const setCol = useCallback((col: number) => {
    dispatch({ type: 'SET_COL', col });
  }, []);

  const moveCol = useCallback((delta: -1 | 1) => {
    dispatch({ type: 'SET_COL', col: Math.min(Math.max(state.currentCol + delta, 0), wordLength - 1) });
  }, [state.currentCol, wordLength]);

  const keyStatuses = computeKeyStatuses(state.board);

  return { state, addLetter, deleteLetter, submitGuess, setCol, moveCol, keyStatuses, statistics, sessionStats };
}

function computeKeyStatuses(board: Row[]): KeyStatus {
  const priority: Record<TileStatus, number> = { correct: 3, present: 2, absent: 1, filled: 0, empty: 0 };
  const statuses: KeyStatus = {};

  function set(key: string, status: TileStatus) {
    const current = statuses[key];
    if (!current || priority[status] > priority[current]) {
      statuses[key] = status;
    }
  }

  for (const row of board) {
    if (!row.submitted) continue;
    for (const tile of row.tiles) {
      set(tile.letter, tile.status);
      const base = normalizeChar(tile.letter);
      if (base !== tile.letter) set(base, tile.status);
    }
  }

  return statuses;
}
