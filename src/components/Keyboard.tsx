import type { KeyStatus } from '../types';
import './Keyboard.css';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ['Ã', 'Á', 'É', 'Ê', 'Í', 'Ó', 'Ô', 'Ú'],
];

interface KeyboardProps {
  onLetter: (letter: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  keyStatuses: KeyStatus;
}

export function Keyboard({ onLetter, onDelete, onSubmit, keyStatuses }: KeyboardProps) {
  function handleKey(key: string) {
    if (key === 'ENTER') onSubmit();
    else if (key === '⌫') onDelete();
    else onLetter(key);
  }

  return (
    <div className="keyboard" role="group" aria-label="Teclado virtual">
      {ROWS.map((row, ri) => (
        <div key={ri} className="keyboard__row">
          {row.map(key => {
            const status = keyStatuses[key] ?? keyStatuses[key.normalize('NFD').replace(/[̀-ͯ]/g, '')];
            return (
              <button
                key={key}
                className={`key${key === 'ENTER' || key === '⌫' ? ' key--wide' : ''}${status ? ` key--${status}` : ''}`}
                onClick={() => handleKey(key)}
                aria-label={key === '⌫' ? 'Apagar' : key === 'ENTER' ? 'Enviar' : key}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
