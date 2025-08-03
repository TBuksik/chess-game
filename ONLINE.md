# Chess Game - Online Multiplayer

## 🌐 Online Multiplayer Features

The chess game now includes comprehensive online multiplayer functionality, allowing players to play against each other over the internet in real-time.

### Features

- **Real-time Multiplayer**: Play against opponents over the internet using WebSocket connections
- **Room-based System**: Create or join private game rooms using 6-character codes
- **Live Chat**: Communicate with your opponent during the game
- **Connection Status**: Visual indicators showing connection and opponent status
- **Auto-reconnection**: Automatic reconnection if connection is lost
- **Move Synchronization**: Real-time move updates between players
- **Player Assignment**: Automatic color assignment (host=white, guest=black)

### How to Play Online

1. **Start the Server** (for local testing):
   ```bash
   npm install
   npm run server
   ```
   Server will start on `http://localhost:8080`

2. **Access the Game**:
   - Open your browser to the chess game
   - Select "Online Mode" from the main menu

3. **Create a Room**:
   - Click "Connect to Server"
   - Choose "Create Room"
   - Enter your name
   - Share the 6-character room code with your friend

4. **Join a Room**:
   - Click "Connect to Server"
   - Choose "Join Room" 
   - Enter your name and the room code
   - Wait for the game to start

5. **Play**:
   - The host (room creator) plays as White
   - The guest (room joiner) plays as Black
   - Moves are synchronized in real-time
   - Use the chat panel to communicate

### Technical Architecture

#### Client-Side Components

- **OnlineChessManager** (`js/online-manager.js`): Core WebSocket management, connection handling, and game state synchronization
- **OnlineGameUI** (`js/online-ui.js`): User interface for room creation, joining, chat, and connection status
- **Enhanced ChessGame** (`js/game.js`): Integrated online mode support with move validation and synchronization

#### Server-Side

- **WebSocket Server** (`server.js`): Node.js server handling rooms, players, moves, and chat
- **Room Management**: Automatic room creation, player assignment, and cleanup
- **Message Protocol**: Structured JSON messages for all game events

#### Message Types

**Client to Server**:
- `createRoom`: Create a new game room
- `joinRoom`: Join an existing room by code
- `move`: Send a chess move to opponent
- `chatMessage`: Send chat message
- `startGame`: Start the game (host only)
- `leaveRoom`: Leave current room
- `ping`: Keep connection alive

**Server to Client**:
- `connected`: Connection established
- `roomCreated`: Room created successfully
- `roomJoined`: Successfully joined room
- `playerJoined`: Another player joined
- `playerLeft`: Player left the room
- `moveReceived`: Opponent's move
- `chatMessage`: Chat message from opponent
- `gameStarted`: Game has begun
- `error`: Error message
- `pong`: Response to ping

### File Structure

```
js/
├── online-manager.js     # WebSocket connection and game state management
├── online-ui.js          # User interface for online features
├── game.js              # Enhanced with online integration
└── game-main.js         # Modified to handle online mode initialization

css/
└── online.css           # Styling for online components

server.js                # WebSocket server for local testing
package.json            # Dependencies including 'ws' package
```

### Development Notes

#### WebSocket Connection

The default WebSocket server URL is set to `ws://localhost:8080/ws` for local development. For production, update the server URL in `online-manager.js`.

#### Error Handling

The system includes comprehensive error handling for:
- Connection failures
- Room not found
- Invalid moves
- Player disconnections
- Server errors

#### Security Considerations

- Room codes are randomly generated 6-character alphanumeric strings
- Messages are validated on both client and server
- No sensitive data is transmitted
- Automatic cleanup of empty rooms

### Customization

#### Changing Server URL

Edit `online-manager.js`:
```javascript
constructor(serverUrl = 'ws://your-server.com/ws') {
    // ...
}
```

#### Modifying UI

The online UI is modular and can be customized by editing:
- `online-ui.js` for functionality
- `online.css` for styling

#### Adding Features

The message protocol is extensible. Add new message types in both client and server code to implement additional features like:
- Spectator mode
- Game replay
- Tournament support
- Rating system

### Troubleshooting

**Connection Issues**:
- Ensure the WebSocket server is running
- Check firewall settings
- Verify the server URL is correct

**Room Issues**:
- Room codes are case-sensitive
- Rooms are automatically deleted when empty
- Maximum 2 players per room

**Game Sync Issues**:
- Moves are validated on both sides
- Connection status is shown in real-time
- Auto-reconnection attempts if connection drops

### Browser Compatibility

The online features work in all modern browsers that support:
- WebSockets
- ES6+ JavaScript features
- CSS Grid and Flexbox

Tested browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
