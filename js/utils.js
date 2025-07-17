// Utility functions for the chess game

/**
 * Convert chess notation to board coordinates
 * @param {string} notation - Chess notation (e.g., 'e4')
 * @returns {object} {row, col} coordinates
 */
function notationToCoords(notation) {
    const file = notation.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = parseInt(notation[1]) - 1;   // 1=0, 2=1, ..., 8=7
    return { row: 7 - rank, col: file };
}

/**
 * Convert board coordinates to chess notation
 * @param {number} row - Row index (0-7)
 * @param {number} col - Column index (0-7)
 * @returns {string} Chess notation (e.g., 'e4')
 */
function coordsToNotation(row, col) {
    const file = String.fromCharCode(97 + col); // 0=a, 1=b, ..., 7=h
    const rank = (8 - row).toString();          // 0=8, 1=7, ..., 7=1
    return file + rank;
}

/**
 * Check if coordinates are within the board
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean} True if coordinates are valid
 */
function isValidSquare(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Create a deep copy of an object
 * @param {object} obj - Object to clone
 * @returns {object} Deep copy of the object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Get the opposite color
 * @param {string} color - 'white' or 'black'
 * @returns {string} Opposite color
 */
function getOppositeColor(color) {
    return color === 'white' ? 'black' : 'white';
}

/**
 * Check if a square is light or dark
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {string} 'light' or 'dark'
 */
function getSquareColor(row, col) {
    return (row + col) % 2 === 0 ? 'dark' : 'light';
}

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Play a sound effect
 * @param {string} soundName - Name of the sound to play
 */
function playSound(soundName) {
    // Sound effects can be added later
    console.log(`Sound: ${soundName}`);
}

/**
 * Show a notification message
 * @param {string} message - Message to display
 * @param {string} type - Type of message ('info', 'success', 'warning', 'error')
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transition: 'all 0.3s ease',
        maxWidth: '300px'
    });
    
    // Set background color based on type
    const colors = {
        info: '#33a1cc',
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#ff6b6b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Show a full-screen game end overlay
 * @param {string} title - Main title message
 * @param {string} subtitle - Subtitle message
 * @param {string} result - Game result ('win', 'loss', 'draw')
 */
function showGameEndOverlay(title, subtitle, result) {
    // Remove any existing overlay
    const existingOverlay = document.querySelector('.game-end-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'game-end-overlay';
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'game-end-content';
    
    // Create title
    const titleElement = document.createElement('h1');
    titleElement.className = `game-end-title ${result}`;
    titleElement.textContent = title;
    
    // Create subtitle
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'game-end-subtitle';
    subtitleElement.textContent = subtitle;
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'game-end-buttons';
    
    // Create New Game button
    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'game-end-btn primary';
    newGameBtn.textContent = 'New Game';
    newGameBtn.onclick = () => {
        overlay.remove();
        // Trigger new game
        const gameInstance = window.chessGame || window.game;
        if (gameInstance && gameInstance.newGame) {
            gameInstance.newGame();
        }
    };
    
    // Create Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'game-end-btn secondary';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => {
        overlay.remove();
    };
    
    // Assemble the overlay
    buttonsContainer.appendChild(newGameBtn);
    buttonsContainer.appendChild(closeBtn);
    
    content.appendChild(titleElement);
    content.appendChild(subtitleElement);
    content.appendChild(buttonsContainer);
    
    overlay.appendChild(content);
    
    // Add to DOM
    document.body.appendChild(overlay);
    
    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });
    
    // Close on ESC key
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // Close on background click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };
}

/**
 * Debounce function to limit function calls
 * @param {function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {function} Debounced function
 */
function debounce(func, wait) {
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
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Local storage helpers
 */
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Could not read from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('Could not remove from localStorage:', e);
        }
    }
};

/**
 * Animation helpers
 */
const Animation = {
    /**
     * Animate an element's property
     * @param {HTMLElement} element - Element to animate
     * @param {object} properties - CSS properties to animate
     * @param {number} duration - Animation duration in milliseconds
     * @param {string} easing - CSS easing function
     */
    animate(element, properties, duration = 300, easing = 'ease') {
        return new Promise(resolve => {
            const startValues = {};
            const endValues = {};
            
            // Get start values and set end values
            for (let prop in properties) {
                startValues[prop] = getComputedStyle(element)[prop];
                endValues[prop] = properties[prop];
            }
            
            element.style.transition = `all ${duration}ms ${easing}`;
            
            // Apply end values
            for (let prop in endValues) {
                element.style[prop] = endValues[prop];
            }
            
            // Clean up after animation
            setTimeout(() => {
                element.style.transition = '';
                resolve();
            }, duration);
        });
    },
    
    /**
     * Shake an element
     * @param {HTMLElement} element - Element to shake
     */
    shake(element) {
        element.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
};

/**
 * Add CSS for shake animation
 */
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;

// Add shake animation CSS to the document
if (!document.querySelector('#shake-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'shake-animation-styles';
    style.textContent = shakeCSS;
    document.head.appendChild(style);
}

/**
 * Event handler helpers
 */
const EventUtils = {
    /**
     * Add event listener with cleanup
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event type
     * @param {function} handler - Event handler
     * @returns {function} Cleanup function
     */
    on(element, event, handler) {
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    },
    
    /**
     * Add one-time event listener
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event type
     * @param {function} handler - Event handler
     */
    once(element, event, handler) {
        const onceHandler = (e) => {
            handler(e);
            element.removeEventListener(event, onceHandler);
        };
        element.addEventListener(event, onceHandler);
    }
};

// Export for use in other modules
window.ChessUtils = {
    notationToCoords,
    coordsToNotation,
    isValidSquare,
    deepClone,
    getOppositeColor,
    getSquareColor,
    formatTime,
    playSound,
    showNotification,
    showGameEndOverlay,
    debounce,
    generateId,
    Storage,
    Animation,
    EventUtils
};
