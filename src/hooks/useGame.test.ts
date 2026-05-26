import { describe, it, expect, vi } from 'vitest';

// Mocks devem vir antes dos imports dos módulos que os usam
vi.mock('../utils/wordValidator', () => ({
  isValidWord: vi.fn(() => true),
}));

vi.mock('../data/wordsByLength', () => ({
  getWordsByLength: vi.fn(() => ['GATOS']),
  getRandomWordForDay: vi.fn(() => 'GATOS'),
}));

import { reducer, emptyBoard, computeKeyStatuses } from './useGame';
import { isValidWord } from '../utils/wordValidator';
import type { GameState } from '../types';
import { MAX_GUESSES } from '../types';

const mockIsValid = vi.mocked(isValidWord);

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: emptyBoard(5),
    currentRow: 0,
    currentCol: 0,
    targetWord: 'GATOS',
    status: 'playing',
    invalidShake: false,
    wordLength: 5,
    ...overrides,
  };
}

// Preenche as letras de uma palavra via ações ADD_LETTER
function fillWord(state: GameState, word: string): GameState {
  return word.split('').reduce((s, letter) => reducer(s, { type: 'ADD_LETTER', letter }), state);
}

// ── ADD_LETTER ────────────────────────────────────────────────────────────────

describe('reducer ADD_LETTER', () => {
  it('insere letra na posição atual e avança coluna', () => {
    const state = makeState();
    const next = reducer(state, { type: 'ADD_LETTER', letter: 'G' });
    expect(next.board[0].tiles[0].letter).toBe('G');
    expect(next.board[0].tiles[0].status).toBe('filled');
    expect(next.currentCol).toBe(1);
  });

  it('permanece na última coluna ao preencher a palavra completa', () => {
    const state = fillWord(makeState(), 'GATOS');
    expect(state.currentCol).toBe(4); // preso na última coluna
    const next = reducer(state, { type: 'ADD_LETTER', letter: 'X' });
    expect(next.currentCol).toBe(4); // continua na última
  });

  it('ignora ação quando o jogo não está em andamento', () => {
    const state = makeState({ status: 'won' });
    const next = reducer(state, { type: 'ADD_LETTER', letter: 'G' });
    expect(next).toBe(state); // referência igual = sem mudança
  });
});

// ── DELETE_LETTER ─────────────────────────────────────────────────────────────

describe('reducer DELETE_LETTER', () => {
  it('apaga letra na coluna atual se houver', () => {
    let state = reducer(makeState(), { type: 'ADD_LETTER', letter: 'G' });
    state = reducer(state, { type: 'ADD_LETTER', letter: 'A' });
    // currentCol = 2, apaga A na col 1 (volta para col 1)? Não — apaga na col atual
    // col=2 não tem letra (ainda vazia), volta para col 1 e apaga
    const next = reducer(state, { type: 'DELETE_LETTER' });
    expect(next.board[0].tiles[1].letter).toBe('');
    expect(next.currentCol).toBe(1);
  });

  it('apaga a letra na coluna atual quando ela é preenchida', () => {
    const state = fillWord(makeState(), 'GATOS'); // currentCol = 4
    const next = reducer(state, { type: 'DELETE_LETTER' }); // apaga S na col 4
    expect(next.board[0].tiles[4].letter).toBe('');
    expect(next.currentCol).toBe(4); // cursor permanece na col 4
  });

  it('não faz nada na col 0 com tile vazio', () => {
    const state = makeState(); // col=0, tile vazio
    const next = reducer(state, { type: 'DELETE_LETTER' });
    expect(next).toBe(state);
  });
});

// ── SET_COL ───────────────────────────────────────────────────────────────────

describe('reducer SET_COL', () => {
  it('define a coluna dentro dos limites', () => {
    const next = reducer(makeState(), { type: 'SET_COL', col: 3 });
    expect(next.currentCol).toBe(3);
  });

  it('clamp para 0 se negativo', () => {
    const next = reducer(makeState(), { type: 'SET_COL', col: -5 });
    expect(next.currentCol).toBe(0);
  });

  it('clamp para wordLength-1 se exceder', () => {
    const next = reducer(makeState(), { type: 'SET_COL', col: 99 });
    expect(next.currentCol).toBe(4); // wordLength=5, max=4
  });
});

// ── SUBMIT_GUESS ──────────────────────────────────────────────────────────────

describe('reducer SUBMIT_GUESS', () => {
  it('dispara invalidShake quando a linha está incompleta', () => {
    const state = reducer(makeState(), { type: 'ADD_LETTER', letter: 'G' });
    const next = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(next.invalidShake).toBe(true);
    expect(next.currentRow).toBe(0); // linha não avança
  });

  it('dispara invalidShake quando a palavra é inválida', () => {
    mockIsValid.mockReturnValueOnce(false);
    const state = fillWord(makeState(), 'ZZZZZ');
    const next = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(next.invalidShake).toBe(true);
  });

  it('dispara invalidShake quando a palavra já foi tentada', () => {
    let state = fillWord(makeState(), 'PATOS');
    state = reducer(state, { type: 'SUBMIT_GUESS' }); // 1ª tentativa
    state = fillWord(state, 'PATOS');                  // repete a mesma
    const next = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(next.invalidShake).toBe(true);
  });

  it('submete guess válido e avança a linha', () => {
    const state = fillWord(makeState(), 'PATOS');
    const next = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(next.board[0].submitted).toBe(true);
    expect(next.currentRow).toBe(1);
    expect(next.currentCol).toBe(0);
    expect(next.invalidShake).toBe(false);
    expect(next.status).toBe('playing');
  });

  it('define status como won quando todas as tiles são correct', () => {
    const state = fillWord(makeState(), 'GATOS'); // palavra exata
    const next = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(next.status).toBe('won');
  });

  it('define status como lost após esgotar todas as tentativas', () => {
    let state = makeState();
    const words = ['PATOS', 'MATOS', 'RATOS', 'BATOS', 'DATOS'];
    // 5 tentativas erradas
    for (const w of words) {
      state = fillWord(state, w);
      state = reducer(state, { type: 'SUBMIT_GUESS' });
    }
    expect(state.currentRow).toBe(5);
    // 6ª tentativa
    state = fillWord(state, 'LATOS');
    state = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(state.status).toBe('lost');
  });

  it('ignora ações após o jogo terminar (exceto CLEAR_SHAKE)', () => {
    const state = makeState({ status: 'won' });
    const next = reducer(state, { type: 'SUBMIT_GUESS' });
    expect(next).toBe(state);
  });
});

// ── CLEAR_SHAKE ───────────────────────────────────────────────────────────────

describe('reducer CLEAR_SHAKE', () => {
  it('limpa o flag invalidShake', () => {
    const state = makeState({ invalidShake: true });
    const next = reducer(state, { type: 'CLEAR_SHAKE' });
    expect(next.invalidShake).toBe(false);
  });

  it('funciona mesmo após o jogo terminar', () => {
    const state = makeState({ status: 'won', invalidShake: true });
    const next = reducer(state, { type: 'CLEAR_SHAKE' });
    expect(next.invalidShake).toBe(false);
  });
});

// ── emptyBoard ────────────────────────────────────────────────────────────────

describe('emptyBoard', () => {
  it('cria MAX_GUESSES linhas com wordLength tiles vazios', () => {
    const board = emptyBoard(5);
    expect(board).toHaveLength(MAX_GUESSES);
    board.forEach(row => {
      expect(row.tiles).toHaveLength(5);
      expect(row.submitted).toBe(false);
      row.tiles.forEach(t => {
        expect(t.letter).toBe('');
        expect(t.status).toBe('empty');
      });
    });
  });
});

// ── computeKeyStatuses ────────────────────────────────────────────────────────

describe('computeKeyStatuses', () => {
  it('retorna objeto vazio para board vazio', () => {
    expect(computeKeyStatuses(emptyBoard(5))).toEqual({});
  });

  it('ignora linhas não submetidas', () => {
    const board = emptyBoard(5);
    board[0].tiles[0] = { letter: 'G', status: 'filled' };
    expect(computeKeyStatuses(board)).toEqual({});
  });

  it('colore teclas a partir das linhas submetidas', () => {
    const board = emptyBoard(5);
    board[0] = {
      submitted: true,
      tiles: [
        { letter: 'G', status: 'correct' },
        { letter: 'A', status: 'present' },
        { letter: 'T', status: 'absent' },
        { letter: 'O', status: 'absent' },
        { letter: 'S', status: 'correct' },
      ],
    };
    const ks = computeKeyStatuses(board);
    expect(ks['G']).toBe('correct');
    expect(ks['A']).toBe('present');
    expect(ks['T']).toBe('absent');
    expect(ks['S']).toBe('correct');
  });

  it('correct tem prioridade sobre present e absent para a mesma tecla', () => {
    const board = emptyBoard(5);
    board[0] = {
      submitted: true,
      tiles: [{ letter: 'A', status: 'present' }, ...Array(4).fill({ letter: 'X', status: 'absent' })],
    };
    board[1] = {
      submitted: true,
      tiles: [{ letter: 'A', status: 'correct' }, ...Array(4).fill({ letter: 'Y', status: 'absent' })],
    };
    const ks = computeKeyStatuses(board);
    expect(ks['A']).toBe('correct');
  });

  it('letra acentuada mapeia a base também', () => {
    const board = emptyBoard(5);
    board[0] = {
      submitted: true,
      tiles: [
        { letter: 'Ã', status: 'correct' },
        ...Array(4).fill({ letter: 'X', status: 'absent' }),
      ],
    };
    const ks = computeKeyStatuses(board);
    expect(ks['Ã']).toBe('correct');
    expect(ks['A']).toBe('correct'); // base 'A' também é colorida
  });
});
