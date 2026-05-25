import type { GameStatus, Statistics } from '../types';
import './Modal.css';

interface ModalProps {
  status: GameStatus;
  targetWord: string;
  statistics: Statistics;
  onClose: () => void;
}

export function Modal({ status, targetWord, statistics, onClose }: ModalProps) {
  const winRate = statistics.played > 0
    ? Math.round((statistics.won / statistics.played) * 100)
    : 0;

  const maxDist = Math.max(...Object.values(statistics.guessDistribution), 1);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Resultado">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>

        <h2 className="modal__title">
          {status === 'won' ? '🎉 Você acertou!' : '😞 Que pena!'}
        </h2>

        {status === 'lost' && (
          <p className="modal__word">
            A palavra era: <strong>{targetWord}</strong>
          </p>
        )}

        <div className="modal__stats">
          <div className="stat">
            <span className="stat__value">{statistics.played}</span>
            <span className="stat__label">Jogos</span>
          </div>
          <div className="stat">
            <span className="stat__value">{winRate}%</span>
            <span className="stat__label">Vitórias</span>
          </div>
          <div className="stat">
            <span className="stat__value">{statistics.currentStreak}</span>
            <span className="stat__label">Sequência</span>
          </div>
          <div className="stat">
            <span className="stat__value">{statistics.maxStreak}</span>
            <span className="stat__label">Máx. Sequência</span>
          </div>
        </div>

        <h3 className="modal__dist-title">Distribuição</h3>
        <div className="modal__distribution">
          {([1, 2, 3, 4, 5, 6] as const).map(n => {
            const count = statistics.guessDistribution[n] ?? 0;
            const pct = Math.round((count / maxDist) * 100);
            return (
              <div key={n} className="dist-row">
                <span className="dist-row__num">{n}</span>
                <div className="dist-row__bar-wrap">
                  <div className="dist-row__bar" style={{ width: `${Math.max(pct, 8)}%` }}>
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <NextWordTimer />
      </div>
    </div>
  );
}

function NextWordTimer() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = tomorrow.getTime() - now.getTime();
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

  return (
    <p className="modal__next">
      Próxima palavra em: <strong>{h}:{m}:{s}</strong>
    </p>
  );
}
