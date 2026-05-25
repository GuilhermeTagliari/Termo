import type { Row as RowType } from '../types';
import { Row } from './Row';
import './Board.css';

interface BoardProps {
  board: RowType[];
  currentRow: number;
  currentCol: number;
  invalidShake: boolean;
  wordLength: number;
  onTileClick: (col: number) => void;
}

export function Board({ board, currentRow, currentCol, invalidShake, wordLength, onTileClick }: BoardProps) {
  return (
    <div
      className="board"
      aria-label="Tabuleiro do jogo"
      style={{ '--word-length': wordLength } as React.CSSProperties}
    >
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
