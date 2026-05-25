import { useCallback, useEffect, useState } from 'react';
import { Board } from './components/Board';
import { Keyboard } from './components/Keyboard';
import { MenuScreen } from './components/MenuScreen';
import { Modal } from './components/Modal';
import { useGame } from './hooks/useGame';
import { useKeyboard } from './hooks/useKeyboard';
import './App.css';

export default function App() {
  const [wordLength, setWordLength] = useState<number | null>(null);

  if (wordLength === null) {
    return <MenuScreen onSelect={setWordLength} />;
  }

  return <Game wordLength={wordLength} onBackToMenu={() => setWordLength(null)} />;
}

interface GameProps {
  wordLength: number;
  onBackToMenu: () => void;
}

function Game({ wordLength, onBackToMenu }: GameProps) {
  const { state, addLetter, deleteLetter, submitGuess, setCol, moveCol, keyStatuses, statistics, sessionStats } =
    useGame(wordLength);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isGameOver = state.status !== 'playing';

  useKeyboard({
    onLetter: addLetter,
    onDelete: deleteLetter,
    onSubmit: submitGuess,
    onMove: moveCol,
    disabled: isGameOver,
  });

  useEffect(() => {
    if (isGameOver) {
      const delay = state.status === 'won' ? 1800 : 1200;
      const timer = setTimeout(() => setShowModal(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, state.status]);

  useEffect(() => {
    if (state.invalidShake) {
      showToast('Palavra inválida');
    }
  }, [state.invalidShake]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1500);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <button className="header__back" onClick={onBackToMenu} aria-label="Voltar ao menu">
          ←
        </button>
        <h1 className="header__title">PROJETO W</h1>
        <span className="header__length">{wordLength} letras</span>
      </header>

      {toast && (
        <div className="toast" role="alert" aria-live="assertive">
          {toast}
        </div>
      )}

      <main className="main">
        <Board
          board={state.board}
          currentRow={state.currentRow}
          currentCol={state.currentCol}
          invalidShake={state.invalidShake}
          wordLength={wordLength}
          onTileClick={isGameOver ? () => {} : setCol}
        />
      </main>

      <footer className="footer">
        <Keyboard
          onLetter={addLetter}
          onDelete={deleteLetter}
          onSubmit={submitGuess}
          keyStatuses={keyStatuses}
        />
      </footer>

      {showModal && (
        <Modal
          status={state.status}
          targetWord={state.targetWord}
          statistics={statistics}
          sessionStats={sessionStats}
          wordLength={wordLength}
          onClose={() => setShowModal(false)}
          onBackToMenu={() => {
            setShowModal(false);
            onBackToMenu();
          }}
        />
      )}
    </div>
  );
}
