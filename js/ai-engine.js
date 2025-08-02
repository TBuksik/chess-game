// Chess AI Engine with multiple difficulty levels

/**
 * Chess AI Engine with different difficulty levels
 */
class ChessAI {
    constructor(difficulty = 'easy', color = 'black') {
        this.difficulty = difficulty;
        this.color = color;
        this.maxDepth = this.getMaxDepth();
        this.thinking = false;
        this.thinkingTime = this.getThinkingTime();
        
        // Piece values for evaluation
        this.pieceValues = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };
        
        // Position evaluation tables for different pieces
        this.positionTables = this.initializePositionTables();
    }
    
    /**
     * Get maximum search depth based on difficulty
     */
    getMaxDepth() {
        switch (this.difficulty) {
            case 'easy': return 2;
            case 'medium': return 4;
            case 'hard': return 6;
            default: return 2;
        }
    }
    
    /**
     * Get thinking time in milliseconds
     */
    getThinkingTime() {
        switch (this.difficulty) {
            case 'easy': return 500;   // 0.5 seconds
            case 'medium': return 1500; // 1.5 seconds
            case 'hard': return 3000;   // 3 seconds
            default: return 500;
        }
    }
    
    /**
     * Initialize position evaluation tables
     */
    initializePositionTables() {
        return {
            pawn: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5,  5, 10, 25, 25, 10,  5,  5],
                [0,  0,  0, 20, 20,  0,  0,  0],
                [5, -5,-10,  0,  0,-10, -5,  5],
                [5, 10, 10,-20,-20, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            knight: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            bishop: [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            rook: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [0,  0,  0,  5,  5,  0,  0,  0]
            ],
            queen: [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [-5,  0,  5,  5,  5,  5,  0, -5],
                [0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            king: [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [20, 20,  0,  0,  0,  0, 20, 20],
                [20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
    }
    
    /**
     * Get the best move for the AI
     */
    async getBestMove(board, gameState) {
        if (this.thinking) return null;
        
        this.thinking = true;
        
        // Show thinking indicator
        this.showThinkingIndicator();
        
        // Add artificial delay for better UX
        await new Promise(resolve => setTimeout(resolve, this.thinkingTime));
        
        let bestMove = null;
        
        try {
            if (this.difficulty === 'easy') {
                bestMove = this.getRandomMove(board);
            } else {
                bestMove = this.minimax(board, this.maxDepth, -Infinity, Infinity, true).move;
            }
        } catch (error) {
            console.error('AI error, falling back to random move:', error);
            bestMove = this.getRandomMove(board);
        }
        
        this.hideThinkingIndicator();
        this.thinking = false;
        
        return bestMove;
    }
    
    /**
     * Get a random valid move (Easy difficulty)
     */
    getRandomMove(board) {
        const validMoves = this.getAllValidMoves(board, this.color);
        
        if (validMoves.length === 0) return null;
        
        // For easy mode, prefer captures and central moves occasionally
        const captures = validMoves.filter(move => {
            const targetPiece = board[move.to[0]][move.to[1]];
            return targetPiece && targetPiece.color !== this.color;
        });
        
        // 30% chance to prefer captures in easy mode
        if (captures.length > 0 && Math.random() < 0.3) {
            return captures[Math.floor(Math.random() * captures.length)];
        }
        
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    /**
     * Minimax algorithm with alpha-beta pruning
     */
    minimax(board, depth, alpha, beta, isMaximizing) {
        if (depth === 0) {
            return { score: this.evaluateBoard(board), move: null };
        }
        
        const currentPlayer = isMaximizing ? this.color : ChessUtils.getOppositeColor(this.color);
        const validMoves = this.getAllValidMoves(board, currentPlayer);
        
        if (validMoves.length === 0) {
            // Check if it's checkmate or stalemate
            if (MoveValidator.isKingInCheck(board, currentPlayer)) {
                return { score: isMaximizing ? -10000 : 10000, move: null };
            } else {
                return { score: 0, move: null }; // Stalemate
            }
        }
        
        let bestMove = null;
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (let move of validMoves) {
                const newBoard = this.makeMove(board, move);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false);
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            
            for (let move of validMoves) {
                const newBoard = this.makeMove(board, move);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true);
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break; // Alpha-beta pruning
            }
            
            return { score: minScore, move: bestMove };
        }
    }
    
    /**
     * Evaluate the current board position
     */
    evaluateBoard(board) {
        let score = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceValue = this.pieceValues[piece.type];
                    const positionValue = this.getPositionValue(piece, row, col);
                    const totalValue = pieceValue + positionValue;
                    
                    if (piece.color === this.color) {
                        score += totalValue;
                    } else {
                        score -= totalValue;
                    }
                }
            }
        }
        
        // Add bonuses for game state
        score += this.evaluateGameState(board);
        
        return score;
    }
    
    /**
     * Get position value for a piece
     */
    getPositionValue(piece, row, col) {
        const table = this.positionTables[piece.type];
        if (!table) return 0;
        
        // Flip the table for black pieces
        const evalRow = piece.color === 'white' ? 7 - row : row;
        return table[evalRow][col];
    }
    
    /**
     * Evaluate special game state factors
     */
    evaluateGameState(board) {
        let bonus = 0;
        
        // Bonus for controlling center
        const centerSquares = [[3,3], [3,4], [4,3], [4,4]];
        for (let [row, col] of centerSquares) {
            const piece = board[row][col];
            if (piece && piece.color === this.color) {
                bonus += 30;
            }
        }
        
        // Bonus for piece development (knights and bishops)
        if (this.color === 'black') {
            // Check if pieces have moved from starting positions
            if (!board[0][1] || board[0][1].type !== 'knight') bonus += 20;
            if (!board[0][6] || board[0][6].type !== 'knight') bonus += 20;
            if (!board[0][2] || board[0][2].type !== 'bishop') bonus += 20;
            if (!board[0][5] || board[0][5].type !== 'bishop') bonus += 20;
        }
        
        return bonus;
    }
    
    /**
     * Get all valid moves for a color
     */
    getAllValidMoves(board, color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    const pieceMoves = piece.getValidMoves(board);
                    
                    for (let [toRow, toCol] of pieceMoves) {
                        if (MoveValidator.isValidMove(piece, toRow, toCol, board, {})) {
                            moves.push({
                                piece: piece,
                                from: [row, col],
                                to: [toRow, toCol]
                            });
                        }
                    }
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Make a move on the board (returns new board state)
     */
    makeMove(board, move) {
        // Deep copy the board
        const newBoard = board.map(row => row.map(piece => 
            piece ? { ...piece } : null
        ));
        
        const [fromRow, fromCol] = move.from;
        const [toRow, toCol] = move.to;
        const piece = newBoard[fromRow][fromCol];
        
        // Handle castling
        if (piece && piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
            const isKingside = toCol === 6;
            const rookFromCol = isKingside ? 7 : 0;
            const rookToCol = isKingside ? 5 : 3;
            const rook = newBoard[fromRow][rookFromCol];
            
            // Move king
            newBoard[toRow][toCol] = piece;
            newBoard[fromRow][fromCol] = null;
            piece.row = toRow;
            piece.col = toCol;
            
            // Move rook
            if (rook) {
                newBoard[fromRow][rookToCol] = rook;
                newBoard[fromRow][rookFromCol] = null;
                rook.row = fromRow;
                rook.col = rookToCol;
            }
        } else {
            // Normal move
            newBoard[toRow][toCol] = piece;
            newBoard[fromRow][fromCol] = null;
            
            // Update piece position
            if (piece) {
                piece.row = toRow;
                piece.col = toCol;
            }
        }
        
        return newBoard;
    }
    
    /**
     * Show thinking indicator
     */
    showThinkingIndicator() {
        const playerElement = document.querySelector('.opponent-player .player-name');
        if (playerElement) {
            const originalText = playerElement.textContent;
            playerElement.setAttribute('data-original', originalText);
            playerElement.textContent = 'Thinking...';
            playerElement.classList.add('ai-thinking');
        }
    }
    
    /**
     * Hide thinking indicator
     */
    hideThinkingIndicator() {
        const playerElement = document.querySelector('.opponent-player .player-name');
        if (playerElement) {
            const originalText = playerElement.getAttribute('data-original');
            if (originalText) {
                playerElement.textContent = originalText;
                playerElement.removeAttribute('data-original');
            }
            playerElement.classList.remove('ai-thinking');
        }
    }
    
    /**
     * Get difficulty description
     */
    getDifficultyDescription() {
        switch (this.difficulty) {
            case 'easy':
                return 'Makes mostly random moves with occasional good choices. Perfect for beginners.';
            case 'medium':
                return 'Uses basic strategy and looks ahead a few moves. Good for intermediate players.';
            case 'hard':
                return 'Advanced strategy with deep calculation. Challenging for experienced players.';
            default:
                return 'Unknown difficulty level.';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessAI;
}
