import { WORDS } from '../data/wordlist';

const wordSet = new Set(WORDS.map(w => w.toUpperCase()));

export function isValidWord(word: string): boolean {
  return wordSet.has(word.toUpperCase());
}
