/**
 * Lê scripts/words5.txt e gera src/data/wordlist.ts
 * Uso: node scripts/generate-wordlist.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const raw = readFileSync(join(__dir, 'words5.txt'), 'utf8');
const allWords = raw.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);

// Remove palavras com padrões ruins para o jogo:
// - começa com maiúscula no original (nomes próprios viram lowercase mas podemos
//   detectar pelo hunspell — por ora, mantemos tudo)
// - palavras sem vogal (siglas)
// - palavras com 'ç' no início (raras demais)
const filtered = allWords;

// Chunks de 10 para o arquivo TS
const chunks = [];
for (let i = 0; i < filtered.length; i += 10) {
  const chunk = filtered.slice(i, i + 10).map(w => `'${w}'`).join(', ');
  chunks.push(`  ${chunk},`);
}

const content = `export const WORD_LIST: string[] = [
${chunks.join('\n')}
];

// Deduplicate and ensure all words are exactly 5 characters
const seen = new Set<string>();
export const WORDS: string[] = WORD_LIST.filter(w => {
  const clean = w.toLowerCase().trim();
  if (clean.length !== 5 || seen.has(clean)) return false;
  seen.add(clean);
  return true;
});

export function getTodayWord(): string {
  const start = new Date('2024-01-01').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start) / 86400000);
  const index = Math.abs(diff) % WORDS.length;
  return WORDS[index].toUpperCase();
}
`;

const outPath = join(__dir, '../src/data/wordlist.ts');
writeFileSync(outPath, content, 'utf8');
console.log(`Gerado src/data/wordlist.ts com ${filtered.length} palavras.`);
