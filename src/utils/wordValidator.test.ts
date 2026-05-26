import { describe, it, expect, vi } from 'vitest';

vi.mock('../data/wordsByLength', () => ({
  getWordsByLength: (length: number) => {
    const corpus: Record<number, string[]> = {
      5: ['gatos', 'patos', 'matos', 'carro', 'pedra'],
      6: ['carros', 'pedras'],
    };
    return corpus[length] ?? [];
  },
}));

import { isValidWord } from './wordValidator';

describe('isValidWord', () => {
  it('retorna true para palavra do corpus', () => {
    expect(isValidWord('GATOS', 5)).toBe(true);
  });

  it('é case-insensitive', () => {
    expect(isValidWord('gatos', 5)).toBe(true);
    expect(isValidWord('Gatos', 5)).toBe(true);
  });

  it('retorna false para palavra fora do corpus', () => {
    expect(isValidWord('ZZZZZ', 5)).toBe(false);
  });

  it('retorna false quando o comprimento não tem corpus', () => {
    expect(isValidWord('ABCDE', 7)).toBe(false);
  });

  it('valida corretamente para comprimentos diferentes', () => {
    expect(isValidWord('CARROS', 6)).toBe(true);
    expect(isValidWord('CARROS', 5)).toBe(false); // 6 letras não estão no corpus de 5
  });
});
