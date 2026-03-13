import React from 'react';

const roleLabels = {
  black: 'Black',
  white: 'White',
};

export function GameInfo({
  roomCode,
  playerRole,
  currentTurn,
  winner,
  statusMessage,
  players,
  isConnected,
  restartRequestedBy,
  onRestartRequest,
  onRestartConfirm,
}) {
  const myLabel = playerRole ? roleLabels[playerRole] : 'Spectator';
  const theirRole = playerRole === 'black' ? 'white' : 'black';

  const restartRequested =
    restartRequestedBy && restartRequestedBy === theirRole;

  const myRequestedRestart =
    restartRequestedBy && restartRequestedBy === playerRole;

  let turnLabel = '';
  if (winner) {
    turnLabel = `${roleLabels[winner]} wins`;
  } else if (currentTurn && playerRole) {
    if (currentTurn === playerRole) {
      turnLabel = 'Your turn';
    } else {
      turnLabel = "Opponent's turn";
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto mb-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Room
          </p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-lg sm:text-xl text-slate-50">
              {roomCode || '—'}
            </p>
            {roomCode && (
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(roomCode)
                }
                className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600"
              >
                Copy
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              You are
            </p>
            <p className="text-sm font-semibold">
              {myLabel}
              {playerRole && (
                <span
                  className={`ml-2 inline-block w-3 h-3 rounded-full ${
                    playerRole === 'black'
                      ? 'bg-slate-100 border border-slate-300'
                      : 'bg-slate-900'
                  }`}
                />
              )}
            </p>
          </div>
          <div
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
              isConnected
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/50 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-current" />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Status
          </p>
          <p className="text-sm font-medium text-slate-50">
            {statusMessage || turnLabel || 'Waiting for opponent'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-900" />
              <span>
                {players?.black?.nickname || 'Black player'}
              </span>
            </span>
            <span className="text-slate-600">vs</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
              <span>
                {players?.white?.nickname || 'White player'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRestartRequest}
              disabled={!playerRole || !winner || myRequestedRestart}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:hover:bg-slate-800 border border-slate-600"
            >
              {myRequestedRestart ? 'Restart requested' : 'Restart'}
            </button>
            {restartRequested && (
              <button
                type="button"
                onClick={onRestartConfirm}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-sm"
              >
                Accept restart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

