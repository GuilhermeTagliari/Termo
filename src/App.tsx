import { useCallback, useEffect, useState } from 'react';
import { Board } from './components/Board';
import { Keyboard } from './components/Keyboard';
import { Modal } from './components/Modal';
import { useGame } from './hooks/useGame';
import { useKeyboard } from './hooks/useKeyboard';
import './App.css';

export default function App() {
  const { state, addLetter, deleteLetter, submitGuess, setCol, moveCol, keyStatuses, statistics } = useGame();
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
        <h1 className="header__title">PROJETO W</h1>
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
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
