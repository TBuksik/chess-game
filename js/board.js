// Chess board management and rendering

/**
 * Chess board class
 */
class ChessBoard {
    constructor(containerElement) {
        this.container = containerElement;
        this.board = null;
        this.selectedSquare = null;
        this.validMoves = [];
        this.lastMove = null;
        this.isFlipped = false;
        
        this.initializeBoard();
        this.attachEventListeners();
    }
    
    /**
     * Initialize the chess board
     */
    initializeBoard() {
        this.board = PieceFactory.createInitialBoard();
        this.renderBoard();
    }
    
    /**
     * Render the chess board
     */
    renderBoard() {
        this.container.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.createSquareElement(row, col);
                this.container.appendChild(square);
            }
        }
    }
    
    /**
     * Create a square element
     */
    createSquareElement(row, col) {
        const square = document.createElement('div');
        square.className = `square ${ChessUtils.getSquareColor(row, col)}`;
        square.dataset.row = row;
        square.dataset.col = col;
        
        // Add coordinate labels on edge squares
        if (col === 0) {
            const rankLabel = document.createElement('div');
            rankLabel.className = 'coordinate-label rank';
            rankLabel.textContent = 8 - row;
            square.appendChild(rankLabel);
        }
        
        if (row === 7) {
            const fileLabel = document.createElement('div');
            fileLabel.className = 'coordinate-label file';
            fileLabel.textContent = String.fromCharCode(97 + col);
            square.appendChild(fileLabel);
        }
        
        // Add piece if present
        const piece = this.board[row][col];
        if (piece) {
            const pieceElement = this.createPieceElement(piece);
            square.appendChild(pieceElement);
        }
        
        return square;
    }
    
    /**
     * Create a piece element
     */
    createPieceElement(piece) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `piece ${piece.color} ${piece.type}`;
        pieceElement.dataset.type = piece.type;
        pieceElement.dataset.color = piece.color;
        pieceElement.draggable = true;
        
        return pieceElement;
    }
    
    /**
     * Attach event listeners to the board
     */
    attachEventListeners() {
        this.container.addEventListener('click', this.handleSquareClick.bind(this));
        this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.container.addEventListener('dragover', this.handleDragOver.bind(this));
        this.container.addEventListener('drop', this.handleDrop.bind(this));
        this.container.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
        this.container.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
        
        // Touch events for mobile
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Prevent default touch behaviors that interfere with chess
        this.container.addEventListener('touchstart', (e) => {
            if (e.target.closest('.piece') || e.target.closest('.square')) {
                e.preventDefault();
            }
        });
    }
    
    /**
     * Handle square click events
     */
    handleSquareClick(event) {
        const square = event.target.closest('.square');
        if (!square) return;
        
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        // If a square is selected and this is a valid move
        if (this.selectedSquare && this.isValidMoveSquare(row, col)) {
            this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            this.clearSelection();
        } else {
            // Select this square if it has a piece
            const piece = this.board[row][col];
            if (piece && this.canSelectPiece(piece)) {
                this.selectSquare(row, col);
            } else {
                this.clearSelection();
            }
        }
    }
    
    /**
     * Handle drag start events
     */
    handleDragStart(event) {
        if (!event.target.classList.contains('piece')) return;
        
        const square = event.target.closest('.square');
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = this.board[row][col];
        
        if (!this.canSelectPiece(piece)) {
            event.preventDefault();
            return;
        }
        
        this.selectSquare(row, col);
        event.target.classList.add('dragging');
        
        // Set drag data
        event.dataTransfer.setData('text/plain', `${row},${col}`);
        event.dataTransfer.effectAllowed = 'move';
    }
    
    /**
     * Handle drag over events
     */
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        
        const square = event.target.closest('.square');
        if (square) {
            square.classList.add('hover');
        }
    }
    
    /**
     * Handle drop events
     */
    handleDrop(event) {
        event.preventDefault();
        
        const square = event.target.closest('.square');
        if (!square) return;
        
        const toRow = parseInt(square.dataset.row);
        const toCol = parseInt(square.dataset.col);
        
        // Get source position from drag data
        const dragData = event.dataTransfer.getData('text/plain');
        const [fromRow, fromCol] = dragData.split(',').map(Number);
        
        // Remove dragging class
        const draggingPiece = this.container.querySelector('.piece.dragging');
        if (draggingPiece) {
            draggingPiece.classList.remove('dragging');
        }
        
        // Remove hover effects
        this.container.querySelectorAll('.square.hover').forEach(sq => {
            sq.classList.remove('hover');
        });
        
        // Make the move if valid
        if (this.isValidMoveSquare(toRow, toCol)) {
            this.makeMove(fromRow, fromCol, toRow, toCol);
        }
        
        this.clearSelection();
    }
    
    /**
     * Handle mouse enter events
     */
    handleMouseEnter(event) {
        if (event.target.classList.contains('square')) {
            event.target.classList.add('hover');
        }
    }
    
    /**
     * Handle mouse leave events
     */
    handleMouseLeave(event) {
        if (event.target.classList.contains('square')) {
            event.target.classList.remove('hover');
        }
    }
    
    /**
     * Select a square
     */
    selectSquare(row, col) {
        this.clearSelection();
        
        const piece = this.board[row][col];
        if (!piece) return;
        
        this.selectedSquare = { row, col, piece };
        
        // Highlight selected square
        const square = this.getSquareElement(row, col);
        square.classList.add('selected');
        
        // Show valid moves
        this.validMoves = piece.getValidMoves(this.board);
        this.highlightValidMoves();
        
        // Add piece selection indicator
        const pieceElement = square.querySelector('.piece');
        if (pieceElement) {
            pieceElement.classList.add('selected');
        }
    }
    
    /**
     * Clear current selection
     */
    clearSelection() {
        // Remove selection highlights
        this.container.querySelectorAll('.square.selected').forEach(square => {
            square.classList.remove('selected');
        });
        
        this.container.querySelectorAll('.piece.selected').forEach(piece => {
            piece.classList.remove('selected');
        });
        
        // Remove valid move highlights
        this.container.querySelectorAll('.square.valid-move').forEach(square => {
            square.classList.remove('valid-move', 'has-piece');
        });
        
        this.selectedSquare = null;
        this.validMoves = [];
    }
    
    /**
     * Highlight valid moves
     */
    highlightValidMoves() {
        this.validMoves.forEach(([row, col]) => {
            const square = this.getSquareElement(row, col);
            square.classList.add('valid-move');
            
            if (this.board[row][col]) {
                square.classList.add('has-piece');
            }
        });
    }
    
    /**
     * Check if a move square is valid
     */
    isValidMoveSquare(row, col) {
        return this.validMoves.some(([r, c]) => r === row && c === col);
    }
    
    /**
     * Check if a piece can be selected
     */
    canSelectPiece(piece) {
        if (!piece) return false;
        
        // For now, allow selecting any piece (will be restricted by game logic)
        return true;
    }
    
    /**
     * Make a move
     */
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) return false;
        
        // Check if move is valid
        if (!MoveValidator.isValidMove(piece, toRow, toCol, this.board, {})) {
            Animation.shake(this.getSquareElement(fromRow, fromCol));
            return false;
        }
        
        // Capture piece if present
        const capturedPiece = this.board[toRow][toCol];
        if (capturedPiece) {
            this.animateCapture(toRow, toCol);
        }
        
        // Move piece
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.moveTo(toRow, toCol);
        
        // Update last move
        this.lastMove = { from: [fromRow, fromCol], to: [toRow, toCol], piece, capturedPiece };
        
        // Animate move
        this.animateMove(fromRow, fromCol, toRow, toCol);
        
        // Re-render board
        setTimeout(() => {
            this.renderBoard();
            this.highlightLastMove();
        }, 300);
        
        // Dispatch move event
        this.dispatchMoveEvent();
        
        return true;
    }
    
    /**
     * Animate piece movement
     */
    animateMove(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.getSquareElement(fromRow, fromCol);
        const toSquare = this.getSquareElement(toRow, toCol);
        const piece = fromSquare.querySelector('.piece');
        
        if (!piece) return;
        
        // Calculate movement distance
        const fromRect = fromSquare.getBoundingClientRect();
        const toRect = toSquare.getBoundingClientRect();
        const deltaX = toRect.left - fromRect.left;
        const deltaY = toRect.top - fromRect.top;
        
        // Animate
        piece.classList.add('moving');
        piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        
        // Play move sound
        ChessUtils.playSound('move');
    }
    
    /**
     * Animate piece capture
     */
    animateCapture(row, col) {
        const square = this.getSquareElement(row, col);
        const piece = square.querySelector('.piece');
        
        if (piece) {
            piece.classList.add('captured');
            ChessUtils.playSound('capture');
        }
    }
    
    /**
     * Highlight the last move
     */
    highlightLastMove() {
        if (!this.lastMove) return;
        
        const [fromRow, fromCol] = this.lastMove.from;
        const [toRow, toCol] = this.lastMove.to;
        
        this.getSquareElement(fromRow, fromCol).classList.add('last-move');
        this.getSquareElement(toRow, toCol).classList.add('last-move');
    }
    
    /**
     * Get square element by coordinates
     */
    getSquareElement(row, col) {
        return this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    /**
     * Flip the board
     */
    flipBoard() {
        this.isFlipped = !this.isFlipped;
        this.container.classList.toggle('flipped', this.isFlipped);
    }
    
    /**
     * Reset the board to initial position
     */
    resetBoard() {
        this.clearSelection();
        this.board = PieceFactory.createInitialBoard();
        this.lastMove = null;
        this.renderBoard();
    }
    
    /**
     * Get the current board state
     */
    getBoardState() {
        return this.board.map(row => row.map(piece => piece ? piece.clone() : null));
    }
    
    /**
     * Set board state
     */
    setBoardState(boardState) {
        this.board = boardState;
        this.renderBoard();
    }
    
    /**
     * Dispatch move event
     */
    dispatchMoveEvent() {
        const event = new CustomEvent('chessmove', {
            detail: {
                lastMove: this.lastMove,
                board: this.getBoardState()
            }
        });
        this.container.dispatchEvent(event);
    }
    
    /**
     * Check if king is in check and highlight
     */
    highlightCheck(color) {
        const king = MoveValidator.findKing(this.board, color);
        if (king && MoveValidator.isKingInCheck(this.board, color)) {
            const square = this.getSquareElement(king.row, king.col);
            square.classList.add('check');
            
            const piece = square.querySelector('.piece');
            if (piece) {
                piece.classList.add('in-check');
            }
        }
    }
    
    /**
     * Clear check highlights
     */
    clearCheck() {
        this.container.querySelectorAll('.square.check').forEach(square => {
            square.classList.remove('check');
        });
        
        this.container.querySelectorAll('.piece.in-check').forEach(piece => {
            piece.classList.remove('in-check');
        });
    }
    
    /**
     * Handle touch start for mobile devices
     */
    handleTouchStart(e) {
        if (!e.target.closest('.square')) return;
        
        const square = e.target.closest('.square');
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        
        this.touchData = {
            startSquare: { row, col },
            startTime: Date.now(),
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY
        };
        
        // Provide visual feedback
        square.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (square.style.transform === 'scale(0.95)') {
                square.style.transform = '';
            }
        }, 150);
    }
    
    /**
     * Handle touch move for mobile devices
     */
    handleTouchMove(e) {
        if (!this.touchData) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - this.touchData.startX;
        const deltaY = currentY - this.touchData.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If moved more than 10px, it's a drag gesture
        if (distance > 10) {
            this.touchData.isDragging = true;
        }
    }
    
    /**
     * Handle touch end for mobile devices
     */
    handleTouchEnd(e) {
        if (!this.touchData) return;
        
        const touchDuration = Date.now() - this.touchData.startTime;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        
        // Find the square under the touch end position
        const endElement = document.elementFromPoint(endX, endY);
        const endSquare = endElement?.closest('.square');
        
        if (this.touchData.isDragging && endSquare) {
            // Handle drag and drop
            const endRow = parseInt(endSquare.dataset.row);
            const endCol = parseInt(endSquare.dataset.col);
            
            if (this.touchData.startSquare.row !== endRow || this.touchData.startSquare.col !== endCol) {
                this.handleMove(this.touchData.startSquare, { row: endRow, col: endCol });
            }
        } else if (touchDuration < 300 && !this.touchData.isDragging) {
            // Handle tap (short touch without dragging)
            this.handleSquareClick({
                target: document.querySelector(`[data-row="${this.touchData.startSquare.row}"][data-col="${this.touchData.startSquare.col}"]`)
            });
        }
        
        // Reset touch data
        this.touchData = null;
        
        // Clear any transform effects
        this.container.querySelectorAll('.square').forEach(square => {
            square.style.transform = '';
        });
    }
}

// Export for use in other modules
window.ChessBoard = ChessBoard;
