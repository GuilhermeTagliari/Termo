# TERMO

Clone do [TERMO](https://term.ooo/) — versão brasileira do Wordle — construído com React, TypeScript e Vite.

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:5173)
npm run dev

# Build de produção
npm run build

# Pré-visualizar o build
npm run preview
```

## Deploy

### Vercel (recomendado)

```bash
npm install -g vercel
vercel --prod
```

### ngrok (expor dev server localmente)

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 5173
```

## Como jogar

- Você tem **6 tentativas** para adivinhar a palavra de **5 letras** do dia
- Digite usando o teclado físico ou o teclado virtual na tela
- Pressione **Enter** para confirmar a tentativa
- **Backspace** apaga a última letra

### Cores

| Cor | Significado |
|-----|-------------|
| 🟩 Verde | Letra correta na posição certa |
| 🟨 Amarelo | Letra existe, mas na posição errada |
| ⬜ Cinza | Letra não está na palavra |

## Arquitetura

```
src/
├── components/        # Componentes React (UI pura)
│   ├── Board.tsx      # Grade 6×5 de tiles
│   ├── Row.tsx        # Linha com animação de shake
│   ├── Tile.tsx       # Célula individual com flip animado
│   ├── Keyboard.tsx   # Teclado virtual com estado de cores
│   └── Modal.tsx      # Modal de resultado e estatísticas
├── hooks/
│   ├── useGame.ts     # Estado central do jogo (useReducer)
│   └── useKeyboard.ts # Listener de teclado físico
├── utils/
│   ├── colorLogic.ts  # Algoritmo puro de coloração (sem efeitos colaterais)
│   ├── wordValidator.ts # Validação via Set para O(1)
│   └── storage.ts     # Persistência com localStorage
├── data/
│   └── wordlist.ts    # 500+ palavras PT-BR + getTodayWord()
├── types/
│   └── index.ts       # Tipos e constantes globais
├── App.tsx            # Composição, toast e modal trigger
└── main.tsx           # Entry point
```

## Decisões técnicas

### Lógica de coloração (`colorLogic.ts`)
Função pura `computeGuess(guess, target)` que implementa o algoritmo em duas passagens:
1. Marca letras na posição correta (`correct`)
2. Marca letras presentes mas fora de posição (`present`), respeitando multiplicidade

### Gerenciamento de estado (`useGame.ts`)
`useReducer` com dispatch tipado garante que todas as transições de estado sejam explícitas e testáveis. As ações `ADD_LETTER`, `DELETE_LETTER`, `SUBMIT_GUESS` e `CLEAR_SHAKE` cobrem o ciclo completo do jogo.

### Palavra do dia
`getTodayWord()` em `wordlist.ts` calcula o índice a partir da diferença de dias desde uma data de origem fixa — mesma palavra para todos os usuários no mesmo dia, sem necessidade de backend.

### Persistência
O estado do jogo é salvo no `localStorage` com a data do dia como chave de validade. Estatísticas (jogos, vitórias, sequências, distribuição de palpites) são mantidas em separado e persistem entre dias.

### Animações
- **Flip** nas tiles ao submeter (CSS `rotateX` com delay escalonado por posição)
- **Shake** na linha quando a palavra é inválida
- **Pop** ao digitar uma letra
- Todas as animações via CSS puro, sem dependências externas
