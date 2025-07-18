// Game page main entry point

/**
 * Chess Game Page initialization
 */
class ChessGamePage {
    constructor() {
        this.game = null;
        this.isInitialized = false;
        this.gameMode = this.getGameModeFromURL();
        
        this.init();
    }
    
    /**
     * Get game mode from URL parameters
     */
    getGameModeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('mode') || 'local';
    }
    
    /**
     * Initialize the game page
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeGame());
        } else {
            this.initializeGame();
        }
    }
    
    /**
     * Initialize the chess game
     */
    initializeGame() {
        try {
            const boardElement = document.getElementById('chess-board');
            
            if (!boardElement) {
                throw new Error('Chess board element not found');
            }
            
            // Create the chess game with selected mode
            this.game = new ChessGame(boardElement, this.gameMode);
            this.isInitialized = true;
            
            // Make game instance globally accessible
            window.chessGame = this.game;
            
            // Add keyboard shortcuts
            this.initializeKeyboardShortcuts();
            
            // Add responsive handling
            this.initializeResponsiveHandling();
            
            // Add theme handling
            this.initializeThemeHandling();
            
            // Show game mode notification
            setTimeout(() => {
                const modeText = this.gameMode === 'local' ? 'Local 1v1' : `${this.gameMode} Bot`;
                if (typeof ChessUtils !== 'undefined' && ChessUtils.showNotification) {
                    ChessUtils.showNotification(`Starting ${modeText} game! White moves first.`, 'info');
                }
            }, 500);
            
            console.log(`Chess game initialized successfully in ${this.gameMode} mode`);
            
        } catch (error) {
            console.error('Failed to initialize chess game:', error);
            this.showErrorMessage('Failed to initialize the chess game. Please refresh the page.');
        }
    }
    
    /**
     * Initialize keyboard shortcuts
     */
    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ignore if user is typing in an input
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch (event.key.toLowerCase()) {
                case 'n':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.newGame();
                    }
                    break;
                    
                case 'z':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        if (this.game && this.game.undoLastMove) {
                            this.game.undoLastMove();
                        }
                    }
                    break;
                    
                case 'h':
                    event.preventDefault();
                    if (this.game && this.game.showHint) {
                        this.game.showHint();
                    }
                    break;
                    
                case 'f':
                    event.preventDefault();
                    if (this.game && this.game.board && this.game.board.flipBoard) {
                        this.game.board.flipBoard();
                    }
                    break;
                    
                case 'escape':
                    event.preventDefault();
                    if (this.game && this.game.board && this.game.board.clearSelection) {
                        this.game.board.clearSelection();
                    }
                    break;
                    
                case 'm':
                    event.preventDefault();
                    this.backToMenu();
                    break;
            }
        });
    }
    
    /**
     * Start a new game (reload page)
     */
    newGame() {
        if (confirm('Are you sure you want to start a new game? Current progress will be lost.')) {
            window.location.reload();
        }
    }
    
    /**
     * Go back to menu
     */
    backToMenu() {
        if (this.game && this.game.getGameState) {
            const gameState = this.game.getGameState();
            if (gameState.moveHistory && gameState.moveHistory.length > 0 && gameState.gameState === 'playing') {
                if (confirm('You have a game in progress. Are you sure you want to return to menu?')) {
                    window.location.href = 'index.html';
                }
            } else {
                window.location.href = 'index.html';
            }
        } else {
            window.location.href = 'index.html';
        }
    }
    
    /**
     * Initialize responsive handling
     */
    initializeResponsiveHandling() {
        const handleResize = this.debounce(() => {
            this.adjustLayoutForScreenSize();
        }, 250);
        
        window.addEventListener('resize', handleResize);
        this.adjustLayoutForScreenSize();
    }
    
    /**
     * Adjust layout for screen size
     */
    adjustLayoutForScreenSize() {
        const gameContainer = document.querySelector('.game-container');
        
        if (window.innerWidth <= 768) {
            gameContainer.classList.add('mobile-layout');
        } else {
            gameContainer.classList.remove('mobile-layout');
        }
        
        // Adjust board size if needed
        if (window.innerWidth <= 480) {
            document.body.classList.add('small-screen');
        } else {
            document.body.classList.remove('small-screen');
        }
    }
    
    /**
     * Initialize theme handling
     */
    initializeThemeHandling() {
        // Check for saved theme preference
        const savedTheme = this.getStorageItem('chess-theme', 'dark');
        this.setTheme(savedTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!this.getStorageItem('chess-theme-override')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
    
    /**
     * Set application theme
     */
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.setStorageItem('chess-theme', theme);
    }
    
    /**
     * Get item from localStorage
     */
    getStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('Failed to get storage item:', key);
            return defaultValue;
        }
    }
    
    /**
     * Set item to localStorage
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to set storage item:', key);
        }
    }
    
    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Show error message
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h2>Error</h2>
            <p>${message}</p>
            <button onclick="location.reload()">Reload Page</button>
            <button onclick="window.location.href='index.html'">Back to Menu</button>
        `;
        
        Object.assign(errorDiv.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--accent-danger)',
            textAlign: 'center',
            zIndex: '10000',
            maxWidth: '400px'
        });
        
        document.body.appendChild(errorDiv);
    }
    
    /**
     * Get application state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            gameMode: this.gameMode,
            gameState: this.game ? this.game.getGameState() : null
        };
    }
}

// Initialize the game page
let chessGamePage;

// Wait for all resources to load
window.addEventListener('load', () => {
    chessGamePage = new ChessGamePage();
});

// Export for debugging and external access
window.ChessGamePage = ChessGamePage;

// Handle unload events
window.addEventListener('beforeunload', (event) => {
    if (chessGamePage && chessGamePage.isInitialized && chessGamePage.game) {
        const gameState = chessGamePage.game.getGameState();
        if (gameState.moveHistory && gameState.moveHistory.length > 0 && gameState.gameState === 'playing') {
            event.preventDefault();
            event.returnValue = 'You have a game in progress. Are you sure you want to leave?';
            return event.returnValue;
        }
    }
});

console.log('Chess game page loaded successfully');
