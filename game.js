class Game2048 {
    constructor(gridSize = 4) {
        this.gridSize = gridSize;
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.isAnimating = false;
        this.difficulty = 'easy';
        this.lastAddedTile = null;
        this.initializeGrid();
        this.setupEventListeners();
        this.updateScoreDisplay();
        this.spawnInitialTiles();
    }

    initializeGrid() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        this.grid = Array.from({ length: this.gridSize }, () => 
            Array(this.gridSize).fill(0)
        );
        
        // Create empty grid cells
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                gridElement.appendChild(cell);
            }
        }
    }

    createTile(row, col, value, isNew = false) {
        const tile = document.createElement('div');
        
        // Calculate position
        const spacing = 15;
        const tileSize = 106.25;
        const x = col * (tileSize + spacing);
        const y = row * (tileSize + spacing);
        
        // Set position using left/top instead of transform
        tile.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${tileSize}px;
            height: ${tileSize}px;
        `;
        
        tile.classList.add('tile', `tile-${value}`);
        tile.textContent = value;
        
        if (isNew) {
            tile.classList.add('new-tile');
            setTimeout(() => tile.classList.remove('new-tile'), 200);
        }
        
        document.getElementById('grid').appendChild(tile);
        return tile;
    }

    updateDisplay() {
        // Remove all existing tiles
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());

        // Create tiles for all values in the grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const value = this.grid[row][col];
                if (value !== 0) {
                    // Mark tiles that were just added as new
                    const isNew = this.lastAddedTile && 
                                this.lastAddedTile.row === row && 
                                this.lastAddedTile.col === col;
                    this.createTile(row, col, value, isNew);
                }
            }
        }
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) {
                    emptyCells.push({row, col});
                }
            }
        }

        if (emptyCells.length > 0) {
            const {row, col} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = this.getSpawnValue();
            this.grid[row][col] = value;
            this.lastAddedTile = {row, col}; // Track the last added tile
        }
    }

    move(direction) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const previousGrid = JSON.stringify(this.grid);
        let moved = false;

        switch(direction) {
            case 'up': moved = this.moveUp(); break;
            case 'down': moved = this.moveDown(); break;
            case 'left': moved = this.moveLeft(); break;
            case 'right': moved = this.moveRight(); break;
        }

        if (moved && JSON.stringify(this.grid) !== previousGrid) {
            this.lastAddedTile = null;
            this.addRandomTile();
            this.updateDisplay();
            this.updateScoreDisplay();
            this.checkGameStatus();
            setTimeout(() => {
                this.isAnimating = false;
            }, 150);
        } else {
            this.isAnimating = false;
        }
    }

    moveLeft() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const currentRow = this.grid[row].filter(cell => cell !== 0);
            const mergedRow = this.mergeTiles(currentRow);
            const newRow = [...mergedRow, ...Array(this.gridSize - mergedRow.length).fill(0)];
            
            if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                moved = true;
                this.grid[row] = newRow;
            }
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let row = 0; row < this.gridSize; row++) {
            const currentRow = this.grid[row].filter(cell => cell !== 0);
            const mergedRow = this.mergeTiles(currentRow);
            const newRow = [...Array(this.gridSize - mergedRow.length).fill(0), ...mergedRow];
            
            if (JSON.stringify(newRow) !== JSON.stringify(this.grid[row])) {
                moved = true;
                this.grid[row] = newRow;
            }
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const currentCol = [];
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== 0) {
                    currentCol.push(this.grid[row][col]);
                }
            }
            
            const mergedCol = this.mergeTiles(currentCol);
            const newCol = [...mergedCol, ...Array(this.gridSize - mergedCol.length).fill(0)];
            
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== newCol[row]) {
                    moved = true;
                    this.grid[row][col] = newCol[row];
                }
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let col = 0; col < this.gridSize; col++) {
            const currentCol = [];
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== 0) {
                    currentCol.push(this.grid[row][col]);
                }
            }
            
            const mergedCol = this.mergeTiles(currentCol);
            const newCol = [...Array(this.gridSize - mergedCol.length).fill(0), ...mergedCol];
            
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] !== newCol[row]) {
                    moved = true;
                    this.grid[row][col] = newCol[row];
                }
            }
        }
        return moved;
    }

    mergeTiles(tiles) {
        const merged = [];
        for (let i = 0; i < tiles.length; i++) {
            if (i < tiles.length - 1 && tiles[i] === tiles[i + 1]) {
                const mergedValue = tiles[i] * 2;
                merged.push(mergedValue);
                this.updateScore(mergedValue);
                i++;
            } else {
                merged.push(tiles[i]);
            }
        }
        return merged;
    }

    updateScore(points) {
        this.score += points;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
        }
    }

    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
    }

    getSpawnValue() {
        const rand = Math.random();
        switch(this.difficulty) {
            case 'easy': return rand < 0.9 ? 2 : 4;
            case 'medium': return rand < 0.7 ? 2 : 4;
            case 'hard': return rand < 0.5 ? 2 : 4;
            default: return rand < 0.9 ? 2 : 4;
        }
    }

    checkGameStatus() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 2048) {
                    alert('Congratulations! You won!');
                    return;
                }
            }
        }

        if (!this.canMove()) {
            alert('Game Over! No more moves possible.');
        }
    }

    canMove() {
        // Check for empty cells
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === 0) return true;
            }
        }

        // Check for possible merges
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const current = this.grid[row][col];
                if (col < this.gridSize - 1 && current === this.grid[row][col + 1]) return true;
                if (row < this.gridSize - 1 && current === this.grid[row + 1][col]) return true;
            }
        }
        return false;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.resetGame();
    }

    resetGame() {
        this.grid = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(0));
        this.score = 0;
        this.lastAddedTile = null;
        this.updateScoreDisplay();
        this.updateDisplay();
        this.spawnInitialTiles();
    }

    spawnInitialTiles() {
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.move('up'); break;
                case 'ArrowDown': this.move('down'); break;
                case 'ArrowLeft': this.move('left'); break;
                case 'ArrowRight': this.move('right'); break;
            }
        });

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setDifficulty(btn.dataset.difficulty);
            });
        });

        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
