import { getWordsByLength } from '../data/wordsByLength';

const cache = new Map<number, Set<string>>();

function getWordSet(length: number): Set<string> {
  if (!cache.has(length)) {
    cache.set(length, new Set(getWordsByLength(length).map(w => w.toUpperCase())));
  }
  return cache.get(length)!;
}

export function isValidWord(word: string, wordLength: number): boolean {
  return getWordSet(wordLength).has(word.toUpperCase());
}
