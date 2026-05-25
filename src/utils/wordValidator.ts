import { WORDS } from '../data/wordlist';
import { getWordsByLength } from '../data/wordsByLength';

const wordSet5 = new Set(WORDS.map(w => w.toUpperCase()));

export function isValidWord(word: string, wordLength: number): boolean {
  const upper = word.toUpperCase();
  if (wordLength === 5) return wordSet5.has(upper);
  const list = getWordsByLength(wordLength);
  return list.some(w => w.toUpperCase() === upper);
}
