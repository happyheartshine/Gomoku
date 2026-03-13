import React from 'react';
import { Cell } from './Cell.jsx';

export function Board({
  board,
  currentTurn,
  playerRole,
  winner,
  winningCells,
  onCellClick,
}) {
  const isMyTurn =
    playerRole && !winner && currentTurn === playerRole;

  const winningSet = new Set(
    (winningCells || []).map((c) => `${c.row}-${c.col}`)
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative mx-auto shadow-board rounded-xl bg-board-bg p-2 sm:p-3">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: 'repeat(21, minmax(0, 1fr))',
          }}
        >
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <Cell
                key={`${rIdx}-${cIdx}`}
                value={cell}
                isWinning={winningSet.has(`${rIdx}-${cIdx}`)}
                onClick={() => onCellClick(rIdx, cIdx)}
                isMyTurn={isMyTurn}
                myRole={playerRole}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

