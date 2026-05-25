import { isLockedForToday, isWonToday } from '../utils/storage';
import './MenuScreen.css';

interface MenuScreenProps {
  onSelect: (length: number) => void;
}

const LENGTHS = [4, 5, 6, 7, 8, 9, 10];

export function MenuScreen({ onSelect }: MenuScreenProps) {
  return (
    <div className="menu">
      <header className="header">
        <h1 className="header__title">PROJETO W</h1>
      </header>

      <div className="menu__content">
        <p className="menu__subtitle">Escolha o tamanho da palavra</p>

        <div className="menu__grid">
          {LENGTHS.map(len => {
            const locked = isLockedForToday(len);
            const won = isWonToday(len);
            const disabled = locked || won;

            let btnClass = 'menu__btn';
            if (locked) btnClass += ' menu__btn--locked';
            if (won) btnClass += ' menu__btn--won';

            return (
              <button
                key={len}
                className={btnClass}
                onClick={() => !disabled && onSelect(len)}
                disabled={disabled}
                aria-label={`${len} letras${locked ? ' — bloqueado hoje' : won ? ' — já jogado hoje' : ''}`}
              >
                <span className="menu__btn-num">{len}</span>
                <span className="menu__btn-label">letras</span>
                {locked && <span className="menu__btn-badge">🔒</span>}
                {won && <span className="menu__btn-badge">✓</span>}
              </button>
            );
          })}
        </div>

        <p className="menu__hint">
          🔒 volta amanhã &nbsp;·&nbsp; ✓ jogado hoje
        </p>
      </div>
    </div>
  );
}
