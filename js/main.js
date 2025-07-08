// Main application entry point

/**
 * Chess application initialization
 */
class ChessApp {
    constructor() {
        this.game = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * Initialize the application
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
            
            // Create the chess game
            this.game = new ChessGame(boardElement);
            this.isInitialized = true;
            
            // Add keyboard shortcuts
            this.initializeKeyboardShortcuts();
            
            // Add responsive handling
            this.initializeResponsiveHandling();
            
            // Add theme handling
            this.initializeThemeHandling();
            
            // Show welcome message
            this.showWelcomeMessage();
            
            console.log('Chess game initialized successfully');
            
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
                        this.game.newGame();
                    }
                    break;
                    
                case 'z':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.game.undoLastMove();
                    }
                    break;
                    
                case 'h':
                    event.preventDefault();
                    this.game.showHint();
                    break;
                    
                case 'f':
                    event.preventDefault();
                    this.game.board.flipBoard();
                    break;
                    
                case 'escape':
                    event.preventDefault();
                    this.game.board.clearSelection();
                    break;
            }
        });
    }
    
    /**
     * Initialize responsive handling
     */
    initializeResponsiveHandling() {
        const handleResize = ChessUtils.debounce(() => {
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
        const sidebar = document.querySelectorAll('.sidebar');
        
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
        const savedTheme = ChessUtils.Storage.get('chess-theme', 'dark');
        this.setTheme(savedTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (!ChessUtils.Storage.get('chess-theme-override')) {
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
        ChessUtils.Storage.set('chess-theme', theme);
    }
    
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        setTimeout(() => {
            ChessUtils.showNotification('Welcome to Chess! White moves first.', 'info');
        }, 1000);
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
            gameState: this.game ? this.game.getGameState() : null
        };
    }
}

/**
 * Global utilities and event handlers
 */
const AppUtils = {
    /**
     * Initialize tooltips
     */
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', this.showTooltip);
            element.addEventListener('mouseleave', this.hideTooltip);
        });
    },
    
    /**
     * Show tooltip
     */
    showTooltip(event) {
        const text = event.target.getAttribute('data-tooltip');
        if (!text) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        
        Object.assign(tooltip.style, {
            position: 'absolute',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-sm)',
            zIndex: '9999',
            whiteSpace: 'nowrap',
            border: '1px solid var(--border-color)'
        });
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
        
        event.target._tooltip = tooltip;
    },
    
    /**
     * Hide tooltip
     */
    hideTooltip(event) {
        if (event.target._tooltip) {
            event.target._tooltip.remove();
            delete event.target._tooltip;
        }
    },
    
    /**
     * Add loading spinner
     */
    showLoading(element, text = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        
        element.appendChild(spinner);
        return spinner;
    },
    
    /**
     * Remove loading spinner
     */
    hideLoading(spinner) {
        if (spinner && spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
        }
    }
};

// Add CSS for tooltips and loading spinner
const additionalCSS = `
.tooltip {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: fadeIn 0.2s ease;
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    font-size: var(--font-size-sm);
    font-weight: 500;
}

.error-message button {
    background: var(--accent-primary);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: var(--radius-md);
    margin-top: 1rem;
    cursor: pointer;
    font-weight: 500;
}

.error-message button:hover {
    background: var(--accent-secondary);
}

/* Mobile layout adjustments */
.mobile-layout {
    grid-template-columns: 1fr !important;
}

.mobile-layout .sidebar {
    order: 3;
    margin-top: 1rem;
}

.mobile-layout .main-game {
    order: 1;
}

.mobile-layout .right-sidebar {
    order: 2;
}

/* Small screen adjustments */
.small-screen .chess-board {
    grid-template-columns: repeat(8, 45px);
    grid-template-rows: repeat(8, 45px);
}

.small-screen .piece {
    font-size: 30px;
}

/* Print styles */
@media print {
    .sidebar,
    .game-header,
    .board-coordinates {
        display: none !important;
    }
    
    .game-container {
        grid-template-columns: 1fr !important;
    }
    
    .chess-board {
        border: 2px solid #000 !important;
    }
}
`;

// Add additional CSS to document
if (!document.querySelector('#additional-styles')) {
    const style = document.createElement('style');
    style.id = 'additional-styles';
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}

// Initialize the application
let chessApp;

// Wait for all resources to load
window.addEventListener('load', () => {
    chessApp = new ChessApp();
    AppUtils.initializeTooltips();
});

// Export for debugging and external access
window.ChessApp = ChessApp;
window.AppUtils = AppUtils;

// Handle unload events
window.addEventListener('beforeunload', (event) => {
    if (chessApp && chessApp.isInitialized && chessApp.game) {
        const gameState = chessApp.game.getGameState();
        if (gameState.moveHistory.length > 0 && gameState.gameState === 'playing') {
            event.preventDefault();
            event.returnValue = 'You have a game in progress. Are you sure you want to leave?';
            return event.returnValue;
        }
    }
});

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker can be added later for offline functionality
        console.log('Service worker support detected');
    });
}

console.log('Chess application loaded successfully');
