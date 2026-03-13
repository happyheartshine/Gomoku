const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { randomBytes } = require('crypto');
const { BOARD_SIZE, createEmptyBoard, checkWin } = require('./gameLogic');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/', (req, res) => {
  res.send('Gomoku multiplayer server is running.');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

/**
 * Room structure:
 * {
 *   code: string,
 *   board: string[][],
 *   currentTurn: 'black' | 'white',
 *   players: {
 *     black: { socketId: string, nickname: string | null } | null,
 *     white: { socketId: string, nickname: string | null } | null,
 *   },
 *   winner: 'black' | 'white' | null,
 *   winningCells: Array<{row:number,col:number}>,
 *   restartRequestedBy: 'black' | 'white' | null,
 *   endedDueToDisconnect: boolean
 * }
 */
const rooms = new Map();

// socketId -> { roomCode, role: 'black' | 'white' }
const socketToRoom = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    const idx = randomBytes(1)[0] % chars.length;
    code += chars[idx];
  }
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function getPublicGameState(room) {
  return {
    roomCode: room.code,
    board: room.board,
    currentTurn: room.currentTurn,
    winner: room.winner,
    winningCells: room.winningCells,
    players: {
      black: room.players.black
        ? { nickname: room.players.black.nickname || 'Black' }
        : null,
      white: room.players.white
        ? { nickname: room.players.white.nickname || 'White' }
        : null,
    },
    restartRequestedBy: room.restartRequestedBy,
    endedDueToDisconnect: room.endedDueToDisconnect,
  };
}

function emitGameUpdate(room) {
  const state = getPublicGameState(room);
  io.to(room.code).emit('game_update', state);
}

function handlePlayerDisconnect(socket) {
  const mapping = socketToRoom.get(socket.id);
  if (!mapping) return;

  const { roomCode, role } = mapping;
  const room = rooms.get(roomCode);
  if (!room) {
    socketToRoom.delete(socket.id);
    return;
  }

  room.players[role] = null;
  socket.leave(roomCode);
  socketToRoom.delete(socket.id);

  const otherRole = role === 'black' ? 'white' : 'black';
  const otherPlayer = room.players[otherRole];

  if (otherPlayer) {
    room.endedDueToDisconnect = true;
    room.winner = otherRole;
    room.winningCells = [];
    io.to(otherPlayer.socketId).emit('player_disconnected', {
      message: 'Your opponent disconnected. You win by default.',
      winner: otherRole,
    });
    io.to(otherPlayer.socketId).emit('game_over', {
      winner: otherRole,
      winningCells: [],
      reason: 'opponent_disconnected',
    });
    emitGameUpdate(room);
  } else {
    // No players left, clean up room
    rooms.delete(roomCode);
  }
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ nickname } = {}) => {
    const roomCode = generateRoomCode();
    const board = createEmptyBoard(BOARD_SIZE);

    const room = {
      code: roomCode,
      board,
      currentTurn: 'black',
      players: {
        black: { socketId: socket.id, nickname: nickname || null },
        white: null,
      },
      winner: null,
      winningCells: [],
      restartRequestedBy: null,
      endedDueToDisconnect: false,
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socketToRoom.set(socket.id, { roomCode, role: 'black' });

    const state = getPublicGameState(room);
    socket.emit('room_created', {
      roomCode,
      role: 'black',
      state,
    });
    emitGameUpdate(room);
  });

  socket.on('join_room', ({ roomCode, nickname } = {}) => {
    const normalizedCode = (roomCode || '').toUpperCase();
    const room = rooms.get(normalizedCode);
    if (!room) {
      socket.emit('error_message', { message: 'Room not found.' });
      return;
    }

    if (room.endedDueToDisconnect || room.winner) {
      socket.emit('error_message', {
        message: 'Game in this room has already ended.',
      });
      return;
    }

    if (
      room.players.black &&
      room.players.white &&
      room.players.black.socketId !== socket.id &&
      room.players.white.socketId !== socket.id
    ) {
      socket.emit('error_message', { message: 'Room is full.' });
      return;
    }

    let role;
    if (!room.players.black) {
      role = 'black';
    } else if (!room.players.white) {
      role = 'white';
    } else {
      // Player rejoining same room
      const existing =
        room.players.black.socketId === socket.id
          ? 'black'
          : room.players.white.socketId === socket.id
          ? 'white'
          : null;
      if (!existing) {
        socket.emit('error_message', { message: 'Room is full.' });
        return;
      }
      role = existing;
    }

    room.players[role] = {
      socketId: socket.id,
      nickname: nickname || room.players[role]?.nickname || null,
    };

    socket.join(normalizedCode);
    socketToRoom.set(socket.id, { roomCode: normalizedCode, role });

    const state = getPublicGameState(room);
    socket.emit('room_joined', {
      roomCode: normalizedCode,
      role,
      state,
    });
    emitGameUpdate(room);
  });

  socket.on('make_move', ({ roomCode, row, col } = {}) => {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return;

    const normalizedCode = (roomCode || '').toUpperCase();
    if (normalizedCode !== mapping.roomCode) return;

    const room = rooms.get(normalizedCode);
    if (!room) return;

    const { role } = mapping;

    if (room.winner || room.endedDueToDisconnect) {
      return;
    }

    if (room.currentTurn !== role) {
      return;
    }

    if (
      typeof row !== 'number' ||
      typeof col !== 'number' ||
      row < 0 ||
      row >= BOARD_SIZE ||
      col < 0 ||
      col >= BOARD_SIZE
    ) {
      return;
    }

    if (room.board[row][col] !== null) {
      return;
    }

    room.board[row][col] = role;

    const { winner, winningCells } = checkWin(room.board, row, col, role);
    if (winner) {
      room.winner = winner;
      room.winningCells = winningCells;
      emitGameUpdate(room);
      io.to(room.code).emit('game_over', {
        winner,
        winningCells,
        reason: 'five_in_a_row',
      });
      return;
    }

    room.currentTurn = role === 'black' ? 'white' : 'black';
    emitGameUpdate(room);
  });

  socket.on('restart_request', ({ roomCode } = {}) => {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return;

    const normalizedCode = (roomCode || '').toUpperCase();
    if (normalizedCode !== mapping.roomCode) return;

    const room = rooms.get(normalizedCode);
    if (!room) return;

    const { role } = mapping;
    room.restartRequestedBy = role;
    emitGameUpdate(room);
  });

  socket.on('restart_confirm', ({ roomCode } = {}) => {
    const mapping = socketToRoom.get(socket.id);
    if (!mapping) return;

    const normalizedCode = (roomCode || '').toUpperCase();
    if (normalizedCode !== mapping.roomCode) return;

    const room = rooms.get(normalizedCode);
    if (!room) return;

    const { role } = mapping;
    const otherRole = role === 'black' ? 'white' : 'black';

    if (room.restartRequestedBy !== otherRole) {
      return;
    }

    // Reset game
    room.board = createEmptyBoard(BOARD_SIZE);
    room.currentTurn = 'black';
    room.winner = null;
    room.winningCells = [];
    room.restartRequestedBy = null;
    room.endedDueToDisconnect = false;

    const state = getPublicGameState(room);
    io.to(room.code).emit('restart_game', state);
    emitGameUpdate(room);
  });

  socket.on('disconnect', () => {
    handlePlayerDisconnect(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Gomoku server listening on port ${PORT}`);
});

