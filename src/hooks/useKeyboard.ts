import { useEffect } from 'react';

interface UseKeyboardProps {
  onLetter: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onMove: (delta: -1 | 1) => void;
  disabled: boolean;
}

const VALID_KEYS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÃÄÇÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜ'.split(''));

export function useKeyboard({ onLetter, onDelete, onSubmit, onMove, disabled }: UseKeyboardProps) {
  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Enter') { onSubmit(); return; }
      if (e.key === 'Backspace') { onDelete(); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); onMove(-1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); onMove(1);  return; }

      const key = e.key.toUpperCase();
      if (key.length === 1 && VALID_KEYS.has(key)) onLetter(key);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLetter, onDelete, onSubmit, onMove, disabled]);
}
