# Gomoku Multiplayer (Five in a Row)

Real-time multiplayer Gomoku (five-in-a-row) built with **Node.js/Express/Socket.io** on the backend and **React/Vite/TailwindCSS** on the frontend.  
The server is authoritative: all moves are validated on the backend and the client only renders state from the server.

## Features

- 21×21 Gomoku board
- Two players per room
- Player 1 = Black (moves first), Player 2 = White
- Random 6-character room codes
- Create / join room flow
- Real-time turns via Socket.io
- Winning five stones are highlighted
- Board is disabled after a win
- Restart only when both players agree
- Nicknames (optional)
- Connection status indicator

## Project Structure

- `server/` – Node.js backend (Express + Socket.io)
  - `server.js` – HTTP/Socket.io server & room management
  - `gameLogic.js` – board + win-detection logic
- `client/` – React frontend (Vite + TailwindCSS)
  - `index.html`
  - `src/main.jsx`
  - `src/App.jsx`
  - `src/socket.js`
  - `src/components/Board.jsx`
  - `src/components/Cell.jsx`
  - `src/components/GameInfo.jsx`

## Backend – Run Locally

```bash
cd server
npm install
npm run dev   # or: npm start
```

The server listens on `http://localhost:4000` by default.

Environment variables:

- `PORT` – port for the HTTP/Socket.io server (default: `4000`)
- `CLIENT_ORIGIN` – allowed origin for CORS/Socket.io (default: `http://localhost:5173`)

## Frontend – Run Locally

```bash
cd client
npm install
npm run dev
```

By default Vite runs at `http://localhost:5173`.

Create a `.env` file in `client/` if you want to point the client at a non-default backend:

```bash
VITE_BACKEND_URL=http://localhost:4000
```

## Deployment Notes

- **Backend** – can be deployed to platforms like Railway/Render.  
  - Make sure `CLIENT_ORIGIN` is set to your deployed frontend URL.
- **Frontend** – can be deployed to platforms like Vercel.  
  - Set `VITE_BACKEND_URL` to your deployed backend URL.

## Socket Events

### Client → Server

- `create_room` – `{ nickname?: string }`
- `join_room` – `{ roomCode: string, nickname?: string }`
- `make_move` – `{ roomCode: string, row: number, col: number }`
- `restart_request` – `{ roomCode: string }`
- `restart_confirm` – `{ roomCode: string }`

### Server → Client

- `room_created` – initial state for the room creator
- `room_joined` – initial state for the joining player
- `game_update` – authoritative board + metadata after each change
- `game_over` – fired when someone wins or when the opponent disconnects
- `player_disconnected` – opponent left mid-game
- `restart_game` – sent when both players agree to restart
- `error_message` – validation / flow errors (room full, not found, etc.)

## Game Rules (Server-Side)

- 21×21 board (in-memory per room, no database)
- At most 2 players per room
- Server validates:
  - Room existence and capacity
  - It is the player's turn
  - Cell is within bounds and empty
  - Game has not already ended
- Win detection checks only lines through the last move:
  - Horizontal, vertical, `\` diagonal, `/` diagonal
  - Returns the winning player and the 5 winning cell coordinates

