const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

// Game states
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

let currentState = GAME_STATES.MENU;

// Menu system
function drawMenu() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.font = '32px "Press Start 2P"';
    ctx.textAlign = 'center';
    
    // Draw title
    ctx.fillStyle = '#39FF14';
    ctx.fillText('TETRIS', canvas.width/2, 100);
    
    // Draw menu options
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#FFF';
    ctx.fillText('Press SPACE to Start', canvas.width/2, 200);
    ctx.fillText('Press P to Pause', canvas.width/2, 250);
    ctx.fillText('Use Arrow Keys', canvas.width/2, 300);
}

// Handle input
document.addEventListener('keydown', (e) => {
    if (currentState === GAME_STATES.MENU) {
        if (e.code === 'Space') {
            currentState = GAME_STATES.PLAYING;
            startGame();
        }
    }
});

// Game loop
function gameLoop() {
    if (currentState === GAME_STATES.MENU) {
        drawMenu();
    } else if (currentState === GAME_STATES.PLAYING) {
        // Your game logic here
        drawGame();
    }
    
    requestAnimationFrame(gameLoop);
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Your game drawing code here
    ctx.fillStyle = '#39FF14';
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('Game Running...', canvas.width/2, canvas.height/2);
}

function startGame() {
    console.log('Game started!');
    // Initialize your game here
}

// Start the game loop
gameLoop();