import React, { useEffect, useMemo, useState } from 'react';
import { socket } from './socket.js';
import { Board } from './components/Board.jsx';
import { GameInfo } from './components/GameInfo.jsx';

const EMPTY_BOARD = Array.from({ length: 21 }, () =>
  Array.from({ length: 21 }, () => null)
);

function App() {
  const [view, setView] = useState('home'); // 'home' | 'game'
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [roomCode, setRoomCode] = useState('');
  const [playerRole, setPlayerRole] = useState(null); // 'black' | 'white' | null
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [currentTurn, setCurrentTurn] = useState('black');
  const [winner, setWinner] = useState(null);
  const [winningCells, setWinningCells] = useState([]);
  const [players, setPlayers] = useState({ black: null, white: null });
  const [restartRequestedBy, setRestartRequestedBy] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [errorMessage, setErrorMessage] = useState('');

  const isMyTurn = useMemo(
    () =>
      !!playerRole &&
      !winner &&
      roomCode &&
      currentTurn === playerRole &&
      isConnected,
    [playerRole, winner, roomCode, currentTurn, isConnected]
  );

  useEffect(() => {
    function handleConnect() {
      setIsConnected(true);
      setStatusMessage('Connected');
    }

    function handleDisconnect() {
      setIsConnected(false);
      setStatusMessage('Disconnected from server');
    }

    function handleRoomCreated(payload) {
      setRoomCode(payload.roomCode);
      setPlayerRole(payload.role);
      const state = payload.state;
      setBoard(state.board);
      setCurrentTurn(state.currentTurn);
      setWinner(state.winner);
      setWinningCells(state.winningCells || []);
      setPlayers(state.players || { black: null, white: null });
      setRestartRequestedBy(state.restartRequestedBy || null);
      setStatusMessage('Room created. Waiting for opponent to join.');
      setView('game');
    }

    function handleRoomJoined(payload) {
      setRoomCode(payload.roomCode);
      setPlayerRole(payload.role);
      const state = payload.state;
      setBoard(state.board);
      setCurrentTurn(state.currentTurn);
      setWinner(state.winner);
      setWinningCells(state.winningCells || []);
      setPlayers(state.players || { black: null, white: null });
      setRestartRequestedBy(state.restartRequestedBy || null);
      setStatusMessage('Joined room. Game will start when both players are ready.');
      setView('game');
    }

    function handleGameUpdate(state) {
      setBoard(state.board);
      setCurrentTurn(state.currentTurn);
      setWinner(state.winner);
      setWinningCells(state.winningCells || []);
      setPlayers(state.players || { black: null, white: null });
      setRestartRequestedBy(state.restartRequestedBy || null);
    }

    function handleGameOver(payload) {
      if (payload.winner) {
        setStatusMessage(
          `${payload.winner === 'black' ? 'Black' : 'White'} wins!`
        );
      } else if (payload.reason === 'opponent_disconnected') {
        setStatusMessage('Opponent disconnected. Game over.');
      } else {
        setStatusMessage('Game over.');
      }
    }

    function handlePlayerDisconnected(payload) {
      setStatusMessage(payload.message || 'Opponent disconnected.');
    }

    function handleRestartGame(state) {
      setBoard(state.board);
      setCurrentTurn(state.currentTurn);
      setWinner(state.winner);
      setWinningCells(state.winningCells || []);
      setPlayers(state.players || { black: null, white: null });
      setRestartRequestedBy(state.restartRequestedBy || null);
      setStatusMessage('Game restarted. Black to move.');
    }

    function handleErrorMessage(payload) {
      setErrorMessage(payload.message || 'An error occurred.');
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('game_update', handleGameUpdate);
    socket.on('game_over', handleGameOver);
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('restart_game', handleRestartGame);
    socket.on('error_message', handleErrorMessage);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('game_update', handleGameUpdate);
      socket.off('game_over', handleGameOver);
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.off('restart_game', handleRestartGame);
      socket.off('error_message', handleErrorMessage);
    };
  }, []);

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setErrorMessage('');
    socket.emit('create_room', { nickname: nickname.trim() || null });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!joinCode.trim()) {
      setErrorMessage('Enter a room code to join.');
      return;
    }
    socket.emit('join_room', {
      roomCode: joinCode.trim(),
      nickname: nickname.trim() || null,
    });
  };

  const handleCellClick = (row, col) => {
    if (!roomCode || !playerRole || !isMyTurn || winner) return;
    if (board[row][col] !== null) return;

    socket.emit('make_move', {
      roomCode,
      row,
      col,
    });
  };

  const handleRestartRequest = () => {
    if (!roomCode || !playerRole) return;
    socket.emit('restart_request', { roomCode });
    setStatusMessage('Restart requested. Waiting for opponent to confirm.');
  };

  const handleRestartConfirm = () => {
    if (!roomCode || !playerRole) return;
    socket.emit('restart_confirm', { roomCode });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="flex-1 flex flex-col items-center px-4 py-6 sm:py-8">
        <header className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50">
            Gomoku Multiplayer
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time five-in-a-row on a 21×21 board.
          </p>
        </header>

        {view === 'home' && (
          <main className="w-full max-w-md space-y-6">
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nickname <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="inline-flex justify-center items-center rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm px-4 py-2.5 shadow-lg shadow-cyan-500/30 transition"
                >
                  Create Room
                </button>

                <form
                  onSubmit={handleJoinRoom}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(e.target.value.toUpperCase())
                    }
                    placeholder="Room code"
                    className="flex-1 rounded-md bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500/70 focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="inline-flex justify-center items-center rounded-md bg-slate-800 hover:bg-slate-700 text-sm px-3 py-2 border border-slate-600"
                  >
                    Join
                  </button>
                </form>
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-400 mt-1">{errorMessage}</p>
              )}

              <p className="text-[11px] text-slate-500 pt-1">
                Share the room code with a friend to play. The creator
                plays as black and moves first.
              </p>
            </section>
          </main>
        )}

        {view === 'game' && (
          <main className="w-full max-w-5xl">
            <GameInfo
              roomCode={roomCode}
              playerRole={playerRole}
              currentTurn={currentTurn}
              winner={winner}
              statusMessage={statusMessage}
              players={players}
              isConnected={isConnected}
              restartRequestedBy={restartRequestedBy}
              onRestartRequest={handleRestartRequest}
              onRestartConfirm={handleRestartConfirm}
            />
            <Board
              board={board}
              currentTurn={currentTurn}
              playerRole={playerRole}
              winner={winner}
              winningCells={winningCells}
              onCellClick={handleCellClick}
            />
          </main>
        )}
      </div>

      <footer className="py-3 text-center text-[11px] text-slate-500">
        Server authoritative • Moves validated on backend • Built with
        React, Vite, Tailwind &amp; Socket.io
      </footer>
    </div>
  );
}

export default App;

