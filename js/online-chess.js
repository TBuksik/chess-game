// Online Chess - WebSocket multiplayer support

/**
 * Online Chess Manager - Handles WebSocket connections and multiplayer functionality
 */
class OnlineChessManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.roomId = null;
        this.playerId = null;
        this.playerColor = null;
        this.opponentInfo = null;
        this.game = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // Event handlers
        this.onConnectionStateChange = null;
        this.onRoomJoined = null;
        this.onOpponentJoined = null;
        this.onOpponentLeft = null;
        this.onMoveReceived = null;
        this.onGameStateSync = null;
        this.onError = null;
        
        // Generate unique player ID
        this.playerId = this.generatePlayerId();
        
        // Use a free WebSocket service or implement your own server
        this.wsUrl = this.getWebSocketUrl();
    }
    
    /**
     * Get WebSocket server URL
     * You can replace this with your own WebSocket server
     */
    getWebSocketUrl() {
        // Using a demo WebSocket server - replace with your own
        // For production, you'd want to use your own server
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = 'echo.websocket.org'; // Demo server - replace with your own
        return `${protocol}//${host}`;
    }
    
    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this.isConnected || this.isConnecting) {
            return Promise.resolve();
        }
        
        this.isConnecting = true;
        
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.wsUrl);
                
                this.socket.onopen = () => {
                    console.log('Connected to chess server');
                    this.isConnected = true;
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.notifyConnectionState('connected');
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(event.data);
                };
                
                this.socket.onclose = () => {
                    console.log('Disconnected from chess server');
                    this.isConnected = false;
                    this.isConnecting = false;
                    this.notifyConnectionState('disconnected');
                    this.handleReconnection();
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    this.notifyError('Connection failed. Please check your internet connection.');
                    reject(error);
                };
                
                // Connection timeout
                setTimeout(() => {
                    if (this.isConnecting) {
                        this.socket.close();
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);
                
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }
    
    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
        this.roomId = null;
        this.playerColor = null;
        this.opponentInfo = null;
    }
    
    /**
     * Handle automatic reconnection
     */
    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.connect().then(() => {
                    if (this.roomId) {
                        this.rejoinRoom(this.roomId);
                    }
                }).catch(console.error);
            }, delay);
        }
    }
    
    /**
     * Send message to server
     */
    send(message) {
        if (this.isConnected && this.socket) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message: not connected to server');
        }
    }
    
    /**
     * Handle incoming messages
     */
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'room_created':
                    this.handleRoomCreated(message);
                    break;
                case 'room_joined':
                    this.handleRoomJoined(message);
                    break;
                case 'opponent_joined':
                    this.handleOpponentJoined(message);
                    break;
                case 'opponent_left':
                    this.handleOpponentLeft(message);
                    break;
                case 'move':
                    this.handleMoveReceived(message);
                    break;
                case 'game_state':
                    this.handleGameStateSync(message);
                    break;
                case 'chat_message':
                    this.handleChatMessage(message);
                    break;
                case 'error':
                    this.handleServerError(message);
                    break;
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    }
    
    /**
     * Create a new game room
     */
    createRoom(playerName = 'Player 1') {
        const roomId = 'room_' + Math.random().toString(36).substr(2, 8);
        
        this.send({
            type: 'create_room',
            roomId: roomId,
            playerId: this.playerId,
            playerName: playerName,
            timestamp: Date.now()
        });
        
        return roomId;
    }
    
    /**
     * Join an existing room
     */
    joinRoom(roomId, playerName = 'Player 2') {
        this.send({
            type: 'join_room',
            roomId: roomId,
            playerId: this.playerId,
            playerName: playerName,
            timestamp: Date.now()
        });
    }
    
    /**
     * Rejoin room after reconnection
     */
    rejoinRoom(roomId) {
        this.send({
            type: 'rejoin_room',
            roomId: roomId,
            playerId: this.playerId,
            timestamp: Date.now()
        });
    }
    
    /**
     * Leave current room
     */
    leaveRoom() {
        if (this.roomId) {
            this.send({
                type: 'leave_room',
                roomId: this.roomId,
                playerId: this.playerId,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Send move to opponent
     */
    sendMove(move) {
        if (this.roomId) {
            this.send({
                type: 'move',
                roomId: this.roomId,
                playerId: this.playerId,
                move: move,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Send chat message
     */
    sendChatMessage(message) {
        if (this.roomId) {
            this.send({
                type: 'chat_message',
                roomId: this.roomId,
                playerId: this.playerId,
                message: message,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Sync game state with opponent
     */
    syncGameState(gameState) {
        if (this.roomId) {
            this.send({
                type: 'game_state',
                roomId: this.roomId,
                playerId: this.playerId,
                gameState: gameState,
                timestamp: Date.now()
            });
        }
    }
    
    // Message handlers
    
    handleRoomCreated(message) {
        this.roomId = message.roomId;
        this.playerColor = 'white'; // Room creator is white
        console.log('Room created:', this.roomId);
        
        if (this.onRoomJoined) {
            this.onRoomJoined({
                roomId: this.roomId,
                playerColor: this.playerColor,
                isCreator: true
            });
        }
    }
    
    handleRoomJoined(message) {
        this.roomId = message.roomId;
        this.playerColor = message.playerColor || 'black'; // Joiner is black
        console.log('Joined room:', this.roomId, 'as', this.playerColor);
        
        if (this.onRoomJoined) {
            this.onRoomJoined({
                roomId: this.roomId,
                playerColor: this.playerColor,
                isCreator: false
            });
        }
    }
    
    handleOpponentJoined(message) {
        this.opponentInfo = {
            id: message.playerId,
            name: message.playerName,
            color: message.playerColor
        };
        
        console.log('Opponent joined:', this.opponentInfo);
        
        if (this.onOpponentJoined) {
            this.onOpponentJoined(this.opponentInfo);
        }
    }
    
    handleOpponentLeft(message) {
        console.log('Opponent left the game');
        
        if (this.onOpponentLeft) {
            this.onOpponentLeft(message);
        }
        
        this.opponentInfo = null;
    }
    
    handleMoveReceived(message) {
        console.log('Move received:', message.move);
        
        if (this.onMoveReceived) {
            this.onMoveReceived(message.move);
        }
    }
    
    handleGameStateSync(message) {
        console.log('Game state sync received');
        
        if (this.onGameStateSync) {
            this.onGameStateSync(message.gameState);
        }
    }
    
    handleChatMessage(message) {
        console.log('Chat message:', message.message);
        
        // Display chat message in UI
        this.displayChatMessage(message.playerName || 'Opponent', message.message);
    }
    
    handleServerError(message) {
        console.error('Server error:', message.error);
        
        if (this.onError) {
            this.onError(message.error);
        }
    }
    
    // Helper methods
    
    notifyConnectionState(state) {
        if (this.onConnectionStateChange) {
            this.onConnectionStateChange(state);
        }
    }
    
    notifyError(error) {
        if (this.onError) {
            this.onError(error);
        }
    }
    
    displayChatMessage(playerName, message) {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.innerHTML = `
                <span class="chat-player">${playerName}:</span>
                <span class="chat-text">${message}</span>
            `;
            chatContainer.appendChild(messageElement);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            roomId: this.roomId,
            playerColor: this.playerColor,
            opponentInfo: this.opponentInfo
        };
    }
    
    /**
     * Set game instance reference
     */
    setGame(game) {
        this.game = game;
    }
}

// Export for use in other modules
window.OnlineChessManager = OnlineChessManager;
