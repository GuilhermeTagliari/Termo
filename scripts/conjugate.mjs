/**
 * Gera formas conjugadas/flexionadas de 5 letras a partir das raízes do
 * dicionário Hunspell PT-BR. Não usa nspell — aplica as regras gramaticais
 * do português diretamente. Rápido e sem dependências pesadas.
 *
 * Uso: node scripts/conjugate.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Carrega palavras base ─────────────────────────────────────────────────
const dicRaw = readFileSync(
  join(__dir, '../node_modules/dictionary-pt/index.dic'),
  'utf8'
);
const baseWords = dicRaw
  .split('\n')
  .slice(1)
  .map(l => l.split('/')[0].trim().toLowerCase())
  .filter(w => /^[a-záéíóúâêôãõàèìòùçü]+$/.test(w) && w.length >= 2 && w.length <= 8);

console.log(`Raízes carregadas: ${baseWords.length}`);

const result = new Set(baseWords.filter(w => w.length === 5));

// ── Terminações que, aplicadas ao radical, geram palavras de 5 letras ─────
function add(stem, ...endings) {
  for (const end of endings) {
    const w = stem + end;
    if (w.length === 5) result.add(w);
  }
}

for (const word of baseWords) {
  // ── Verbos -AR ────────────────────────────────────────────────────────
  if (word.endsWith('ar') && word.length >= 3) {
    const s = word.slice(0, -2); // radical
    // presente do indicativo
    add(s, 'o', 'as', 'a', 'am', 'ais');
    // pretérito perfeito
    add(s, 'ei', 'ou', 'aste', 'aram', 'amos');
    // pretérito imperfeito
    add(s, 'ava', 'avas', 'avam', 'ámos', 'avam');
    // futuro do presente
    add(s, 'arei', 'ará', 'arás', 'arão', 'arão');
    // condicional
    add(s, 'aria', 'arias', 'ariam');
    // subjuntivo presente
    add(s, 'e', 'es', 'em', 'emos');
    // subjuntivo imperfeito
    add(s, 'asse', 'asses', 'assem');
    // futuro do subjuntivo
    add(s, 'ar', 'ares', 'arem');
    // infinitivo pessoal
    add(s, 'armo', 'ardes', 'arem');
    // gerúndio / particípio
    add(s, 'ando', 'ado', 'ada', 'ados', 'adas');
    // imperativo
    add(s, 'ai');
  }

  // ── Verbos -ER ────────────────────────────────────────────────────────
  if (word.endsWith('er') && word.length >= 3) {
    const s = word.slice(0, -2);
    add(s, 'o', 'es', 'e', 'em', 'eis');
    add(s, 'este', 'eu', 'emos', 'eram');
    add(s, 'ia', 'ias', 'iam', 'íeis');
    add(s, 'erei', 'erá', 'erão', 'erás');
    add(s, 'eria', 'erias', 'eriam');
    add(s, 'a', 'as', 'am', 'amos'); // subjuntivo
    add(s, 'esse', 'esses', 'essem');
    add(s, 'er', 'eres', 'erem');
    add(s, 'endo', 'ido', 'ida', 'idos', 'idas');
  }

  // ── Verbos -IR ────────────────────────────────────────────────────────
  if (word.endsWith('ir') && word.length >= 3) {
    const s = word.slice(0, -2);
    add(s, 'o', 'es', 'e', 'em', 'is', 'eis');
    add(s, 'iste', 'iu', 'imos', 'iram');
    add(s, 'ia', 'ias', 'iam', 'íeis');
    add(s, 'irei', 'irá', 'irão', 'irás');
    add(s, 'iria', 'irias', 'iriam');
    add(s, 'a', 'as', 'am', 'amos'); // subjuntivo
    add(s, 'isse', 'isses', 'issem');
    add(s, 'ir', 'ires', 'irem');
    add(s, 'indo', 'ido', 'ida', 'idos', 'idas');
  }

  // ── Plurais de palavras de 4 letras ───────────────────────────────────
  if (word.length === 4) {
    result.add(word + 's');                          // gatos, pedras
    if (word.endsWith('ão')) result.add(word.slice(0, -2) + 'ões'); // botões
    if (word.endsWith('al')) result.add(word.slice(0, -2) + 'ais'); // canais
    if (word.endsWith('el')) result.add(word.slice(0, -2) + 'éis'); // papéis
    if (word.endsWith('il')) result.add(word.slice(0, -2) + 'is');  // fuzis
    if (word.endsWith('ol')) result.add(word.slice(0, -2) + 'óis'); // anzóis
    if (word.endsWith('ul')) result.add(word.slice(0, -2) + 'uis'); // azuis
    if (word.endsWith('m'))  result.add(word.slice(0, -1) + 'ns'); // trem→trens, tom→tons, bom→bons
    if (word.endsWith('ão')) result.add(word.slice(0, -2) + 'ãos'); // mão→mãos, grão→grãos
    if (word.endsWith('or')) result.add(word + 'es');               // cor→cores (só 3-letra)
    if (word.endsWith('az')) result.add(word + 'es');               // paz→pazes (só se 5 total)
  }

  // -m → -ns para palavras de 3 letras (tom, bom, som, dom, rim, fim...)
  if (word.length === 3 && word.endsWith('m')) {
    result.add(word.slice(0, -1) + 'ns'); // tom→tons, bom→bons, rim→rins
  }

  // -r → -res para substantivos de 3 letras (mar→mares, par→pares, bar→bares)
  if (word.length === 3 && word.endsWith('r')) {
    result.add(word + 'es');
  }

  // ── Feminino de adjetivos/substantivos de 5 letras terminados em -o ───
  if (word.length === 5 && word.endsWith('o')) {
    result.add(word.slice(0, -1) + 'a'); // bonito → bonita
  }

  // ── Aumentativos / diminutivos comuns ─────────────────────────────────
  if (word.length === 3) {
    add(word, 'inho', 'inha', 'ão', 'ona', 'zão');
  }
}

// ── Filtra só palavras de 5 letras válidas (só letras PT) ─────────────────
const valid = [...result].filter(
  w => w.length === 5 && /^[a-záéíóúâêôãõàèìòùçü]+$/.test(w)
).sort();

console.log(`Palavras de 5 letras geradas: ${valid.length}`);

writeFileSync(join(__dir, 'words5.txt'), valid.join('\n'), 'utf8');
console.log('Salvo em scripts/words5.txt');
