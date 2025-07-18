// Menu-only main file for index.html

/**
 * Chess application menu initialization
 */
class ChessAppMenu {
    constructor() {
        this.gameMode = null;
        this.init();
    }
    
    /**
     * Initialize the application menu
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeMenu());
        } else {
            this.initializeMenu();
        }
    }
    
    /**
     * Initialize the game mode selection menu
     */
    initializeMenu() {
        try {
            // Show the menu overlay
            const menuOverlay = document.getElementById('menu-overlay');
            
            if (!menuOverlay) {
                throw new Error('Menu overlay element not found');
            }
            
            // Add event listeners for menu options
            this.initializeMenuListeners();
            
            console.log('Menu initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize menu:', error);
            this.showErrorMessage('Failed to initialize the game menu. Please refresh the page.');
        }
    }
    
    /**
     * Initialize menu event listeners
     */
    initializeMenuListeners() {
        const menuOptions = document.querySelectorAll('.menu-option:not(:disabled)');
        
        menuOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const gameMode = e.currentTarget.getAttribute('data-mode');
                this.selectGameMode(gameMode);
            });
            
            // Add hover effects
            option.addEventListener('mouseenter', () => {
                if (!option.disabled) {
                    option.style.transform = 'translateY(-2px)';
                }
            });
            
            option.addEventListener('mouseleave', () => {
                if (!option.disabled) {
                    option.style.transform = 'translateY(0)';
                }
            });
        });
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleMenuKeyboard(e);
        });
    }
    
    /**
     * Handle keyboard navigation in menu
     */
    handleMenuKeyboard(event) {
        const enabledOptions = document.querySelectorAll('.menu-option:not(:disabled)');
        const currentFocus = document.activeElement;
        let currentIndex = -1;
        
        // Find current focused option
        enabledOptions.forEach((option, index) => {
            if (option === currentFocus) {
                currentIndex = index;
            }
        });
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = (currentIndex + 1) % enabledOptions.length;
                enabledOptions[nextIndex].focus();
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = currentIndex <= 0 ? enabledOptions.length - 1 : currentIndex - 1;
                enabledOptions[prevIndex].focus();
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (currentFocus && currentFocus.classList.contains('menu-option')) {
                    currentFocus.click();
                }
                break;
                
            case '1':
                event.preventDefault();
                this.selectGameMode('local');
                break;
        }
    }
    
    /**
     * Select a game mode and redirect to game page
     */
    selectGameMode(mode) {
        this.gameMode = mode;
        
        // Add visual feedback
        const selectedOption = document.querySelector(`[data-mode="${mode}"]`);
        if (selectedOption) {
            selectedOption.style.background = 'var(--accent-primary)';
            selectedOption.style.transform = 'scale(0.98)';
        }
        
        // Redirect to game page with selected mode
        setTimeout(() => {
            window.location.href = `game.html?mode=${mode}`;
        }, 200);
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
}

// Initialize the chess application menu
let chessAppMenu;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    chessAppMenu = new ChessAppMenu();
});

// Export for debugging and external access
window.ChessAppMenu = ChessAppMenu;

console.log('Chess app menu loaded successfully');
