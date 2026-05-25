import type { Row as RowType } from '../types';
import { Row } from './Row';
import './Board.css';

interface BoardProps {
  board: RowType[];
  currentRow: number;
  currentCol: number;
  invalidShake: boolean;
  onTileClick: (col: number) => void;
}

export function Board({ board, currentRow, currentCol, invalidShake, onTileClick }: BoardProps) {
  return (
    <div className="board" aria-label="Tabuleiro do jogo">
      {board.map((row, i) => (
        <Row
          key={i}
          row={row}
          shake={invalidShake && i === currentRow}
          isActive={i === currentRow}
          currentCol={currentCol}
          onTileClick={onTileClick}
        />
      ))}
    </div>
  );
}
