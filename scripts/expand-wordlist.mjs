/**
 * Usa nspell + dictionary-pt para expandir a wordlist.
 * Gera conjugações e formas flexionadas e valida cada uma.
 * Uso: node scripts/expand-wordlist.mjs
 */

import nspell from 'nspell';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const dictDir = join(__dir, '../node_modules/dictionary-pt');

console.log('Carregando dicionário PT-BR...');
const aff = readFileSync(join(dictDir, 'index.aff'));
const dic = readFileSync(join(dictDir, 'index.dic'));
const spell = nspell({ aff, dic });

// Lê palavras-base do .dic (sem os flags de afixo)
const dicLines = dic.toString('utf8').split('\n').slice(1);
const baseWords = dicLines
  .map(l => l.split('/')[0].trim().toLowerCase())
  .filter(w => /^[a-záéíóúâêôãõàèìòùçüï]+$/.test(w));

console.log(`Palavras base: ${baseWords.length}`);

const PT_ALPHABET = 'abcdefghijklmnopqrstuvwxyzáéíóúâêôãõçü';
const candidates = new Set();

// ── 1. Palavras base de 5 letras ──────────────────────────────────────────
for (const w of baseWords) {
  if (w.length === 5) candidates.add(w);
}

// ── 2. Conjugações de verbos -ar/-er/-ir ─────────────────────────────────
const arEndings = ['amos', 'ando', 'aram', 'arei', 'arem', 'ares', 'aria',
  'ario', 'armo', 'aram', 'aste', 'avas', 'avam', 'adas', 'ados',
  'ação', 'acam', 'adas', 'ados', 'amos'];
const erEndings = ['emos', 'endo', 'eram', 'erei', 'erem', 'eres', 'eria',
  'erão', 'este', 'idas', 'idos', 'eram'];
const irEndings = ['imos', 'indo', 'iram', 'irei', 'irem', 'ires', 'iria',
  'irão', 'iste', 'idas', 'idos'];

// terminações curtas (2-3 chars) que resultam em palavra de 5 letras
const shortArEnds = ['am', 'as', 'ai', 'ar', 'ei', 'em', 'ou', 'ão'];
const shortErEnds = ['am', 'as', 'ei', 'em', 'eu', 'er', 'ão'];
const shortIrEnds = ['am', 'as', 'ia', 'ir', 'iu', 'ão'];

for (const verb of baseWords) {
  if (verb.endsWith('ar') && verb.length >= 3) {
    const stem = verb.slice(0, -2);
    for (const end of [...arEndings, ...shortArEnds]) {
      const w = stem + end;
      if (w.length === 5) candidates.add(w);
    }
  }
  if (verb.endsWith('er') && verb.length >= 3) {
    const stem = verb.slice(0, -2);
    for (const end of [...erEndings, ...shortErEnds]) {
      const w = stem + end;
      if (w.length === 5) candidates.add(w);
    }
  }
  if (verb.endsWith('ir') && verb.length >= 3) {
    const stem = verb.slice(0, -2);
    for (const end of [...irEndings, ...shortIrEnds]) {
      const w = stem + end;
      if (w.length === 5) candidates.add(w);
    }
  }
}

// ── 3. Plurais de palavras de 4 letras ────────────────────────────────────
for (const w of baseWords) {
  if (w.length === 4) {
    candidates.add(w + 's');
    if (w.endsWith('m')) candidates.add(w.slice(0, -1) + 'ns');
    if (w.endsWith('ão')) candidates.add(w.slice(0, -2) + 'ões');
  }
}

// ── 4. Palavras de 6 letras truncadas (raízes de 5) ───────────────────────
for (const w of baseWords) {
  if (w.length === 6) candidates.add(w.slice(0, 5));
}

// ── 5. Candidatos do words5.txt existente ─────────────────────────────────
try {
  const existing = readFileSync(join(__dir, 'words5.txt'), 'utf8');
  for (const w of existing.split('\n')) {
    if (w.trim().length === 5) candidates.add(w.trim().toLowerCase());
  }
} catch { /* não existe ainda */ }

console.log(`Candidatos gerados: ${candidates.size}`);

// ── Valida cada candidato com nspell ──────────────────────────────────────
const valid = [];
let i = 0;
for (const word of candidates) {
  if (word.length === 5 && spell.correct(word)) valid.push(word);
  if (++i % 5000 === 0) process.stdout.write(`\r  verificando... ${i}/${candidates.size}`);
}
process.stdout.write('\n');

valid.sort();
console.log(`Palavras válidas de 5 letras: ${valid.length}`);

writeFileSync(join(__dir, 'words5.txt'), valid.join('\n'), 'utf8');
console.log('Salvo em scripts/words5.txt — rode generate-wordlist.mjs para gerar o .ts');
