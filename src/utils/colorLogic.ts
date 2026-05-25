import type { Tile, TileStatus } from '../types';

function base(c: string): string {
  return c.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

export function computeGuess(guess: string, target: string): Tile[] {
  const guessChars  = guess.split('');
  const targetChars = target.split('');

  const result: Tile[] = guessChars.map(letter => ({
    letter,
    status: 'absent' as TileStatus,
  }));

  // Cópia mutável — vamos "riscar" cada letra da resposta conforme usada
  const remaining: (string | null)[] = [...targetChars];

  // ── Passagem 1: posições exatas ────────────────────────────────────────
  // Letra A bate com Â (ignora acento). Tile verde exibe a letra DA RESPOSTA.
  for (let i = 0; i < 5; i++) {
    if (base(guessChars[i]) === base(targetChars[i])) {
      result[i].status = 'correct';
      result[i].letter = targetChars[i]; // exibe com acento da resposta
      remaining[i] = null;               // risca para não contar de novo
    }
  }

  // ── Passagem 2: letras certas fora de lugar ────────────────────────────
  // Só procura entre as letras ainda NÃO riscadas, garantindo que letras
  // duplicadas recebam o status certo (verde > amarelo > cinza).
  for (let i = 0; i < 5; i++) {
    if (result[i].status === 'correct') continue;

    const idx = remaining.findIndex(
      r => r !== null && base(r) === base(guessChars[i])
    );

    if (idx !== -1) {
      result[i].status = 'present';
      remaining[idx] = null; // risca para não contar de novo
    }
  }

  return result;
}

export { base as normalizeChar };
