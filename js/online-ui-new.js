// Online Multiplayer UI System
// User interface for online chess multiplayer

/**
 * Online Game UI Manager - Handles all online multiplayer UI components
 */
class OnlineGameUI {
    constructor() {
        this.onlineManager = null;
        this.currentModal = null;
        this.connectionStatus = 'disconnected';
        this.chatMessages = [];
        this.maxChatMessages = 50;
        this.isOnlineMode = false;
        
        this.initializeUI();
        this.attachEventListeners();
    }
    
    /**
     * Initialize all UI components
     */
    initializeUI() {
        this.createOnlineModal();
        this.createConnectionIndicator();
        this.createGameLobby();
        this.createChatPanel();
        this.createNotificationSystem();
    }
    
    /**
     * Create the main online multiplayer modal
     */
    createOnlineModal() {
        const modal = document.createElement('div');
        modal.id = 'online-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'none';
        
        modal.innerHTML = `
            <div class="modal-content online-modal">
                <div class="modal-header">
                    <h2>🌐 Online Multiplayer</h2>
                    <button class="modal-close" id="close-online-modal">×</button>
                </div>
                
                <div class="online-content">
                    <!-- Connection Status -->
                    <div class="connection-section">
                        <div class="connection-status" id="online-connection-status">
                            <span class="status-dot" id="online-status-dot">●</span>
                            <span class="status-text" id="online-status-text">Disconnected</span>
                        </div>
                        <button id="connect-btn" class="btn btn-primary">Connect to Server</button>
                    </div>
                    
                    <!-- Game Modes -->
                    <div class="game-modes" id="online-game-modes" style="display: none;">
                        <h3>Choose Game Mode</h3>
                        
                        <div class="mode-option" id="create-room-option">
                            <div class="mode-header">
                                <h4>🏠 Create Room</h4>
                                <p>Create a new game room and share the code with a friend</p>
                            </div>
                            <div class="mode-form">
                                <input type="text" id="host-name" placeholder="Your name" maxlength="20" value="Player 1">
                                <button id="create-room-btn" class="btn btn-success">Create Room</button>
                            </div>
                        </div>
                        
                        <div class="mode-option" id="join-room-option">
                            <div class="mode-header">
                                <h4>🚪 Join Room</h4>
                                <p>Enter a room code to join an existing game</p>
                            </div>
                            <div class="mode-form">
                                <input type="text" id="guest-name" placeholder="Your name" maxlength="20" value="Player 2">
                                <input type="text" id="room-code" placeholder="Room Code (e.g. ABC123)" maxlength="6" style="text-transform: uppercase;">
                                <button id="join-room-btn" class="btn btn-primary">Join Room</button>
                            </div>
                        </div>
                        
                        <div class="mode-option" id="quick-match-option">
                            <div class="mode-header">
                                <h4>⚡ Quick Match</h4>
                                <p>Find a random opponent (Coming Soon)</p>
                            </div>
                            <button id="quick-match-btn" class="btn btn-secondary" disabled>Coming Soon</button>
                        </div>
                    </div>
                    
                    <!-- Room Info -->
                    <div class="room-info" id="room-info" style="display: none;">
                        <div class="room-header">
                            <h3>Room: <span id="room-code-display"></span></h3>
                            <button id="copy-room-code" class="btn btn-outline">📋 Copy Code</button>
                        </div>
                        
                        <div class="players-list">
                            <div class="player-slot">
                                <span class="color-indicator white">●</span>
                                <span class="player-name" id="white-player-name">Waiting...</span>
                                <span class="player-status" id="white-player-status">●</span>
                            </div>
                            <div class="player-slot">
                                <span class="color-indicator black">●</span>
                                <span class="player-name" id="black-player-name">Waiting...</span>
                                <span class="player-status" id="black-player-status">●</span>
                            </div>
                        </div>
                        
                        <div class="room-actions">
                            <button id="start-online-game" class="btn btn-success" disabled>Waiting for Opponent...</button>
                            <button id="leave-room-btn" class="btn btn-danger">Leave Room</button>
                        </div>
                    </div>
                </div>
                
                <!-- Loading Overlay -->
                <div class="loading-overlay" id="online-loading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Connecting to server...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.currentModal = modal;
    }
    
    /**
     * Create connection status indicator for the game page
     */
    createConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'online-indicator';
        indicator.className = 'online-status-indicator';
        indicator.style.display = 'none';
        
        indicator.innerHTML = `
            <div class="indicator-content">
                <span class="status-dot" id="game-status-dot">●</span>
                <span class="status-text" id="game-status-text">Offline</span>
                <div class="opponent-info" id="opponent-info" style="display: none;">
                    <span class="opponent-name" id="opponent-name"></span>
                    <span class="room-code-small" id="room-code-small"></span>
                </div>
            </div>
        `;
        
        // Add to the game container
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.appendChild(indicator);
        } else {
            document.body.appendChild(indicator);
        }
    }
    
    /**
     * Create game lobby overlay
     */
    createGameLobby() {
        const lobby = document.createElement('div');
        lobby.id = 'game-lobby';
        lobby.className = 'game-lobby-overlay';
        lobby.style.display = 'none';
        
        lobby.innerHTML = `
            <div class="lobby-content">
                <div class="lobby-header">
                    <h2>🎯 Game Lobby</h2>
                    <p>Room: <span id="lobby-room-code"></span></p>
                </div>
                
                <div class="lobby-players">
                    <div class="lobby-player" id="lobby-player-1">
                        <div class="player-avatar white">♔</div>
                        <div class="player-details">
                            <span class="player-name"></span>
                            <span class="player-color">White</span>
                        </div>
                        <div class="player-ready" id="player-1-ready">Ready</div>
                    </div>
                    
                    <div class="vs-divider">VS</div>
                    
                    <div class="lobby-player" id="lobby-player-2">
                        <div class="player-avatar black">♚</div>
                        <div class="player-details">
                            <span class="player-name">Waiting for opponent...</span>
                            <span class="player-color">Black</span>
                        </div>
                        <div class="player-ready" id="player-2-ready">Waiting</div>
                    </div>
                </div>
                
                <div class="lobby-actions">
                    <button id="lobby-start-game" class="btn btn-success btn-large" disabled>
                        Start Game
                    </button>
                    <button id="lobby-leave" class="btn btn-outline">
                        Leave Room
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(lobby);
    }
    
    /**
     * Create chat panel for in-game communication
     */
    createChatPanel() {
        const chat = document.createElement('div');
        chat.id = 'chat-panel';
        chat.className = 'chat-panel';
        chat.style.display = 'none';
        
        chat.innerHTML = `
            <div class="chat-header">
                <h4>💬 Chat</h4>
                <button id="toggle-chat" class="btn btn-small">−</button>
            </div>
            <div class="chat-content">
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chat-input" placeholder="Type a message..." maxlength="200">
                    <button id="send-chat" class="btn btn-primary">Send</button>
                </div>
            </div>
        `;
        
        // Position the chat panel
        const sidebar = document.querySelector('.right-sidebar');
        if (sidebar) {
            sidebar.appendChild(chat);
        } else {
            document.body.appendChild(chat);
        }
    }
    
    /**
     * Create notification system for online events
     */
    createNotificationSystem() {
        const container = document.createElement('div');
        container.id = 'online-notifications';
        container.className = 'online-notifications';
        document.body.appendChild(container);
    }
    
    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Close modal
        document.getElementById('close-online-modal')?.addEventListener('click', () => {
            this.hideOnlineModal();
        });
        
        // Connect button
        document.getElementById('connect-btn')?.addEventListener('click', () => {
            this.connectToServer();
        });
        
        // Create room
        document.getElementById('create-room-btn')?.addEventListener('click', () => {
            this.handleCreateRoom();
        });
        
        // Join room
        document.getElementById('join-room-btn')?.addEventListener('click', () => {
            this.handleJoinRoom();
        });
        
        // Leave room
        document.getElementById('leave-room-btn')?.addEventListener('click', () => {
            this.handleLeaveRoom();
        });
        
        // Copy room code
        document.getElementById('copy-room-code')?.addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        // Start game
        document.getElementById('start-online-game')?.addEventListener('click', () => {
            this.startOnlineGame();
        });
        
        // Chat functionality
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        document.getElementById('send-chat')?.addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        // Chat toggle
        document.getElementById('toggle-chat')?.addEventListener('click', () => {
            this.toggleChat();
        });
        
        // Room code input enter key
        document.getElementById('room-code')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleJoinRoom();
            }
        });
        
        // Auto-uppercase room code input
        document.getElementById('room-code')?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    /**
     * Initialize and connect to online manager
     */
    async initializeOnlineManager() {
        if (!this.onlineManager && window.OnlineChessManager) {
            this.onlineManager = new OnlineChessManager();
            this.setupOnlineManagerEvents();
        }
        return this.onlineManager;
    }
    
    /**
     * Setup event listeners for online manager
     */
    setupOnlineManagerEvents() {
        if (!this.onlineManager) return;
        
        // Connection events
        this.onlineManager.addEventListener('connected', () => {
            this.updateConnectionStatus('connected');
            this.showGameModes();
        });
        
        this.onlineManager.addEventListener('disconnected', () => {
            this.updateConnectionStatus('disconnected');
            this.hideGameModes();
        });
        
        this.onlineManager.addEventListener('connecting', () => {
            this.updateConnectionStatus('connecting');
        });
        
        // Room events
        this.onlineManager.addEventListener('roomCreated', (event) => {
            this.handleRoomCreated(event.detail);
        });
        
        this.onlineManager.addEventListener('roomJoined', (event) => {
            this.handleRoomJoined(event.detail);
        });
        
        this.onlineManager.addEventListener('playerJoined', (event) => {
            this.handlePlayerJoined(event.detail);
        });
        
        this.onlineManager.addEventListener('playerLeft', (event) => {
            this.handlePlayerLeft(event.detail);
        });
        
        // Game events
        this.onlineManager.addEventListener('moveReceived', (event) => {
            this.handleMoveReceived(event.detail);
        });
        
        this.onlineManager.addEventListener('gameStarted', (event) => {
            this.handleGameStarted(event.detail);
        });
        
        // Chat events
        this.onlineManager.addEventListener('chatMessage', (event) => {
            this.handleChatMessage(event.detail);
        });
        
        // Error events
        this.onlineManager.addEventListener('error', (event) => {
            this.handleError(event.detail);
        });
    }
    
    /**
     * Show the online modal
     */
    showOnlineModal() {
        const modal = document.getElementById('online-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.initializeOnlineManager();
        }
    }
    
    /**
     * Hide the online modal
     */
    hideOnlineModal() {
        const modal = document.getElementById('online-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    /**
     * Connect to the WebSocket server
     */
    async connectToServer() {
        try {
            this.showLoading('Connecting to server...');
            await this.initializeOnlineManager();
            await this.onlineManager.connect();
            this.hideLoading();
            this.showNotification('Connected to chess server!', 'success');
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to connect to server. Please try again.', 'error');
            console.error('Connection error:', error);
        }
    }
    
    /**
     * Handle create room action
     */
    async handleCreateRoom() {
        const hostName = document.getElementById('host-name')?.value.trim() || 'Player 1';
        
        try {
            if (!this.onlineManager?.isConnected) {
                await this.connectToServer();
            }
            
            this.showLoading('Creating room...');
            await this.onlineManager.createRoom(hostName);
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to create room. Please try again.', 'error');
            console.error('Create room error:', error);
        }
    }
    
    /**
     * Handle join room action
     */
    async handleJoinRoom() {
        const roomCode = document.getElementById('room-code')?.value.trim();
        const guestName = document.getElementById('guest-name')?.value.trim() || 'Player 2';
        
        if (!roomCode) {
            this.showNotification('Please enter a room code', 'warning');
            return;
        }
        
        try {
            if (!this.onlineManager?.isConnected) {
                await this.connectToServer();
            }
            
            this.showLoading('Joining room...');
            await this.onlineManager.joinRoom(roomCode, guestName);
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to join room. Please check the room code.', 'error');
            console.error('Join room error:', error);
        }
    }
    
    /**
     * Handle leave room action
     */
    handleLeaveRoom() {
        if (confirm('Are you sure you want to leave the game?')) {
            this.onlineManager?.leaveRoom();
            this.resetUI();
            this.hideOnlineModal();
            
            // Return to menu
            if (window.chessGame) {
                window.chessGame.backToMenu?.();
            }
        }
    }
    
    /**
     * Handle room created event
     */
    handleRoomCreated(data) {
        this.hideLoading();
        this.showRoomInfo(data.roomCode, data.playerColor);
        this.showNotification(`Room ${data.roomCode} created! Share this code with your friend.`, 'success');
    }
    
    /**
     * Handle room joined event
     */
    handleRoomJoined(data) {
        this.hideLoading();
        this.showRoomInfo(data.roomCode, data.playerColor);
        this.showNotification(`Joined room ${data.roomCode} as ${data.playerColor}`, 'success');
    }
    
    /**
     * Handle player joined event
     */
    handlePlayerJoined(data) {
        this.updatePlayersList(data.players);
        this.showNotification(`${data.playerName} joined the room!`, 'success');
        
        // Enable start button if both players are present
        if (data.players.length === 2) {
            document.getElementById('start-online-game').disabled = false;
            document.getElementById('start-online-game').textContent = 'Start Game';
        }
    }
    
    /**
     * Handle player left event
     */
    handlePlayerLeft(data) {
        this.updatePlayersList(data.players);
        this.showNotification(`${data.playerName} left the room`, 'warning');
        
        // Disable start button
        document.getElementById('start-online-game').disabled = true;
        document.getElementById('start-online-game').textContent = 'Waiting for Opponent...';
    }
    
    /**
     * Handle move received from opponent
     */
    handleMoveReceived(moveData) {
        if (window.chessGame && this.isOnlineMode) {
            // Apply the move to the local game
            window.chessGame.handleOnlineMove(moveData);
        }
    }
    
    /**
     * Handle game started event
     */
    handleGameStarted(data) {
        this.hideOnlineModal();
        this.isOnlineMode = true;
        this.startOnlineGame();
        this.showNotification('Game started! Good luck!', 'success');
    }
    
    /**
     * Handle chat message received
     */
    handleChatMessage(data) {
        this.displayChatMessage(data.playerName, data.message, false);
    }
    
    /**
     * Handle error events
     */
    handleError(error) {
        this.hideLoading();
        this.showNotification(error.message || 'An error occurred', 'error');
        console.error('Online error:', error);
    }
    
    /**
     * Show room information section
     */
    showRoomInfo(roomCode, playerColor) {
        document.getElementById('online-game-modes').style.display = 'none';
        document.getElementById('room-info').style.display = 'block';
        document.getElementById('room-code-display').textContent = roomCode;
        
        // Update player colors
        const whiteSlot = document.getElementById('white-player-name');
        const blackSlot = document.getElementById('black-player-name');
        
        if (playerColor === 'white') {
            whiteSlot.textContent = 'You';
        } else {
            blackSlot.textContent = 'You';
        }
    }
    
    /**
     * Update players list in room info
     */
    updatePlayersList(players) {
        const whiteSlot = document.getElementById('white-player-name');
        const blackSlot = document.getElementById('black-player-name');
        
        whiteSlot.textContent = 'Waiting...';
        blackSlot.textContent = 'Waiting...';
        
        players.forEach(player => {
            if (player.color === 'white') {
                whiteSlot.textContent = player.name;
            } else {
                blackSlot.textContent = player.name;
            }
        });
    }
    
    /**
     * Show game modes section
     */
    showGameModes() {
        document.getElementById('online-game-modes').style.display = 'block';
    }
    
    /**
     * Hide game modes section
     */
    hideGameModes() {
        document.getElementById('online-game-modes').style.display = 'none';
        document.getElementById('room-info').style.display = 'none';
    }
    
    /**
     * Start the online game
     */
    startOnlineGame() {
        // Initialize or restart the chess game in online mode
        if (window.initializeChessGame) {
            window.initializeChessGame('online');
        }
        
        // Set up online game properties
        if (window.chessGame) {
            window.chessGame.isOnlineMode = true;
            window.chessGame.onlineManager = this.onlineManager;
            window.chessGame.playerColor = this.onlineManager?.playerColor;
        }
        
        // Show game interface elements
        document.getElementById('online-indicator').style.display = 'block';
        document.getElementById('chat-panel').style.display = 'block';
        
        this.updateGameStatusIndicator();
    }
    
    /**
     * Send a move to the opponent
     */
    sendMove(moveData) {
        if (this.onlineManager && this.isOnlineMode) {
            this.onlineManager.sendMove(moveData);
        }
    }
    
    /**
     * Send a chat message
     */
    sendChatMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput?.value.trim();
        
        if (message && this.onlineManager) {
            this.onlineManager.sendChatMessage(message);
            this.displayChatMessage('You', message, true);
            chatInput.value = '';
        }
    }
    
    /**
     * Display a chat message
     */
    displayChatMessage(playerName, message, isOwn = false) {
        const chatContainer = document.getElementById('chat-messages');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwn ? 'own-message' : 'opponent-message'}`;
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="player-name">${this.escapeHtml(playerName)}</span>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;
        
        chatContainer.appendChild(messageElement);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Limit chat history
        this.chatMessages.push({ playerName, message, timestamp: Date.now() });
        if (this.chatMessages.length > this.maxChatMessages) {
            this.chatMessages.shift();
            chatContainer.removeChild(chatContainer.firstChild);
        }
    }
    
    /**
     * Toggle chat panel visibility
     */
    toggleChat() {
        const chatPanel = document.getElementById('chat-panel');
        const toggleBtn = document.getElementById('toggle-chat');
        
        if (chatPanel.classList.contains('minimized')) {
            chatPanel.classList.remove('minimized');
            toggleBtn.textContent = '−';
        } else {
            chatPanel.classList.add('minimized');
            toggleBtn.textContent = '+';
        }
    }
    
    /**
     * Copy room code to clipboard
     */
    async copyRoomCode() {
        const roomCode = document.getElementById('room-code-display')?.textContent;
        
        if (!roomCode) return;
        
        try {
            await navigator.clipboard.writeText(roomCode);
            this.showNotification('Room code copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = roomCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Room code copied!', 'success');
        }
    }
    
    /**
     * Update connection status display
     */
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        
        const statusDot = document.getElementById('online-status-dot');
        const statusText = document.getElementById('online-status-text');
        const connectBtn = document.getElementById('connect-btn');
        
        switch (status) {
            case 'connected':
                statusDot.style.color = '#10b981';
                statusText.textContent = 'Connected';
                connectBtn.style.display = 'none';
                break;
            case 'connecting':
                statusDot.style.color = '#f59e0b';
                statusText.textContent = 'Connecting...';
                connectBtn.disabled = true;
                break;
            case 'disconnected':
                statusDot.style.color = '#ef4444';
                statusText.textContent = 'Disconnected';
                connectBtn.style.display = 'block';
                connectBtn.disabled = false;
                break;
        }
        
        this.updateGameStatusIndicator();
    }
    
    /**
     * Update game status indicator
     */
    updateGameStatusIndicator() {
        const gameDot = document.getElementById('game-status-dot');
        const gameText = document.getElementById('game-status-text');
        const opponentInfo = document.getElementById('opponent-info');
        
        if (this.isOnlineMode && this.connectionStatus === 'connected') {
            gameDot.style.color = '#10b981';
            gameText.textContent = 'Online Game';
            opponentInfo.style.display = 'block';
            
            // Update opponent name and room code
            const opponentName = document.getElementById('opponent-name');
            const roomCodeSmall = document.getElementById('room-code-small');
            
            if (opponentName && this.onlineManager?.opponentName) {
                opponentName.textContent = this.onlineManager.opponentName;
            }
            
            if (roomCodeSmall && this.onlineManager?.roomCode) {
                roomCodeSmall.textContent = this.onlineManager.roomCode;
            }
        } else {
            gameDot.style.color = '#6b7280';
            gameText.textContent = 'Offline';
            opponentInfo.style.display = 'none';
        }
    }
    
    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const loading = document.getElementById('online-loading');
        if (loading) {
            loading.querySelector('.loading-text').textContent = message;
            loading.style.display = 'flex';
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoading() {
        const loading = document.getElementById('online-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.ChessUtils && window.ChessUtils.showNotification) {
            window.ChessUtils.showNotification(message, type);
            return;
        }
        
        // Fallback notification system
        const notification = document.createElement('div');
        notification.className = `online-notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('online-notifications');
        if (container) {
            container.appendChild(notification);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }
    
    /**
     * Reset UI to initial state
     */
    resetUI() {
        this.isOnlineMode = false;
        this.chatMessages = [];
        
        // Hide online elements
        document.getElementById('online-indicator').style.display = 'none';
        document.getElementById('chat-panel').style.display = 'none';
        document.getElementById('room-info').style.display = 'none';
        
        // Show game modes
        document.getElementById('online-game-modes').style.display = 'block';
        
        // Clear input fields
        document.getElementById('room-code').value = '';
        document.getElementById('chat-input').value = '';
        document.getElementById('chat-messages').innerHTML = '';
        
        // Reset buttons
        document.getElementById('start-online-game').disabled = true;
        document.getElementById('start-online-game').textContent = 'Waiting for Opponent...';
    }
    
    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Check if currently in online mode
     */
    isOnline() {
        return this.isOnlineMode && this.onlineManager?.isConnected;
    }
    
    /**
     * Get the online manager instance
     */
    getOnlineManager() {
        return this.onlineManager;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.onlineManager) {
            this.onlineManager.disconnect();
            this.onlineManager = null;
        }
        
        // Remove UI elements
        const elements = [
            'online-modal',
            'online-indicator', 
            'game-lobby',
            'chat-panel',
            'online-notifications'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }
}

// Export for use in other modules
window.OnlineGameUI = OnlineGameUI;
