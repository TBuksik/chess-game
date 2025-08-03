// Modern Online Chess Multiplayer System
// Using WebSocket for real-time communication

/**
 * Online Chess Manager - Handles real-time multiplayer functionality
 */
class OnlineChessManager extends EventTarget {
    constructor() {
        super();
        
        // Connection state
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.connectionId = null;
        
        // Game state
        this.roomId = null;
        this.playerId = this.generatePlayerId();
        this.playerColor = null;
        this.playerName = 'Player';
        this.opponentInfo = null;
        this.isHost = false;
        
        // Reconnection handling
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        
        // WebSocket server configuration
        this.wsConfig = this.getWebSocketConfig();
        
        console.log('OnlineChessManager initialized with player ID:', this.playerId);
    }
    
    /**
     * Get WebSocket configuration
     * Configured for production deployment at chess-game-one-amber.vercel.app
     */
    getWebSocketConfig() {
        // Production WebSocket configuration
        const isProduction = window.location.hostname === 'chess-game-one-amber.vercel.app';
        
        if (isProduction) {
            // For production, use reliable WebSocket services
            return {
                // Primary: Postman Echo WebSocket service (reliable for testing)
                url: 'wss://ws.postman-echo.com/raw',
                // Fallback: Echo WebSocket service
                fallbackUrl: 'wss://echo.websocket.org',
                // Alternative: Use Vercel API with polling (for future implementation)
                apiUrl: 'https://chess-game-one-amber.vercel.app/api/chess',
                protocols: [],
                reconnect: true,
                heartbeat: 30000
            };
        } else {
            // Local development
            return {
                url: 'ws://localhost:8080/ws',
                fallbackUrl: 'wss://echo.websocket.org',
                protocols: [],
                reconnect: true,
                heartbeat: 30000
            };
        }
    }
    
    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return 'chess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }
    
    /**
     * Generate random room ID
     */
    generateRoomId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this.isConnected || this.isConnecting) {
            console.log('Already connected or connecting');
            return Promise.resolve();
        }
        
        this.isConnecting = true;
        this.emit('connectionStateChange', { state: 'connecting' });
        
        return new Promise((resolve, reject) => {
            const attemptConnection = (url) => {
                try {
                    console.log('Connecting to:', url);
                    this.socket = new WebSocket(url, this.wsConfig.protocols);
                    
                    // Connection timeout
                    const connectionTimeout = setTimeout(() => {
                        if (this.isConnecting) {
                            this.socket?.close();
                            
                            // Try fallback URL if available
                            if (this.wsConfig.fallbackUrl && url !== this.wsConfig.fallbackUrl) {
                                console.log('🔄 Primary connection failed, trying fallback...');
                                attemptConnection(this.wsConfig.fallbackUrl);
                                return;
                            }
                            
                            this.isConnecting = false;
                            reject(new Error('Connection timeout'));
                        }
                    }, 15000); // Increased timeout for production
                    
                    this.socket.onopen = () => {
                        clearTimeout(connectionTimeout);
                        console.log('✅ Connected to chess server:', url);
                        this.isConnected = true;
                        this.isConnecting = false;
                        this.reconnectAttempts = 0;
                        
                        // Start heartbeat
                        this.startHeartbeat();
                        
                        // Send connection handshake
                        this.sendMessage({
                            type: 'connect',
                            playerId: this.playerId,
                            playerName: this.playerName,
                            timestamp: Date.now()
                        });
                        
                        this.emit('connectionStateChange', { state: 'connected' });
                        resolve();
                    };
                    
                    this.socket.onmessage = (event) => {
                        this.handleMessage(event.data);
                    };
                    
                    this.socket.onclose = (event) => {
                        clearTimeout(connectionTimeout);
                        console.log('🔌 Disconnected from chess server', event.code, event.reason);
                        this.isConnected = false;
                        this.isConnecting = false;
                        this.stopHeartbeat();
                        
                        this.emit('connectionStateChange', { state: 'disconnected', code: event.code });
                        
                        // Auto-reconnect if configured and not a deliberate close
                        if (this.wsConfig.reconnect && event.code !== 1000) {
                            this.handleReconnection();
                        }
                    };
                    
                    this.socket.onerror = (error) => {
                        clearTimeout(connectionTimeout);
                        console.error('❌ WebSocket error:', error);
                        
                        // Try fallback URL if primary connection fails
                        if (this.wsConfig.fallbackUrl && url !== this.wsConfig.fallbackUrl) {
                            console.log('🔄 Primary connection error, trying fallback...');
                            attemptConnection(this.wsConfig.fallbackUrl);
                            return;
                        }
                        
                        this.isConnecting = false;
                        this.emit('error', { 
                            message: 'Failed to connect to chess server. Please try again.',
                            error: error
                        });
                        reject(error);
                    };
                    
                } catch (error) {
                    this.isConnecting = false;
                    this.emit('error', { 
                        message: 'Failed to create WebSocket connection',
                        error: error
                    });
                    reject(error);
                }
            };
            
            // Start connection attempt with primary URL
            attemptConnection(this.wsConfig.url);
        });
    }
    
    /**
     * Disconnect from server
     */
    disconnect() {
        this.wsConfig.reconnect = false; // Disable auto-reconnect
        this.stopHeartbeat();
        
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.sendMessage({
                type: 'disconnect',
                playerId: this.playerId,
                roomId: this.roomId
            });
            this.socket.close(1000, 'User disconnected');
        }
        
        this.resetState();
    }
    
    /**
     * Reset manager state
     */
    resetState() {
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.roomId = null;
        this.playerColor = null;
        this.opponentInfo = null;
        this.isHost = false;
        this.reconnectAttempts = 0;
    }
    
    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
                this.sendMessage({
                    type: 'ping',
                    playerId: this.playerId,
                    timestamp: Date.now()
                });
            }
        }, this.wsConfig.heartbeat);
    }
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    /**
     * Handle automatic reconnection
     */
    async handleReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            this.emit('error', { 
                message: 'Unable to reconnect to server. Please refresh the page.' 
            });
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.emit('connectionStateChange', { 
            state: 'reconnecting', 
            attempt: this.reconnectAttempts,
            maxAttempts: this.maxReconnectAttempts
        });
        
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }
    
    /**
     * Send message to server
     */
    sendMessage(data) {
        if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('Cannot send message: not connected', data);
            return false;
        }
        
        try {
            const message = JSON.stringify(data);
            this.socket.send(message);
            return true;
        } catch (error) {
            console.error('Failed to send message:', error, data);
            return false;
        }
    }
    
    /**
     * Handle incoming messages
     */
    handleMessage(rawData) {
        try {
            const data = JSON.parse(rawData);
            console.log('📨 Received message:', data.type, data);
            
            switch (data.type) {
                case 'connected':
                    this.connectionId = data.connectionId;
                    this.emit('serverConnected', data);
                    break;
                    
                case 'roomCreated':
                    this.roomId = data.roomId;
                    this.isHost = true;
                    this.playerColor = 'white'; // Host is white
                    this.emit('roomCreated', data);
                    break;
                    
                case 'roomJoined':
                    this.roomId = data.roomId;
                    this.isHost = false;
                    this.playerColor = 'black'; // Joiner is black
                    this.emit('roomJoined', data);
                    break;
                    
                case 'opponentJoined':
                    this.opponentInfo = data.opponent;
                    this.emit('opponentJoined', data);
                    break;
                    
                case 'opponentLeft':
                    this.opponentInfo = null;
                    this.emit('opponentLeft', data);
                    break;
                    
                case 'moveReceived':
                    this.emit('moveReceived', data);
                    break;
                    
                case 'gameStateSync':
                    this.emit('gameStateSync', data);
                    break;
                    
                case 'chatMessage':
                    this.emit('chatMessage', data);
                    break;
                    
                case 'gameEnd':
                    this.emit('gameEnd', data);
                    break;
                    
                case 'error':
                    this.emit('error', data);
                    break;
                    
                case 'pong':
                    // Heartbeat response
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('Failed to parse message:', error, rawData);
        }
    }
    
    /**
     * Create a new game room
     */
    createRoom(playerName = 'Player') {
        this.playerName = playerName;
        const roomId = this.generateRoomId();
        
        return this.sendMessage({
            type: 'createRoom',
            roomId: roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });
    }
    
    /**
     * Join an existing game room
     */
    joinRoom(roomId, playerName = 'Player') {
        this.playerName = playerName;
        
        return this.sendMessage({
            type: 'joinRoom',
            roomId: roomId.toUpperCase(),
            playerId: this.playerId,
            playerName: this.playerName,
            timestamp: Date.now()
        });
    }
    
    /**
     * Leave current room
     */
    leaveRoom() {
        if (!this.roomId) return false;
        
        const success = this.sendMessage({
            type: 'leaveRoom',
            roomId: this.roomId,
            playerId: this.playerId,
            timestamp: Date.now()
        });
        
        if (success) {
            this.roomId = null;
            this.playerColor = null;
            this.opponentInfo = null;
            this.isHost = false;
        }
        
        return success;
    }
    
    /**
     * Send a chess move to opponent
     */
    sendMove(moveData) {
        if (!this.roomId) {
            console.warn('Cannot send move: not in a room');
            return false;
        }
        
        return this.sendMessage({
            type: 'move',
            roomId: this.roomId,
            playerId: this.playerId,
            move: moveData,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send chat message
     */
    sendChatMessage(message) {
        if (!this.roomId || !message.trim()) return false;
        
        return this.sendMessage({
            type: 'chat',
            roomId: this.roomId,
            playerId: this.playerId,
            playerName: this.playerName,
            message: message.trim(),
            timestamp: Date.now()
        });
    }
    
    /**
     * Sync game state with opponent
     */
    syncGameState(gameState) {
        if (!this.roomId) return false;
        
        return this.sendMessage({
            type: 'syncState',
            roomId: this.roomId,
            playerId: this.playerId,
            gameState: gameState,
            timestamp: Date.now()
        });
    }
    
    /**
     * Send game end notification
     */
    sendGameEnd(result) {
        if (!this.roomId) return false;
        
        return this.sendMessage({
            type: 'gameEnd',
            roomId: this.roomId,
            playerId: this.playerId,
            result: result,
            timestamp: Date.now()
        });
    }
    
    /**
     * Emit custom events
     */
    emit(eventName, data) {
        this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
    
    /**
     * Add event listener
     */
    on(eventName, callback) {
        this.addEventListener(eventName, callback);
    }
    
    /**
     * Remove event listener
     */
    off(eventName, callback) {
        this.removeEventListener(eventName, callback);
    }
    
    /**
     * Get current connection status
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            roomId: this.roomId,
            playerId: this.playerId,
            playerColor: this.playerColor,
            playerName: this.playerName,
            opponentInfo: this.opponentInfo,
            isHost: this.isHost,
            connectionId: this.connectionId
        };
    }
    
    /**
     * Check if currently in a room with an opponent
     */
    isInRoom() {
        return !!(this.roomId && this.opponentInfo);
    }
    
    /**
     * Check if ready to play
     */
    isReadyToPlay() {
        return this.isConnected && this.isInRoom() && this.playerColor;
    }
}

// Export for use in other modules
window.OnlineChessManager = OnlineChessManager;
