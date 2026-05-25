import {
  CORPUS_4,
  CORPUS_5,
  CORPUS_6,
  CORPUS_7,
  CORPUS_8,
  CORPUS_9,
  CORPUS_10,
} from './wordsByLength.generated';

export const WORDS_BY_LENGTH: Record<number, string[]> = {
  4: CORPUS_4,
  5: CORPUS_5,
  6: CORPUS_6,
  7: CORPUS_7,
  8: CORPUS_8,
  9: CORPUS_9,
  10: CORPUS_10,
};

export function getWordsByLength(length: number): string[] {
  return WORDS_BY_LENGTH[length] ?? [];
}

export function getRandomWordForDay(length: number): string {
  const key = `termo_rnd_${length}`;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { date, word } = JSON.parse(raw) as { date: string; word: string };
      if (date === today) return word.toUpperCase();
    }
  } catch {
    // ignore
  }

  const list = getWordsByLength(length);
  if (list.length === 0) return '';
  const word = list[Math.floor(Math.random() * list.length)];
  try {
    localStorage.setItem(key, JSON.stringify({ date: today, word }));
  } catch {
    // ignore
  }
  return word.toUpperCase();
}
