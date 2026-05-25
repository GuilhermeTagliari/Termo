/**
 * Baixa a lista de frequência OpenSubtitles PT-BR (formas já flexionadas)
 * e gera scripts/words5.txt com todas as palavras de 5 letras.
 * Uso: node scripts/fetch-wordlist.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Corpus de frequência com formas conjugadas/flexionadas (OpenSubtitles via hermitdave)
const URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pt_BR/pt_BR_50k.txt';

console.log('Baixando corpus de frequência PT-BR (OpenSubtitles)...');
const res = await fetch(URL);
if (!res.ok) throw new Error(`HTTP ${res.status}`);

const text = await res.text();

// Formato do arquivo: "palavra frequência" por linha
const words = text
  .split('\n')
  .map(line => line.split(' ')[0].trim().toLowerCase())
  .filter(w => {
    if (w.length !== 5) return false;
    // Só letras do alfabeto português — sem números, hífens, apóstrofos
    return /^[a-záéíóúâêôãõàèìòùçüïöü]+$/.test(w);
  });

const unique = [...new Set(words)];

console.log(`Encontradas ${unique.length} palavras de 5 letras (por frequência de uso).`);

const outPath = join(__dir, 'words5.txt');
writeFileSync(outPath, unique.join('\n'), 'utf8');
console.log(`Salvo em scripts/words5.txt`);
