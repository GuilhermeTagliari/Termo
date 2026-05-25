import type { Row as RowType } from '../types';
import { Tile } from './Tile';
import './Row.css';

interface RowProps {
  row: RowType;
  shake: boolean;
  isActive: boolean;
  currentCol: number;
  onTileClick: (col: number) => void;
}

export function Row({ row, shake, isActive, currentCol, onTileClick }: RowProps) {
  return (
    <div className={`row${shake ? ' row--shake' : ''}`} role="group">
      {row.tiles.map((tile, i) => (
        <Tile
          key={i}
          letter={tile.letter}
          status={tile.status}
          position={i}
          submitted={row.submitted}
          isCursor={isActive && i === currentCol}
          onClick={isActive ? () => onTileClick(i) : undefined}
        />
      ))}
    </div>
  );
}
