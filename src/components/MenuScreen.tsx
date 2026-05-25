import { isLockedForToday } from '../utils/storage';
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
            return (
              <button
                key={len}
                className={`menu__btn${locked ? ' menu__btn--locked' : ''}`}
                onClick={() => !locked && onSelect(len)}
                disabled={locked}
                aria-label={`${len} letras${locked ? ' — bloqueado hoje' : ''}`}
              >
                <span className="menu__btn-num">{len}</span>
                <span className="menu__btn-label">letras</span>
                {locked && <span className="menu__btn-lock">🔒</span>}
              </button>
            );
          })}
        </div>

        <p className="menu__hint">
          Palavras bloqueadas voltam amanhã
        </p>
      </div>
    </div>
  );
}
