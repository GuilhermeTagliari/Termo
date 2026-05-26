import { describe, it, expect } from 'vitest';
import { computeGuess, normalizeChar } from './colorLogic';

describe('normalizeChar', () => {
  it('retorna letra maiúscula simples sem mudança', () => {
    expect(normalizeChar('A')).toBe('A');
    expect(normalizeChar('Z')).toBe('Z');
  });

  it('remove acentos e converte para maiúsculas', () => {
    expect(normalizeChar('Á')).toBe('A');
    expect(normalizeChar('Ã')).toBe('A');
    expect(normalizeChar('É')).toBe('E');
    expect(normalizeChar('Ê')).toBe('E');
    expect(normalizeChar('Í')).toBe('I');
    expect(normalizeChar('Ó')).toBe('O');
    expect(normalizeChar('Ô')).toBe('O');
    expect(normalizeChar('Ú')).toBe('U');
  });

  it('trata cedilha', () => {
    expect(normalizeChar('Ç')).toBe('C');
    expect(normalizeChar('ç')).toBe('C');
  });

  it('converte minúsculas para maiúsculas', () => {
    expect(normalizeChar('a')).toBe('A');
    expect(normalizeChar('á')).toBe('A');
  });
});

describe('computeGuess', () => {
  it('marca todas as tiles como correct em acerto exato', () => {
    const result = computeGuess('GATOS', 'GATOS');
    expect(result).toHaveLength(5);
    result.forEach(t => expect(t.status).toBe('correct'));
  });

  it('marca todas as tiles como absent quando nenhuma letra coincide', () => {
    const result = computeGuess('BBBBB', 'AAAAA');
    result.forEach(t => expect(t.status).toBe('absent'));
  });

  it('marca present para letra certa na posição errada', () => {
    // AGTOS vs GATOS: A e G trocados; T O S corretos
    const result = computeGuess('AGTOS', 'GATOS');
    expect(result[0].status).toBe('present'); // A está no alvo mas não na pos 0
    expect(result[1].status).toBe('present'); // G está no alvo mas não na pos 1
    expect(result[2].status).toBe('correct');
    expect(result[3].status).toBe('correct');
    expect(result[4].status).toBe('correct');
  });

  it('com letra duplicada no palpite, marca apenas tantos yellows quanto existem no alvo', () => {
    // alvo: BOLSA (A apenas na posição 4); palpite: AACCC (dois A's nas posições 0 e 1)
    // A(0) → present (consome o único A do alvo)
    // A(1) → absent (A já esgotado)
    const result = computeGuess('AACCC', 'BOLSA');
    const aStatuses = [result[0].status, result[1].status];
    expect(aStatuses.filter(s => s === 'present')).toHaveLength(1);
    expect(aStatuses.filter(s => s === 'absent')).toHaveLength(1);
  });

  it('com duas letras iguais no alvo, dois yellows quando palpite também tem dois', () => {
    // alvo: AABBB, palpite: XAAXX
    // Pass 1: A(1 palpite) == A(1 alvo) → correct; remaining[1]=null
    // Pass 2: A(2 palpite) → encontra A em remaining[0] → present
    const result = computeGuess('XAAXX', 'AABBB');
    expect(result[1].status).toBe('correct');
    expect(result[2].status).toBe('present');
  });

  it('em acerto exato, tile exibe a letra DO ALVO (com acento)', () => {
    // alvo: AÇÃO (A,Ç,Ã,O) — palpite sem acentos
    const result = computeGuess('ACAO', 'AÇÃO');
    expect(result[0].status).toBe('correct');
    expect(result[0].letter).toBe('A');
    expect(result[1].status).toBe('correct');
    expect(result[1].letter).toBe('Ç'); // exibe letra do alvo
    expect(result[2].status).toBe('correct');
    expect(result[2].letter).toBe('Ã'); // exibe letra do alvo
    expect(result[3].status).toBe('correct');
    expect(result[3].letter).toBe('O');
  });

  it('letra acentuada no palpite bate com não-acentuada no alvo', () => {
    // alvo: GATOS, palpite: GÁTOS — Á base é A, deve casar com A na posição 1
    const result = computeGuess('GÁTOS', 'GATOS');
    expect(result[1].status).toBe('correct');
    expect(result[1].letter).toBe('A'); // exibe letra do alvo
  });

  it('verde tem prioridade sobre amarelo para letras duplicadas', () => {
    // alvo: ABCDA, palpite: AXXXA
    // A(0) == A(0) → correct; A(4) == A(4) → correct
    // remaining = [null, B, C, D, null]
    const result = computeGuess('AXXXA', 'ABCDA');
    expect(result[0].status).toBe('correct');
    expect(result[4].status).toBe('correct');
    // nenhum A extra para amarelo
    const statuses = result.slice(1, 4).map(t => t.status);
    statuses.forEach(s => expect(s).toBe('absent'));
  });
});
