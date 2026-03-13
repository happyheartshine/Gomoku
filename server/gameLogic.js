// Game logic utilities for Gomoku (Five in a Row)
// Board is a 2D array: 21x21, values: null | 'black' | 'white'

const BOARD_SIZE = 21;

function createEmptyBoard(size = BOARD_SIZE) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

/**
 * Check for a win starting from the last move.
 * Only checks lines that pass through (row, col).
 *
 * @param {Array<Array<string|null>>} board
 * @param {number} row
 * @param {number} col
 * @param {'black'|'white'} player
 * @returns {{ winner: 'black' | 'white' | null, winningCells: Array<{row:number,col:number}> }}
 */
function checkWin(board, row, col, player) {
  if (!player) {
    return { winner: null, winningCells: [] };
  }

  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal \
    [1, -1], // diagonal /
  ];

  const inBounds = (r, c) =>
    r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;

  for (const [dr, dc] of directions) {
    const chain = [];

    // walk backwards
    let r = row;
    let c = col;
    while (inBounds(r, c) && board[r][c] === player) {
      chain.unshift({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    // walk forwards (from next cell)
    r = row + dr;
    c = col + dc;
    while (inBounds(r, c) && board[r][c] === player) {
      chain.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    if (chain.length >= 5) {
      // Ensure we return exactly 5 consecutive cells including the last move
      const idx = chain.findIndex(
        (cell) => cell.row === row && cell.col === col
      );

      let start = Math.max(0, idx - 4);
      let end = start + 5;
      if (end > chain.length) {
        end = chain.length;
        start = end - 5;
      }

      const winningCells = chain.slice(start, end);
      return { winner: player, winningCells };
    }
  }

  return { winner: null, winningCells: [] };
}

module.exports = {
  BOARD_SIZE,
  createEmptyBoard,
  checkWin,
};

