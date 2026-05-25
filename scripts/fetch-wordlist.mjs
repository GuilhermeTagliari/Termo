/**
 * Gera src/data/wordsByLength.generated.ts
 * Estratégia: interseção de dicionário real (LibreOffice PT-BR) com corpus de frequência
 * (OpenSubtitles PT-BR). Resultado = palavras reais E comuns.
 * Uso: node scripts/fetch-wordlist.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const DIC_URL =
  'https://raw.githubusercontent.com/LibreOffice/dictionaries/master/pt_BR/pt_BR.dic';
const FREQ_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_br/pt_br_50k.txt';

const LENGTHS = [4, 5, 6, 7, 8, 9, 10];

const VOWELS = new Set('aeiouáéíóúâêîôûãõàèìòùü');
const PT_RE  = /^[a-záéíóúâêîôûãõàèìòùçü]+$/;

function hasValidClusters(word) {
  let run = 0;
  for (const ch of word) {
    if (VOWELS.has(ch)) { run = 0; } else { run++; }
    if (run >= 3) return false;
  }
  return true;
}

console.log('Baixando dicionário PT-BR (LibreOffice)...');
const [dicRes, freqRes] = await Promise.all([fetch(DIC_URL), fetch(FREQ_URL)]);
if (!dicRes.ok)  throw new Error(`Dicionário HTTP ${dicRes.status}`);
if (!freqRes.ok) throw new Error(`Frequência HTTP ${freqRes.status}`);

const [dicText, freqText] = await Promise.all([dicRes.text(), freqRes.text()]);

// ── 1. Monta o conjunto de palavras válidas do dicionário ──────────────────
const dictSet = new Set();
for (const line of dicText.split('\n').slice(1)) {
  const raw = line.split(/[/\s]/)[0].trim();
  // Pula palavras que começam com maiúscula no dicionário = nomes próprios
  if (raw[0] && raw[0] === raw[0].toUpperCase() && raw[0] !== raw[0].toLowerCase()) continue;
  const word = raw.toLowerCase();
  if (PT_RE.test(word) && hasValidClusters(word)) dictSet.add(word);
}
console.log(`Dicionário: ${dictSet.size} entradas válidas`);

// ── 2. Percorre corpus de frequência (ordem = mais comum primeiro) ─────────
// Formato: "palavra frequência" por linha
/** @type {Map<number, string[]>} */
const byLength = new Map(LENGTHS.map(n => [n, []]));

for (const line of freqText.split('\n')) {
  const parts = line.trim().split(' ');
  const word = parts[0]?.toLowerCase();
  const freq = parseInt(parts[1] ?? '0', 10);
  if (!word) continue;

  const len = word.length;
  if (!byLength.has(len)) continue;
  if (!PT_RE.test(word)) continue;
  if (!hasValidClusters(word)) continue;
  if (freq < 2) continue;

  // Só aceita se estiver no dicionário real
  if (!dictSet.has(word)) continue;

  byLength.get(len).push(word);
}

for (const [len, words] of byLength) {
  console.log(`  ${len} letras: ${words.length} palavras`);
}

// ── 3. Gera arquivo TS ─────────────────────────────────────────────────────
const chunks = LENGTHS.map(len => {
  const words = byLength.get(len);
  const items = words.map(w => `'${w}'`).join(', ');
  return `export const CORPUS_${len}: string[] = [${items}];`;
});

const output = [
  '// GERADO AUTOMATICAMENTE — execute: node scripts/fetch-wordlist.mjs',
  '// Fonte: LibreOffice PT-BR (dicionário) ∩ OpenSubtitles PT-BR (frequência)',
  '',
  ...chunks,
].join('\n');

const outPath = join(__dir, '..', 'src', 'data', 'wordsByLength.generated.ts');
writeFileSync(outPath, output, 'utf8');
console.log(`\nSalvo em src/data/wordsByLength.generated.ts`);
