class SnakeGame {
    constructor() {
        // Initialize game canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // // Set canvas dimensions
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // Game settings
        this.gridSize = 20;
        this.tileCount = 20;
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        
        // Initialize sound effects
        this.biteSound = document.getElementById('biteSound');
        
        // Snake appearance settings
        this.snakeColors = {
            body: '#4CAF50',     // Main green
            bodyStroke: '#388E3C', // Darker green for outline
            pattern: '#81C784',   // Lighter green for pattern
            eye: '#FFF',         // White eye
            eyePupil: '#000'     // Black pupil
        };
        
        // Initialize game state
        this.gameOver = false;
        this.gameStarted = false;
        
        // Set up restart button
        this.restartButton = document.getElementById('restartButton');
        this.restartButton.addEventListener('click', () => this.resetGame());
        
        // Initialize the game
        this.init();
    }
    
    /**
     * Initialize the game by setting up the snake, food, and event listeners
     */
    init() {
        // Initialize snake (green)
        this.snake = {
            body: [
                { x: 10, y: 10 }  // Starting position
            ],
            dx: 0,               // Initial horizontal velocity
            dy: 0,               // Initial vertical velocity
            pendingDirection: null  // For handling quick direction changes
        };
        
        // Create initial food (red)
        this.placeFood();
        
        // Set up keyboard controls
        this.setupControls();
        
        // Start game loop
        this.lastRenderTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Set up keyboard event listeners for snake control
     */
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted && !this.gameOver && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                this.gameStarted = true;
            }
            
            // Store the next direction to prevent multiple turns in a single frame
            if (e.key === 'ArrowUp' && this.snake.dy === 0) {
                this.snake.pendingDirection = { dx: 0, dy: -1 };
            } else if (e.key === 'ArrowDown' && this.snake.dy === 0) {
                this.snake.pendingDirection = { dx: 0, dy: 1 };
            } else if (e.key === 'ArrowLeft' && this.snake.dx === 0) {
                this.snake.pendingDirection = { dx: -1, dy: 0 };
            } else if (e.key === 'ArrowRight' && this.snake.dx === 0) {
                this.snake.pendingDirection = { dx: 1, dy: 0 };
            }
        });
    }
    
    /**
     * Main game loop that runs the game
     */
    gameLoop(currentTime) {
        requestAnimationFrame((time) => this.gameLoop(time));
        
        // Control game speed
        const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / 8) return; // 8 frames per second
        
        this.lastRenderTime = currentTime;
        
        // If game is over or not started, don't update
        if (this.gameOver || !this.gameStarted) {
            this.render();
            return;
        }
        
        // Update game state
        this.update();
        
        // Render the game
        this.render();
    }
    
    /**
     * Update the game state - move snake, check collisions, handle food
     */
    update() {
        // Apply pending direction change if available
        if (this.snake.pendingDirection) {
            this.snake.dx = this.snake.pendingDirection.dx;
            this.snake.dy = this.snake.pendingDirection.dy;
            this.snake.pendingDirection = null;
        }
        
        // If the snake isn't moving yet, don't update
        if (this.snake.dx === 0 && this.snake.dy === 0) return;
        
        // Move the snake by creating a new head
        const head = { 
            x: this.snake.body[0].x + this.snake.dx,
            y: this.snake.body[0].y + this.snake.dy
        };
        
        // Add new head to the beginning of snake body
        this.snake.body.unshift(head);
        
        // Check if snake got the food
        if (this.isEatingFood()) {
            // Play bite sound effect when food is eaten
            this.playBiteSound();
            
            // Increase score
            this.score++;
            this.scoreElement.textContent = this.score;
            
            // Place new food
            this.placeFood();
        } else {
            // Remove the last part of the snake if it didn't eat food
            this.snake.body.pop();
        }
        
        // Check for collisions
        this.checkCollisions();
    }
    
    /**
     * Render the game - draw snake, food, and game over message
     */
    render() {
        // Clear the canvas
        this.ctx.fillStyle = 'brown'; // Background color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw the snake
        this.drawSnake();
        
        // Draw the food
        this.drawFood();
        
        // Draw game over message if game is over
        if (this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press Restart to play again', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
        
        // Draw start message if game hasn't started
        if (!this.gameStarted && !this.gameOver) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press an arrow key to start', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    /**
     * Draw the snake with a more realistic snake-like appearance
     */
    drawSnake() {
        const body = this.snake.body;
        const size = this.gridSize;
        
        // Draw each segment of the snake
        for (let i = 0; i < body.length; i++) {
            const segment = body[i];
            const x = segment.x * size;
            const y = segment.y * size;
            const segmentSize = size - 2;
            
            // Determine if this is the head
            const isHead = i === 0;
            
            if (isHead) {
                this.drawSnakeHead(x, y, segmentSize);
            } else {
                this.drawSnakeSegment(x, y, segmentSize, i, body);
            }
        }
    }
    
    /**
     * Draw the snake's head with eyes and details
     */
    drawSnakeHead(x, y, size) {
        const ctx = this.ctx;
        const halfSize = size / 2;
        const centerX = x + halfSize;
        const centerY = y + halfSize;
        
        // Direction the snake is facing
        const dx = this.snake.dx;
        const dy = this.snake.dy;
        
        // Draw head (circular)
        ctx.fillStyle = this.snakeColors.body;
        ctx.beginPath();
        ctx.arc(centerX, centerY, halfSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add stroke
        ctx.strokeStyle = this.snakeColors.bodyStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // If snake isn't moving yet, draw eyes looking forward
        if (dx === 0 && dy === 0) {
            // Default eyes (looking right)
            this.drawSnakeEyes(centerX, centerY, halfSize, 1, 0);
        } else {
            // Draw eyes based on movement direction
            this.drawSnakeEyes(centerX, centerY, halfSize, dx, dy);
        }
    }
    
    /**
     * Draw the eyes on the snake's head based on direction
     */
    drawSnakeEyes(centerX, centerY, radius, dx, dy) {
        const ctx = this.ctx;
        const eyeOffset = radius * 0.5;
        
        // Position eyes based on direction
        let eyeX1, eyeY1, eyeX2, eyeY2;
        
        if (dx === 1) { // Right
            eyeX1 = centerX + eyeOffset;
            eyeY1 = centerY - eyeOffset;
            eyeX2 = centerX + eyeOffset;
            eyeY2 = centerY + eyeOffset;
        } else if (dx === -1) { // Left
            eyeX1 = centerX - eyeOffset;
            eyeY1 = centerY - eyeOffset;
            eyeX2 = centerX - eyeOffset;
            eyeY2 = centerY + eyeOffset;
        } else if (dy === -1) { // Up
            eyeX1 = centerX - eyeOffset;
            eyeY1 = centerY - eyeOffset;
            eyeX2 = centerX + eyeOffset;
            eyeY2 = centerY - eyeOffset;
        } else if (dy === 1) { // Down
            eyeX1 = centerX - eyeOffset;
            eyeY1 = centerY + eyeOffset;
            eyeX2 = centerX + eyeOffset;
            eyeY2 = centerY + eyeOffset;
        } else { // Default (right)
            eyeX1 = centerX + eyeOffset;
            eyeY1 = centerY - eyeOffset;
            eyeX2 = centerX + eyeOffset;
            eyeY2 = centerY + eyeOffset;
        }
        
        // Draw eyes
        const eyeRadius = radius * 0.25;
        const pupilRadius = eyeRadius * 0.6;
        
        // First eye
        ctx.fillStyle = this.snakeColors.eye;
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // First pupil
        ctx.fillStyle = this.snakeColors.eyePupil;
        ctx.beginPath();
        ctx.arc(eyeX1, eyeY1, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Second eye
        ctx.fillStyle = this.snakeColors.eye;
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Second pupil
        ctx.fillStyle = this.snakeColors.eyePupil;
        ctx.beginPath();
        ctx.arc(eyeX2, eyeY2, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Draw a body segment of the snake with gradually decreasing size
     * Each segment is 10% smaller than the one before it
     */
    drawSnakeSegment(x, y, size, index, body) {
        const ctx = this.ctx;
        
        // Calculate segment size (10% smaller for each segment)
        const scaleFactor = Math.pow(0.9, index); // Each segment is 90% the size of the previous one
        const adjustedSize = size * scaleFactor;
        const halfSize = adjustedSize / 2;
        
        // Adjust center position to maintain alignment with the grid
        const centerX = x + (size / 2); // Use original grid size for center calculation
        const centerY = y + (size / 2);
        
        // Draw segment with rounded shape
        ctx.fillStyle = this.snakeColors.body;
        ctx.beginPath();
        ctx.arc(centerX, centerY, halfSize - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = this.snakeColors.bodyStroke;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add a pattern to every other segment
        if (index % 2 === 0) {
            this.drawSnakePattern(centerX, centerY, halfSize - 2);
        }
    }
    
    /**
     * Draw a pattern on the snake segment for more visual detail
     */
    drawSnakePattern(centerX, centerY, radius) {
        const ctx = this.ctx;
        
        // Draw a diamond pattern
        ctx.fillStyle = this.snakeColors.pattern;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius * 0.6);
        ctx.lineTo(centerX + radius * 0.6, centerY);
        ctx.lineTo(centerX, centerY + radius * 0.6);
        ctx.lineTo(centerX - radius * 0.6, centerY);
        ctx.fill();
    }
    
    /**
     * Draw the food with a rounded appearance
     */
    drawFood() {
        const ctx = this.ctx;
        const size = this.gridSize - 2;
        const x = this.food.x * this.gridSize;
        const y = this.food.y * this.gridSize;
        const halfSize = size / 2;
        
        // Draw a red circular food
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(x + halfSize, y + halfSize, halfSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a highlight for 3D effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x + halfSize * 0.7, y + halfSize * 0.7, halfSize * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Check if the snake is eating food
     */
    isEatingFood() {
        const head = this.snake.body[0];
        return head.x === this.food.x && head.y === this.food.y;
    }
    
    /**
     * Place food at a random position not occupied by the snake
     */
    placeFood() {
        // Generate a random position
        const getRandomPosition = () => {
            return {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        };
        
        // Ensure food doesn't appear on the snake
        let position;
        let onSnake;
        
        do {
            position = getRandomPosition();
            onSnake = this.snake.body.some(segment => {
                return segment.x === position.x && segment.y === position.y;
            });
        } while (onSnake);
        
        this.food = position;
    }
    
    /**
     * Check for collisions with walls or self
     */
    checkCollisions() {
        const head = this.snake.body[0];
        
        // Check wall collisions
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver = true;
            return;
        }
        
        // Check self collisions (start from index 1 to skip the head)
        for (let i = 1; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                this.gameOver = true;
                return;
            }
        }
    }
    
    /**
     * Play the bite sound effect when snake eats food
     */
    playBiteSound() {
        // Reset the audio to the beginning
        this.biteSound.currentTime = 0;
        
        // Play the bite sound
        this.biteSound.play().catch(error => {
            // Handle any errors or browser autoplay policies
            console.log('Sound playback failed:', error);
        });
    }
    
    /**
     * Reset the game to initial state
     */
    resetGame() {
        this.score = 0;
        this.scoreElement.textContent = this.score;
        this.gameOver = false;
        this.gameStarted = false;
        
        // Reset snake
        this.snake = {
            body: [{ x: 10, y: 10 }],
            dx: 0,
            dy: 0,
            pendingDirection: null
        };
        
        // Create new food
        this.placeFood();
    }
}

// Initialize the game when the window loads
window.onload = () => {
    const game = new SnakeGame();
};