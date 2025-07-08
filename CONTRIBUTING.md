# Contributing to Chess Game

Thank you for your interest in contributing to this chess game project! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Getting Started

1. Fork the repository
2. Clone your fork to your local machine
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor or IDE (VS Code recommended)
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

2. Open `index.html` in your browser or serve with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

## Code Style

### JavaScript

- Use ES6+ features when possible
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing code structure

Example:
```javascript
/**
 * Calculate valid moves for a chess piece
 * @param {ChessPiece} piece - The piece to calculate moves for
 * @param {Array} board - Current board state
 * @returns {Array} Array of valid move coordinates
 */
function calculateValidMoves(piece, board) {
    // Implementation here
}
```

### CSS

- Use CSS custom properties (variables) for consistent theming
- Follow BEM naming convention for classes
- Use meaningful class names
- Group related styles together
- Add comments for complex styles

Example:
```css
/* Chess board squares */
.square {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.square--selected {
    background-color: var(--accent-primary);
}
```

### HTML

- Use semantic HTML5 elements
- Include proper alt text for images
- Use meaningful id and class names
- Ensure accessibility compliance

## Making Changes

### Feature Development

1. Create a new branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes in small, logical commits
3. Test your changes thoroughly
4. Update documentation if necessary

### Bug Fixes

1. Create a new branch from `main`:
```bash
git checkout -b bugfix/issue-description
```

2. Fix the bug
3. Add tests if applicable
4. Verify the fix works correctly

### Commit Messages

Write clear, descriptive commit messages:

- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Include more details in the body if necessary

Good examples:
```
Add castling move validation
Fix piece selection on mobile devices
Update README with installation instructions
```

## Testing

### Manual Testing

Before submitting changes, test the following:

- [ ] All piece movements work correctly
- [ ] Game rules are enforced (check, checkmate, stalemate)
- [ ] UI is responsive on different screen sizes
- [ ] No JavaScript errors in console
- [ ] Game can be reset and restarted
- [ ] Move history is accurate
- [ ] Captured pieces are displayed correctly

### Browser Testing

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

### Mobile Testing

Test on mobile devices or using browser dev tools:
- [ ] Touch interactions work properly
- [ ] Layout is responsive
- [ ] Performance is acceptable

## Submitting Changes

1. Push your branch to your fork:
```bash
git push origin feature/your-feature-name
```

2. Create a pull request against the `main` branch

3. Fill out the pull request template with:
   - Description of changes
   - Testing performed
   - Screenshots (if UI changes)
   - Related issues

4. Wait for review and address any feedback

## Reporting Issues

When reporting bugs or requesting features, please include:

### Bug Reports

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and version
- Screenshots or videos if helpful

### Feature Requests

- Clear description of the feature
- Use case or motivation
- Proposed implementation (if any)
- Mockups or wireframes (if applicable)

## Project Structure

```
chess-game/
├── index.html          # Main HTML file
├── css/
│   ├── styles.css      # Main styles
│   ├── board.css       # Chess board styles
│   └── pieces.css      # Chess pieces styles
├── js/
│   ├── main.js         # Main application logic
│   ├── board.js        # Board management
│   ├── pieces.js       # Piece definitions and movement
│   ├── game.js         # Game state management
│   └── utils.js        # Utility functions
├── assets/             # Images and other assets
├── docs/               # Documentation
└── tests/              # Test files (future)
```

## Feature Roadmap

### Planned Features

- [ ] Chess AI opponent
- [ ] Online multiplayer
- [ ] Chess notation import/export
- [ ] Game analysis tools
- [ ] Time controls
- [ ] Tournament mode
- [ ] Themes and customization
- [ ] Sound effects
- [ ] Accessibility improvements

### Technical Improvements

- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Code splitting
- [ ] Progressive Web App features
- [ ] Offline mode

## Getting Help

If you need help or have questions:

1. Check existing issues and documentation
2. Create a new issue with the "question" label
3. Join our community discussions (if available)

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to this project! 🎉
