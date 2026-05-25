/**
 * Baixa o corpus de frequência OpenSubtitles PT-BR e gera
 * src/data/wordsByLength.generated.ts com listas para 4–10 letras.
 * Uso: node scripts/fetch-wordlist.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_50k.txt';

const LENGTHS = [4, 5, 6, 7, 8, 9, 10];

// Só aceita letras do alfabeto português — sem números, hífens, apóstrofos, etc.
const PT_RE = /^[a-záéíóúâêîôûãõàèìòùçüïöäëÿñ]+$/i;

console.log('Baixando corpus de frequência PT-BR (OpenSubtitles)...');
const res = await fetch(URL);
if (!res.ok) throw new Error(`HTTP ${res.status}`);
const text = await res.text();

// Formato: "palavra frequência" por linha, ordenado por frequência decrescente
const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

/** @type {Map<number, string[]>} */
const byLength = new Map(LENGTHS.map(n => [n, []]));

for (const line of lines) {
  const word = line.split(' ')[0].toLowerCase();
  const len = word.length;
  if (!byLength.has(len)) continue;
  if (!PT_RE.test(word)) continue;
  byLength.get(len).push(word);
}

for (const [len, words] of byLength) {
  console.log(`  ${len} letras: ${words.length} palavras`);
}

// Gera o arquivo TS
const chunks = LENGTHS.map(len => {
  const words = byLength.get(len);
  const items = words.map(w => `'${w}'`).join(', ');
  return `export const CORPUS_${len}: string[] = [${items}];`;
});

const output = [
  '// GERADO AUTOMATICAMENTE — execute: node scripts/fetch-wordlist.mjs',
  '// Fonte: hermitdave/FrequencyWords — OpenSubtitles PT-BR 50k',
  '',
  ...chunks,
].join('\n');

const outPath = join(__dir, '..', 'src', 'data', 'wordsByLength.generated.ts');
writeFileSync(outPath, output, 'utf8');
console.log(`\nSalvo em src/data/wordsByLength.generated.ts`);
console.log('Rode o build normalmente após isso.');
