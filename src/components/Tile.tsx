import type { TileStatus } from '../types';
import './Tile.css';

interface TileProps {
  letter: string;
  status: TileStatus;
  position: number;
  submitted: boolean;
  isCursor?: boolean;
  onClick?: () => void;
}

export function Tile({ letter, status, position, submitted, isCursor, onClick }: TileProps) {
  const delay = submitted ? `${position * 0.15}s` : '0s';

  return (
    <div
      className={[
        'tile',
        `tile--${status}`,
        submitted ? 'tile--flip' : '',
        letter ? 'tile--pop' : '',
        isCursor ? 'tile--cursor' : '',
        onClick ? 'tile--clickable' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--flip-delay': delay } as React.CSSProperties}
      aria-label={letter ? `${letter} ${status}` : 'empty'}
      onClick={onClick}
    >
      {letter}
    </div>
  );
}
