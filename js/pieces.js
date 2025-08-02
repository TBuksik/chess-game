// Chess piece definitions and movement logic

/**
 * Chess piece class
 */
class ChessPiece {
    constructor(type, color, row, col) {
        this.type = type;
        this.color = color;
        this.row = row;
        this.col = col;
        this.hasMoved = false;
        this.moveCount = 0;
    }
    
    /**
     * Get the Unicode symbol for this piece
     */
    getSymbol() {
        const symbols = {
            white: {
                king: '♔', queen: '♕', rook: '♖',
                bishop: '♗', knight: '♘', pawn: '♙'
            },
            black: {
                king: '♚', queen: '♛', rook: '♜',
                bishop: '♝', knight: '♞', pawn: '♟'
            }
        };
        return symbols[this.color][this.type];
    }
    
    /**
     * Get valid moves for this piece
     * @param {Array} board - The current board state
     * @returns {Array} Array of valid move coordinates
     */
    getValidMoves(board) {
        switch (this.type) {
            case 'pawn': return this.getPawnMoves(board);
            case 'rook': return this.getRookMoves(board);
            case 'knight': return this.getKnightMoves(board);
            case 'bishop': return this.getBishopMoves(board);
            case 'queen': return this.getQueenMoves(board);
            case 'king': return this.getKingMoves(board);
            default: return [];
        }
    }
    
    /**
     * Get valid moves for a pawn
     */
    getPawnMoves(board) {
        const moves = [];
        const direction = this.color === 'white' ? -1 : 1;
        const startRow = this.color === 'white' ? 6 : 1;
        
        // Forward move
        const newRow = this.row + direction;
        if (ChessUtils.isValidSquare(newRow, this.col) && !board[newRow][this.col]) {
            moves.push([newRow, this.col]);
            
            // Double move from starting position
            if (this.row === startRow) {
                const doubleRow = newRow + direction;
                if (ChessUtils.isValidSquare(doubleRow, this.col) && !board[doubleRow][this.col]) {
                    moves.push([doubleRow, this.col]);
                }
            }
        }
        
        // Diagonal captures
        for (let colOffset of [-1, 1]) {
            const captureCol = this.col + colOffset;
            if (ChessUtils.isValidSquare(newRow, captureCol)) {
                const target = board[newRow][captureCol];
                if (target && target.color !== this.color) {
                    moves.push([newRow, captureCol]);
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get valid moves for a rook
     */
    getRookMoves(board) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        for (let [rowDir, colDir] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = this.row + rowDir * i;
                const newCol = this.col + colDir * i;
                
                if (!ChessUtils.isValidSquare(newRow, newCol)) break;
                
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push([newRow, newCol]);
                } else {
                    if (target.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get valid moves for a knight
     */
    getKnightMoves(board) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (let [rowOffset, colOffset] of knightMoves) {
            const newRow = this.row + rowOffset;
            const newCol = this.col + colOffset;
            
            if (ChessUtils.isValidSquare(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== this.color) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get valid moves for a bishop
     */
    getBishopMoves(board) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (let [rowDir, colDir] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = this.row + rowDir * i;
                const newCol = this.col + colDir * i;
                
                if (!ChessUtils.isValidSquare(newRow, newCol)) break;
                
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push([newRow, newCol]);
                } else {
                    if (target.color !== this.color) {
                        moves.push([newRow, newCol]);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get valid moves for a queen
     */
    getQueenMoves(board) {
        return [...this.getRookMoves(board), ...this.getBishopMoves(board)];
    }
    
    /**
     * Get valid moves for a king
     */
    getKingMoves(board) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        // Normal king moves
        for (let [rowOffset, colOffset] of directions) {
            const newRow = this.row + rowOffset;
            const newCol = this.col + colOffset;
            
            if (ChessUtils.isValidSquare(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== this.color) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        // Castling moves
        if (!this.hasMoved) {
            const castlingMoves = this.getCastlingMoves(board);
            moves.push(...castlingMoves);
        }
        
        return moves;
    }
    
    /**
     * Get valid castling moves for the king
     */
    getCastlingMoves(board) {
        const moves = [];
        const backRank = this.color === 'white' ? 7 : 0;
        
        // Only allow castling if king is on its starting square
        if (this.row !== backRank || this.col !== 4) {
            return moves;
        }
        
        // Check kingside castling (short castling)
        const kingsideRook = board[backRank][7];
        if (kingsideRook && kingsideRook.type === 'rook' && 
            kingsideRook.color === this.color && !kingsideRook.hasMoved) {
            
            // Check if squares between king and rook are empty
            if (!board[backRank][5] && !board[backRank][6]) {
                moves.push([backRank, 6]); // King moves to g1/g8
            }
        }
        
        // Check queenside castling (long castling)
        const queensideRook = board[backRank][0];
        if (queensideRook && queensideRook.type === 'rook' && 
            queensideRook.color === this.color && !queensideRook.hasMoved) {
            
            // Check if squares between king and rook are empty
            if (!board[backRank][1] && !board[backRank][2] && !board[backRank][3]) {
                moves.push([backRank, 2]); // King moves to c1/c8
            }
        }
        
        return moves;
    }
    
    /**
     * Move the piece to a new position
     */
    moveTo(newRow, newCol) {
        this.row = newRow;
        this.col = newCol;
        this.hasMoved = true;
        this.moveCount++;
    }
    
    /**
     * Create a copy of this piece
     */
    clone() {
        const piece = new ChessPiece(this.type, this.color, this.row, this.col);
        piece.hasMoved = this.hasMoved;
        piece.moveCount = this.moveCount;
        return piece;
    }
}

/**
 * Chess piece factory
 */
class PieceFactory {
    /**
     * Create a piece from notation
     * @param {string} notation - Piece notation (e.g., 'wK' for white king)
     * @param {number} row - Row position
     * @param {number} col - Column position
     */
    static createFromNotation(notation, row, col) {
        const color = notation[0] === 'w' ? 'white' : 'black';
        const typeMap = {
            'K': 'king', 'Q': 'queen', 'R': 'rook',
            'B': 'bishop', 'N': 'knight', 'P': 'pawn'
        };
        const type = typeMap[notation[1]];
        return new ChessPiece(type, color, row, col);
    }
    
    /**
     * Create the initial chess board setup
     */
    static createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Initial piece positions
        const initialSetup = [
            ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
            ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
            ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
        ];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (initialSetup[row][col]) {
                    board[row][col] = this.createFromNotation(
                        initialSetup[row][col], row, col
                    );
                }
            }
        }
        
        return board;
    }
}

/**
 * Chess move validator
 */
class MoveValidator {
    /**
     * Check if a move is valid
     * @param {ChessPiece} piece - The piece to move
     * @param {number} toRow - Target row
     * @param {number} toCol - Target column
     * @param {Array} board - Current board state
     * @param {Object} gameState - Current game state
     */
    static isValidMove(piece, toRow, toCol, board, gameState) {
        if (!ChessUtils.isValidSquare(toRow, toCol)) {
            return false;
        }
        
        const target = board[toRow][toCol];
        if (target && target.color === piece.color) {
            return false;
        }
        
        const validMoves = piece.getValidMoves(board);
        const moveExists = validMoves.some(([r, c]) => r === toRow && c === toCol);
        
        if (!moveExists) {
            return false;
        }
        
        // Special validation for castling
        if (piece.type === 'king' && Math.abs(toCol - piece.col) === 2) {
            return this.isCastlingValid(piece, toRow, toCol, board);
        }
        
        // Check if move would put own king in check
        const testBoard = this.simulateMove(board, piece.row, piece.col, toRow, toCol);
        if (this.isKingInCheck(testBoard, piece.color)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Simulate a move without actually making it
     */
    static simulateMove(board, fromRow, fromCol, toRow, toCol) {
        const newBoard = board.map(row => row.map(piece => piece ? piece.clone() : null));
        const piece = newBoard[fromRow][fromCol];
        
        if (piece) {
            // Handle castling in simulation
            if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
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
                piece.row = toRow;
                piece.col = toCol;
            }
        }
        
        return newBoard;
    }
    
    /**
     * Check if castling move is valid
     */
    static isCastlingValid(king, toRow, toCol, board) {
        // King must not be in check currently
        if (this.isKingInCheck(board, king.color)) {
            return false;
        }
        
        const isKingside = toCol === 6; // g-file
        const isQueenside = toCol === 2; // c-file
        
        if (isKingside) {
            // Check that king doesn't pass through or end up in check
            // Test king on f-file (5) and g-file (6)
            for (let testCol = 5; testCol <= 6; testCol++) {
                const testBoard = this.simulateMove(board, king.row, king.col, king.row, testCol);
                if (this.isKingInCheck(testBoard, king.color)) {
                    return false;
                }
            }
        } else if (isQueenside) {
            // Check that king doesn't pass through or end up in check
            // Test king on d-file (3) and c-file (2)
            for (let testCol = 3; testCol >= 2; testCol--) {
                const testBoard = this.simulateMove(board, king.row, king.col, king.row, testCol);
                if (this.isKingInCheck(testBoard, king.color)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Check if a king is in check
     */
    static isKingInCheck(board, color) {
        const king = this.findKing(board, color);
        if (!king) return false;
        
        const oppositeColor = ChessUtils.getOppositeColor(color);
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === oppositeColor) {
                    const moves = piece.getValidMoves(board);
                    if (moves.some(([r, c]) => r === king.row && c === king.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    /**
     * Find the king of a specific color
     */
    static findKing(board, color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return piece;
                }
            }
        }
        return null;
    }
    
    /**
     * Check if a position is checkmate
     */
    static isCheckmate(board, color) {
        if (!this.isKingInCheck(board, color)) {
            return false;
        }
        
        // Check if any move can get out of check
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    const moves = piece.getValidMoves(board);
                    for (let [toRow, toCol] of moves) {
                        // Check if this move is actually valid (doesn't put own king in check)
                        if (this.isValidMove(piece, toRow, toCol, board, {})) {
                            return false; // Found a valid move that gets out of check
                        }
                    }
                }
            }
        }
        
        return true; // No valid moves can get out of check, it's checkmate
    }
    
    /**
     * Check if a position is stalemate
     */
    static isStalemate(board, color) {
        if (this.isKingInCheck(board, color)) {
            return false;
        }
        
        // Check if any legal moves exist
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.color === color) {
                    const moves = piece.getValidMoves(board);
                    for (let [toRow, toCol] of moves) {
                        if (this.isValidMove(piece, toRow, toCol, board, {})) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }
}

// Export for use in other modules
window.ChessPiece = ChessPiece;
window.PieceFactory = PieceFactory;
window.MoveValidator = MoveValidator;
