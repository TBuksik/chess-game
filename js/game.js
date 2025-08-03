// Chess game logic and state management

/**
 * Chess game class
 */
class ChessGame {
    constructor(boardElement, gameMode = 'local') {
        this.board = new ChessBoard(boardElement);
        this.currentPlayer = 'white';
        this.gameState = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate', 'draw'
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameStartTime = Date.now();
        
        // Timer system
        this.timers = { white: 600, black: 600 }; // 10 minutes per player (in seconds)
        this.isTimerActive = false;
        this.currentPlayerStartTime = null;
        this.timerInterval = null;
        this.timeIncrement = 0; // Increment per move in seconds (0 for no increment)
        this.accumulatedTime = { white: 0, black: 0 }; // Track fractional seconds
        this.tenSecondWarningPlayed = { white: false, black: false }; // Track if warning sound was played
        
        this.gameMode = gameMode; // 'local', 'easy', 'medium', 'hard'
        this.ai = null;
        
        // Initialize AI if needed
        if (['easy', 'medium', 'hard'].includes(gameMode)) {
            this.ai = new ChessAI(gameMode, 'black');
        }
        
        // Give board a reference to the game for turn validation
        this.board.game = this;
        
        this.initializeGame();
        this.attachEventListeners();
    }
    
    /**
     * Initialize the game
     */
    initializeGame() {
        this.updateGameStatus();
        this.updatePlayerUI();
        this.startGame();
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Listen for chess moves
        this.board.container.addEventListener('chessmove', this.handleMove.bind(this));
        
        // Control buttons
        const newGameBtn = document.getElementById('new-game');
        const undoBtn = document.getElementById('undo-move');
        const hintBtn = document.getElementById('hint');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', this.newGame.bind(this));
        }
        
        if (undoBtn) {
            undoBtn.addEventListener('click', this.undoLastMove.bind(this));
        }
        
        if (hintBtn) {
            hintBtn.addEventListener('click', this.showHint.bind(this));
        }
    }
    
    /**
     * Start a new game
     */
    startGame() {
        this.currentPlayer = 'white';
        this.gameState = 'playing';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.gameStartTime = Date.now();
        
        // Reset timers to default (10 minutes each)
        this.timers = { white: 600, black: 600 };
        this.accumulatedTime = { white: 0, black: 0 }; // Reset accumulated time
        this.tenSecondWarningPlayed = { white: false, black: false }; // Reset warning flags
        this.isTimerActive = false;
        this.currentPlayerStartTime = null;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.board.resetBoard();
        this.updateGameStatus();
        this.updatePlayerUI();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateTimerDisplay();
        
        // Start the timer after a short delay
        setTimeout(() => {
            this.isTimerActive = true;
            this.startTimer();
        }, 1000);
        
        // Show game mode notification
        if (this.gameMode === 'local') {
            ChessUtils.showNotification('New local game started! Timer: 10 minutes each', 'success');
        } else {
            const difficultyText = this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
            ChessUtils.showNotification(`New game vs ${difficultyText} Bot started! Timer: 10 minutes each`, 'success');
        }
        
        // Play game start sound
        ChessUtils.playSound('game-start');
        
        // If AI is white, make the first move
        if (this.ai && this.currentPlayer === this.ai.color) {
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }
    
    /**
     * Handle a move
     */
    handleMove(event) {
        const { lastMove, board } = event.detail;
        
        // Add move to history
        this.addMoveToHistory(lastMove);
        
        // Handle captured pieces
        if (lastMove.capturedPiece) {
            this.capturedPieces[lastMove.capturedPiece.color].push(lastMove.capturedPiece);
            this.updateCapturedPieces();
        }
        
        // Switch players
        this.switchPlayer();
        
        // Check for special game states
        this.checkGameState();
        
        // Update UI
        this.updateGameStatus();
        this.updatePlayerUI();
        this.updateMoveHistory();
        
        // Play appropriate sound
        this.playMoveSound(lastMove);
        
        // Show promotion notification if this was a promotion
        if (lastMove.promotion) {
            const pieceNames = {
                'queen': 'Queen',
                'rook': 'Rook', 
                'bishop': 'Bishop',
                'knight': 'Knight'
            };
            ChessUtils.showNotification(
                `Pawn promoted to ${pieceNames[lastMove.promotion]}! ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s turn.`,
                'success'
            );
        }
        
        // Show castling notification if this was castling
        if (lastMove.castling) {
            const castlingType = lastMove.castling.type === 'kingside' ? 'Kingside' : 'Queenside';
            const playerColor = lastMove.piece.color === 'white' ? 'White' : 'Black';
            ChessUtils.showNotification(
                `${playerColor} castled ${castlingType.toLowerCase()}! ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}'s turn.`,
                'success'
            );
        }
        
        // Trigger AI move if it's AI's turn
        if (this.ai && this.currentPlayer === this.ai.color && (this.gameState === 'playing' || this.gameState === 'check')) {
            this.makeAIMove();
        }
    }
    
    /**
     * Check if it's a valid turn
     */
    isValidTurn(piece) {
        // In AI mode, prevent human from moving AI pieces
        if (this.ai && piece.color === this.ai.color) {
            return false;
        }
        
        // Allow moves when game is playing or when in check (to allow escape moves)
        return piece.color === this.currentPlayer && 
               (this.gameState === 'playing' || this.gameState === 'check');
    }
    
    /**
     * Make an AI move
     */
    async makeAIMove() {
        if (!this.ai || (this.gameState !== 'playing' && this.gameState !== 'check')) {
            return;
        }
        
        try {
            const boardState = this.board.getBoardState();
            const aiMove = await this.ai.getBestMove(boardState, this.gameState);
            
            if (aiMove) {
                const { from, to } = aiMove;
                const [fromRow, fromCol] = from;
                const [toRow, toCol] = to;
                
                // Execute the AI move
                setTimeout(() => {
                    this.board.makeMove(fromRow, fromCol, toRow, toCol, true); // Pass true for AI move
                }, 200); // Small delay for better UX
            } else {
                console.log('AI has no valid moves available');
            }
        } catch (error) {
            console.error('AI move error:', error);
            ChessUtils.showNotification('AI encountered an error', 'error');
        }
    }
    
    /**
     * Switch to the next player
     */
    switchPlayer() {
        // Stop timer for current player and add increment if any
        if (this.isTimerActive) {
            this.stopTimer();
            if (this.timeIncrement > 0) {
                this.timers[this.currentPlayer] += this.timeIncrement;
            }
        }
        
        this.currentPlayer = ChessUtils.getOppositeColor(this.currentPlayer);
        
        // Start timer for new current player
        if (this.isTimerActive && this.gameState === 'playing') {
            this.startTimer();
        }
        
        this.updateTimerDisplay();
    }
    
    /**
     * Start the chess timer for the current player
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.currentPlayerStartTime = Date.now();
        this.isTimerActive = true;
        
        this.timerInterval = setInterval(() => {
            if (this.gameState !== 'playing') {
                this.stopTimer();
                return;
            }
            
            // Calculate elapsed time since last start (including accumulated fractions)
            const elapsedMs = Date.now() - this.currentPlayerStartTime;
            const elapsedSeconds = elapsedMs / 1000;
            const totalElapsed = Math.floor(this.accumulatedTime[this.currentPlayer] + elapsedSeconds);
            
            // Update current player's time
            const newTime = this.timers[this.currentPlayer] - totalElapsed;
            
            if (newTime <= 0) {
                // Time's up!
                this.timers[this.currentPlayer] = 0;
                this.stopTimer();
                this.endGame('timeout');
                return;
            }
            
            // Play ten-seconds warning sound when time is running low
            if (Math.floor(newTime) === 10 && !this.tenSecondWarningPlayed[this.currentPlayer]) {
                ChessUtils.playSound('ten-seconds');
                this.tenSecondWarningPlayed[this.currentPlayer] = true;
            }
            
            this.updateTimerDisplay();
        }, 100); // Update every 100ms for smooth countdown
    }
    
    /**
     * Stop the chess timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.currentPlayerStartTime) {
            // Calculate precise elapsed time (including fractions)
            const elapsedMs = Date.now() - this.currentPlayerStartTime;
            const elapsedSeconds = elapsedMs / 1000;
            
            // Add to accumulated time for this player
            this.accumulatedTime[this.currentPlayer] += elapsedSeconds;
            
            // If accumulated time >= 1 second, deduct from timer
            if (this.accumulatedTime[this.currentPlayer] >= 1) {
                const secondsToDeduct = Math.floor(this.accumulatedTime[this.currentPlayer]);
                this.timers[this.currentPlayer] = Math.max(0, this.timers[this.currentPlayer] - secondsToDeduct);
                this.accumulatedTime[this.currentPlayer] -= secondsToDeduct;
            }
            
            this.currentPlayerStartTime = null;
        }
        
        this.updateTimerDisplay();
    }
    
    /**
     * Pause/Resume the timer
     */
    toggleTimer() {
        if (this.isTimerActive && this.timerInterval) {
            this.stopTimer();
            this.isTimerActive = false;
        } else {
            this.isTimerActive = true;
            if (this.gameState === 'playing') {
                this.startTimer();
            }
        }
    }
    
    /**
     * Update timer display in the UI
     */
    updateTimerDisplay() {
        // Calculate current display time
        let whiteTime = this.timers.white;
        let blackTime = this.timers.black;
        
        // If timer is active, subtract elapsed time for current player (including accumulated fractions)
        if (this.isTimerActive && this.currentPlayerStartTime) {
            const elapsedMs = Date.now() - this.currentPlayerStartTime;
            const elapsedSeconds = elapsedMs / 1000;
            const totalElapsed = Math.floor(this.accumulatedTime[this.currentPlayer] + elapsedSeconds);
            
            if (this.currentPlayer === 'white') {
                whiteTime = Math.max(0, whiteTime - totalElapsed);
            } else {
                blackTime = Math.max(0, blackTime - totalElapsed);
            }
        }
        
        // Update white timer displays
        const whiteTimerElements = document.querySelectorAll('.time-value.white, .current-player .time-value');
        whiteTimerElements.forEach(element => {
            element.textContent = ChessUtils.formatTime(whiteTime);
            element.classList.toggle('time-low', whiteTime <= 60);
            element.classList.toggle('time-critical', whiteTime <= 10);
        });
        
        // Update black timer displays
        const blackTimerElements = document.querySelectorAll('.time-value.black, .opponent-player .time-value');
        blackTimerElements.forEach(element => {
            element.textContent = ChessUtils.formatTime(blackTime);
            element.classList.toggle('time-low', blackTime <= 60);
            element.classList.toggle('time-critical', blackTime <= 10);
        });
        
        // Update active timer indicators
        this.updateActiveTimerIndicators();
    }
    
    /**
     * Update visual indicators for active timer
     */
    updateActiveTimerIndicators() {
        const whiteTimers = document.querySelectorAll('.timer-white, .current-player .time-info');
        const blackTimers = document.querySelectorAll('.timer-black, .opponent-player .time-info');
        
        whiteTimers.forEach(timer => {
            timer.classList.toggle('timer-active', this.currentPlayer === 'white' && this.isTimerActive);
        });
        
        blackTimers.forEach(timer => {
            timer.classList.toggle('timer-active', this.currentPlayer === 'black' && this.isTimerActive);
        });
    }
    
    /**
     * Set timer configuration
     */
    setTimerConfig(whiteTime, blackTime, increment = 0) {
        this.stopTimer();
        this.timers.white = whiteTime;
        this.timers.black = blackTime;
        this.timeIncrement = increment;
        this.accumulatedTime = { white: 0, black: 0 }; // Reset accumulated time
        this.tenSecondWarningPlayed = { white: false, black: false }; // Reset warning flags
        this.updateTimerDisplay();
    }
    
    /**
     * Check the current game state
     */
    checkGameState() {
        const boardState = this.board.getBoardState();
        
        // Clear previous check highlights
        this.board.clearCheck();
        
        // Check for check
        if (MoveValidator.isKingInCheck(boardState, this.currentPlayer)) {
            this.gameState = 'check';
            this.board.highlightCheck(this.currentPlayer);
            
            // Check for checkmate
            if (MoveValidator.isCheckmate(boardState, this.currentPlayer)) {
                this.gameState = 'checkmate';
                this.endGame('checkmate');
                return;
            }
        } else {
            // Check for stalemate
            if (MoveValidator.isStalemate(boardState, this.currentPlayer)) {
                this.gameState = 'stalemate';
                this.endGame('stalemate');
                return;
            }
            
            this.gameState = 'playing';
        }
        
        // Check for insufficient material (simplified)
        if (this.isInsufficientMaterial(boardState)) {
            this.gameState = 'draw';
            this.endGame('insufficient_material');
            return;
        }
    }
    
    /**
     * Check for insufficient material
     */
    isInsufficientMaterial(board) {
        const pieces = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    pieces.push(piece.type);
                }
            }
        }
        
        // King vs King
        if (pieces.length === 2) {
            return true;
        }
        
        // King + Bishop vs King or King + Knight vs King
        if (pieces.length === 3) {
            const pieceTypes = pieces.filter(type => type !== 'king');
            return pieceTypes.includes('bishop') || pieceTypes.includes('knight');
        }
        
        return false;
    }
    
    /**
     * End the game
     */
    endGame(reason) {
        // Set game state to ended to prevent further moves
        this.gameState = reason;
        
        // Stop the timer
        this.stopTimer();
        this.isTimerActive = false;
        
        // Disable further moves
        this.board.clearSelection();
        
        // Update UI to reflect game end
        this.updateGameStatus();
        this.updatePlayerUI();
        
        // Determine winner and result type
        let title, subtitle, result;
        
        switch (reason) {
            case 'checkmate':
                const winner = ChessUtils.getOppositeColor(this.currentPlayer);
                title = winner === 'white' ? 'White Wins!' : 'Black Wins!';
                subtitle = 'Checkmate! Game over.';
                result = 'win'; // From winner's perspective
                break;
            case 'stalemate':
                title = 'Stalemate';
                subtitle = 'The game is a draw.';
                result = 'draw';
                break;
            case 'insufficient_material':
                title = 'Draw';
                subtitle = 'Insufficient material to continue.';
                result = 'draw';
                break;
            case 'resignation':
                const resignationWinner = ChessUtils.getOppositeColor(this.currentPlayer);
                title = resignationWinner === 'white' ? 'White Wins!' : 'Black Wins!';
                subtitle = 'Win by resignation.';
                result = 'win';
                break;
            case 'timeout':
                const timeoutWinner = ChessUtils.getOppositeColor(this.currentPlayer);
                title = timeoutWinner === 'white' ? 'White Wins!' : 'Black Wins!';
                subtitle = 'Win on time.';
                result = 'win';
                break;
            default:
                title = 'Game Over';
                subtitle = 'The game has ended.';
                result = 'draw';
        }
        
        // Show full-screen overlay
        ChessUtils.showGameEndOverlay(title, subtitle, result);
        
        // Save game to history
        this.saveGameToHistory();
    }
    
    /**
     * Add move to history
     */
    addMoveToHistory(move) {
        const notation = this.moveToAlgebraicNotation(move);
        const moveData = {
            ...move,
            notation,
            player: move.piece.color,
            timestamp: Date.now(),
            gameState: this.gameState
        };
        
        this.moveHistory.push(moveData);
    }
    
    /**
     * Convert move to algebraic notation
     */
    moveToAlgebraicNotation(move) {
        const piece = move.piece;
        const [fromRow, fromCol] = move.from;
        const [toRow, toCol] = move.to;
        
        // Handle castling notation
        if (move.castling) {
            return move.castling.type === 'kingside' ? 'O-O' : 'O-O-O';
        }
        
        let notation = '';
        
        // Piece letter (except for pawns)
        if (piece.type !== 'pawn') {
            notation += piece.type.charAt(0).toUpperCase();
        }
        
        // Starting square (simplified - should include disambiguation)
        const fromSquare = ChessUtils.coordsToNotation(fromRow, fromCol);
        const toSquare = ChessUtils.coordsToNotation(toRow, toCol);
        
        // Capture notation
        if (move.capturedPiece) {
            if (piece.type === 'pawn') {
                notation += fromSquare.charAt(0); // file letter for pawn captures
            }
            notation += 'x';
        }
        
        // Destination square
        notation += toSquare;
        
        // Promotion notation
        if (move.promotion) {
            notation += '=' + move.promotion.charAt(0).toUpperCase();
        }
        
        // Check/checkmate notation (to be added after move is made)
        // This would be handled in the game state checking
        
        return notation;
    }
    
    /**
     * Undo the last move
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) {
            ChessUtils.showNotification('No moves to undo!', 'warning');
            return;
        }
        
        const lastMove = this.moveHistory.pop();
        const board = this.board.getBoardState();
        
        // Handle castling undo
        if (lastMove.castling) {
            const king = board[lastMove.to[0]][lastMove.to[1]];
            const rook = board[lastMove.castling.rookTo[0]][lastMove.castling.rookTo[1]];
            
            // Move king back
            if (king) {
                board[lastMove.from[0]][lastMove.from[1]] = king;
                board[lastMove.to[0]][lastMove.to[1]] = null;
                king.moveTo(lastMove.from[0], lastMove.from[1]);
                king.hasMoved = king.moveCount > 1;
                king.moveCount--;
            }
            
            // Move rook back
            if (rook) {
                board[lastMove.castling.rookFrom[0]][lastMove.castling.rookFrom[1]] = rook;
                board[lastMove.castling.rookTo[0]][lastMove.castling.rookTo[1]] = null;
                rook.moveTo(lastMove.castling.rookFrom[0], lastMove.castling.rookFrom[1]);
                rook.hasMoved = rook.moveCount > 1;
                rook.moveCount--;
            }
        } else {
            // Restore piece position (normal move)
            const piece = board[lastMove.to[0]][lastMove.to[1]];
            if (piece) {
                board[lastMove.from[0]][lastMove.from[1]] = piece;
                board[lastMove.to[0]][lastMove.to[1]] = null;
                piece.moveTo(lastMove.from[0], lastMove.from[1]);
                piece.hasMoved = piece.moveCount > 1;
                piece.moveCount--;
            }
            
            // Restore captured piece
            if (lastMove.capturedPiece) {
                board[lastMove.to[0]][lastMove.to[1]] = lastMove.capturedPiece;
                const capturedArray = this.capturedPieces[lastMove.capturedPiece.color];
                const index = capturedArray.findIndex(p => p.type === lastMove.capturedPiece.type);
                if (index !== -1) {
                    capturedArray.splice(index, 1);
                }
            }
        }
        
        // Switch back to previous player
        this.switchPlayer();
        
        // Update board and UI
        this.board.setBoardState(board);
        this.gameState = 'playing';
        this.updateGameStatus();
        this.updatePlayerUI();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        
        ChessUtils.showNotification('Move undone!', 'info');
    }
    
    /**
     * Show a hint for the current player
     */
    showHint() {
        // Simple hint: show a random valid move
        const board = this.board.getBoardState();
        const validMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === this.currentPlayer) {
                    const moves = piece.getValidMoves(board);
                    for (let [toRow, toCol] of moves) {
                        if (MoveValidator.isValidMove(piece, toRow, toCol, board, {})) {
                            validMoves.push({ piece, from: [row, col], to: [toRow, toCol] });
                        }
                    }
                }
            }
        }
        
        if (validMoves.length === 0) {
            ChessUtils.showNotification('No valid moves available!', 'warning');
            return;
        }
        
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        const fromSquare = ChessUtils.coordsToNotation(...randomMove.from);
        const toSquare = ChessUtils.coordsToNotation(...randomMove.to);
        
        // Highlight the suggested move
        this.board.clearSelection();
        this.board.selectSquare(...randomMove.from);
        
        ChessUtils.showNotification(
            `Hint: Try moving ${randomMove.piece.type} from ${fromSquare} to ${toSquare}`,
            'info'
        );
    }
    
    /**
     * Update game status display
     */
    updateGameStatus() {
        const statusElement = document.getElementById('game-message');
        if (!statusElement) return;
        
        let message = '';
        let className = '';
        
        switch (this.gameState) {
            case 'playing':
                message = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} to move`;
                className = '';
                break;
            case 'check':
                message = `${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)} is in check!`;
                className = 'check';
                break;
            case 'checkmate':
                message = `Checkmate! ${ChessUtils.getOppositeColor(this.currentPlayer)} wins!`;
                className = 'checkmate';
                break;
            case 'stalemate':
                message = 'Stalemate! The game is a draw.';
                className = 'stalemate';
                break;
            case 'draw':
                message = 'The game is a draw.';
                className = 'stalemate';
                break;
        }
        
        statusElement.textContent = message;
        statusElement.className = `game-message ${className}`;
    }
    
    /**
     * Update player UI indicators
     */
    updatePlayerUI() {
        // Update active player indicators
        const whiteTimer = document.querySelector('.white-timer');
        const blackTimer = document.querySelector('.black-timer');
        
        if (whiteTimer && blackTimer) {
            whiteTimer.classList.toggle('active', this.currentPlayer === 'white');
            blackTimer.classList.toggle('active', this.currentPlayer === 'black');
        }
    }
    
    /**
     * Update move history display
     */
    updateMoveHistory() {
        // Update desktop move history
        const moveListElement = document.getElementById('move-list');
        if (moveListElement) {
            this.updateMoveHistoryElement(moveListElement);
        }
        
        // Update mobile move history
        const moveListMobileElement = document.getElementById('move-list-mobile');
        if (moveListMobileElement) {
            this.updateMoveHistoryElement(moveListMobileElement, true);
        }
    }
    
    /**
     * Update a specific move history element
     */
    updateMoveHistoryElement(element, isMobile = false) {
        element.innerHTML = '';
        
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            const moveRow = document.createElement('div');
            moveRow.className = 'move-row';
            
            let moveText;
            if (isMobile) {
                // Compact format for mobile
                moveText = `${moveNumber}.${whiteMove.notation}`;
                if (blackMove) {
                    moveText += ` ${blackMove.notation}`;
                }
            } else {
                // Full format for desktop
                moveText = `${moveNumber}. ${whiteMove.notation}`;
                if (blackMove) {
                    moveText += ` ${blackMove.notation}`;
                }
            }
            
            moveRow.textContent = moveText;
            element.appendChild(moveRow);
        }
        
        // Scroll to bottom
        element.scrollTop = element.scrollHeight;
    }
    
    /**
     * Update captured pieces display
     */
    updateCapturedPieces() {
        const whiteCaptured = document.querySelector('.white-captured .captured-list');
        const blackCaptured = document.querySelector('.black-captured .captured-list');
        
        if (whiteCaptured) {
            whiteCaptured.innerHTML = '';
            this.capturedPieces.white.forEach(piece => {
                const pieceElement = document.createElement('div');
                pieceElement.className = `captured-piece ${piece.color} ${piece.type}`;
                whiteCaptured.appendChild(pieceElement);
            });
        }
        
        if (blackCaptured) {
            blackCaptured.innerHTML = '';
            this.capturedPieces.black.forEach(piece => {
                const pieceElement = document.createElement('div');
                pieceElement.className = `captured-piece ${piece.color} ${piece.type}`;
                blackCaptured.appendChild(pieceElement);
            });
        }
    }
    
    /**
     * Play appropriate sound for move
     */
    playMoveSound(move) {
        if (this.gameState === 'checkmate') {
            ChessUtils.playSound('game-end');
        } else if (this.gameState === 'stalemate' || this.gameState === 'draw') {
            ChessUtils.playSound('game-draw');
        } else if (this.gameState === 'check') {
            ChessUtils.playSound('check');
        } else if (move.promotion) {
            ChessUtils.playSound('promote');
        } else if (move.castling) {
            // Castling sound is already played in board.js
            return;
        } else if (move.capturedPiece) {
            ChessUtils.playSound('capture');
        } else {
            ChessUtils.playSound('move');
        }
    }
    
    /**
     * Save game to browser storage
     */
    saveGameToHistory() {
        const gameData = {
            moveHistory: this.moveHistory,
            result: this.gameState,
            startTime: this.gameStartTime,
            endTime: Date.now(),
            players: ['Player 1', 'Player 2']
        };
        
        const savedGames = ChessUtils.Storage.get('chess-games', []);
        savedGames.push(gameData);
        
        // Keep only last 10 games
        if (savedGames.length > 10) {
            savedGames.splice(0, savedGames.length - 10);
        }
        
        ChessUtils.Storage.set('chess-games', savedGames);
    }
    
    /**
     * Create a new game
     */
    newGame() {
        if (confirm('Are you sure you want to start a new game?')) {
            this.startGame();
        }
    }
    
    /**
     * Get current game state
     */
    getGameState() {
        return {
            board: this.board.getBoardState(),
            currentPlayer: this.currentPlayer,
            gameState: this.gameState,
            moveHistory: [...this.moveHistory],
            capturedPieces: { ...this.capturedPieces }
        };
    }
}

// Export for use in other modules
window.ChessGame = ChessGame;
