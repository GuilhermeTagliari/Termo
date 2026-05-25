# PROJETO W

Clone do [TERMO](https://term.ooo/) — versão brasileira do Wordle — com modos de **4 a 10 letras**, palavras aleatórias por jogador e estatísticas por tamanho.

🔗 **[termo-omega-pink.vercel.app](https://termo-omega-pink.vercel.app/)**

## Como jogar

1. **Escolha o tamanho** da palavra (4 a 10 letras) no menu inicial
2. Você tem **6 tentativas** para adivinhar a palavra
3. Se acertar, volte ao menu e jogue outro tamanho
4. Se errar todas as 6, aquele tamanho fica bloqueado até amanhã 🔒

### Cores das letras

| Cor | Significado |
|-----|-------------|
| 🟩 Verde | Letra correta na posição certa |
| 🟨 Amarelo | Letra existe, mas na posição errada |
| ⬜ Cinza | Letra não está na palavra |

### Ícones no menu

| Ícone | Significado |
|-------|-------------|
| ✓ | Tamanho jogado hoje (ganhou) |
| 🔒 | Tamanho bloqueado até amanhã (perdeu) |

## Como rodar localmente

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de produção
npm run preview    # pré-visualizar o build
```

### Atualizar lista de palavras

```bash
node scripts/fetch-wordlist.mjs
```

Baixa o corpus OpenSubtitles PT-BR (50k palavras) e gera `src/data/wordsByLength.generated.ts` com listas para cada tamanho.

## Arquitetura

```
src/
├── components/
│   ├── MenuScreen.tsx   # Seleção de tamanho de palavra
│   ├── Board.tsx        # Grade 6×N de tiles (N = tamanho escolhido)
│   ├── Row.tsx          # Linha com animação de shake
│   ├── Tile.tsx         # Célula individual com flip animado (tamanho responsivo)
│   ├── Keyboard.tsx     # Teclado virtual com estado de cores
│   └── Modal.tsx        # Resultado, estatísticas e destaques da sessão
├── hooks/
│   ├── useGame.ts       # Estado central do jogo (useReducer)
│   └── useKeyboard.ts   # Listener de teclado físico
├── utils/
│   ├── colorLogic.ts    # Algoritmo de coloração (duas passagens, suporte a acentos)
│   ├── wordValidator.ts # Validação por tamanho
│   └── storage.ts       # localStorage com chaves por tamanho e por dia
├── data/
│   ├── wordlist.ts                  # Lista curada de palavras de 5 letras
│   ├── wordsByLength.ts             # Seleção e sorteio por tamanho
│   └── wordsByLength.generated.ts   # Gerado por scripts/fetch-wordlist.mjs
├── types/
│   └── index.ts         # Tipos globais (GameState, Statistics, SessionStats)
├── App.tsx              # Menu → jogo, toast e modal
└── main.tsx             # Entry point
scripts/
└── fetch-wordlist.mjs   # Baixa corpus PT-BR e gera wordsByLength.generated.ts
```

## Decisões técnicas

### Palavras aleatórias por jogador
`getRandomWordForDay(length)` sorteia uma palavra por tamanho por dia e salva em `localStorage` — cada jogador recebe uma palavra diferente, sem necessidade de backend.

### Tamanho dinâmico
`WORD_LENGTH` deixou de ser uma constante global. O tamanho vive em `GameState.wordLength` e é passado como prop para os componentes. Os tiles se redimensionam via `clamp()` no CSS para caber em qualquer tela.

### Bloqueio por tamanho
Cada tamanho tem seu próprio estado salvo em `termo_game_state_{N}`. Perder bloqueia apenas aquele tamanho até meia-noite; os demais ficam disponíveis.

### Estatísticas por sessão
`SessionStats` rastreia quantas palavras foram acertadas no dia e qual foi o melhor desempenho (menor número de tentativas), exibidos no modal de resultado.

### Lógica de coloração
Função pura `computeGuess(guess, target)` em duas passagens:
1. Marca posições exatas (`correct`) — tile exibe a letra com o acento da resposta
2. Marca letras fora de posição (`present`), respeitando multiplicidade

### Animações CSS puras
- **Flip** nas tiles ao submeter (delay escalonado por posição)
- **Shake** na linha quando a palavra é inválida
- **Pop** ao digitar uma letra
