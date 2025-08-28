/**
 * TETRIS GAME
 * Created by Sandesh Thapa
 * 

/**
 * Sets audio volumes with quadratic scaling for better perceived volume control
 * Music tracks get slightly lower volume to balance with sound effects
 */
function setAudioVolumes() {
    const actualMusicVolume = musicEnabled ? (musicVolume * musicVolume * 0.3) : 0;
    const actualSoundVolume = soundEnabled ? 0.3 : 0;
    
    // Set menu music volume
    AUDIO.menuMusic.volume = actualMusicVolume;
    
    // Set game music volumes
    GAME_MUSIC_TRACKS.forEach(trackName => {
        if (AUDIO[trackName]) {
            AUDIO[trackName].volume = actualMusicVolume * 0.8;
        }
    });
    
    // Set sound effect volumes
    Object.keys(AUDIO).forEach(key => {
        if (!key.includes('Music') && !GAME_MUSIC_TRACKS.includes(key)) {
            AUDIO[key].volume = actualSoundVolume;
        }
    });
}

// ================================================================================================
// CANVAS & GAME CONSTANTS
// ================================================================================================

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

// Game state management
const GAME_STATES = {
    MENU: 'menu',
    OPTIONS: 'options',
    ABOUT: 'about',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// Core game dimensions and timing
const BOARD_WIDTH = 10;           // Standard Tetris board width
const BOARD_HEIGHT = 20;          // Standard Tetris board height
const LINES_PER_LEVEL = 10;       // Lines needed to advance level
const BASE_DROP_INTERVAL = 1000;  // Starting drop speed in milliseconds

// ================================================================================================
// AUDIO SYSTEM
// ================================================================================================

// Audio file declarations - all game sounds and music
const AUDIO = {
    // Background music
    menuMusic: new Audio('assets/menu-music.mp3'),
    gameMusic1: new Audio('assets/bgm1.mp3'),
    gameMusic2: new Audio('assets/bgm2.mp3'),
    gameMusic3: new Audio('assets/bgm3.mp3'),
    gameMusic4: new Audio('assets/bgm4.mp3'),
    gameMusic5: new Audio('assets/bgm5.mp3'),
    
    // Sound effects
    move: new Audio('assets/move.wav'),
    rotate: new Audio('assets/rotate.wav'),
    drop: new Audio('assets/drop.wav'),
    lock: new Audio('assets/lock.wav'),
    lineClear: new Audio('assets/line-clear.wav'),
    tetris: new Audio('assets/tetris.wav'),
    levelUp: new Audio('assets/level-up.wav'),
    gameOver: new Audio('assets/game-over.wav'),
    menuSelect: new Audio('assets/menu-select.wav'),
    menuMove: new Audio('assets/menu-move.wav')
};

// Random music system configuration
const GAME_MUSIC_TRACKS = ['gameMusic1', 'gameMusic2', 'gameMusic3', 'gameMusic4', 'gameMusic5'];
let currentGameTrack = null;     // Currently playing game music track
let lastPlayedTrack = null;      // Last played track (to avoid repeats)

// Audio settings and state
let musicEnabled = true;         // Master music toggle
let soundEnabled = true;         // Master sound effects toggle
let musicVolume = 0.3;          // Music volume (0.0 to 1.0)
let audioInitialized = false;   // Browser audio permission flag

AUDIO.menuMusic.loop = true;     // Menu music loops continuously

function setAudioVolumes() {
    const actualMusicVolume = musicEnabled ? (musicVolume * musicVolume * 0.3) : 0;
    const actualSoundVolume = soundEnabled ? 0.3 : 0;
    
    AUDIO.menuMusic.volume = actualMusicVolume;
    GAME_MUSIC_TRACKS.forEach(trackName => {
        if (AUDIO[trackName]) {
            AUDIO[trackName].volume = actualMusicVolume * 0.8;
        }
    });
    
    Object.keys(AUDIO).forEach(key => {
        if (!key.includes('Music') && !GAME_MUSIC_TRACKS.includes(key)) {
            AUDIO[key].volume = actualSoundVolume;
        }
    });
}

/**
 * Plays a sound effect if sound is enabled
 * Resets currentTime to allow overlapping sounds
 */
function playSound(soundName) {
    if (soundEnabled && AUDIO[soundName]) {
        AUDIO[soundName].currentTime = 0;
        AUDIO[soundName].play().catch(() => {});
    }
}

/**
 * Main music playback controller
 * Handles menu music and triggers random game music
 */
function playMusic(musicName) {
    if (!musicEnabled) return;
    
    if (musicName === 'menuMusic') {
        stopAllMusic();
        AUDIO.menuMusic.play().catch(() => {});
    } else if (musicName === 'gameMusic') {
        playRandomGameMusic();
    }
}

/**
 * Random game music system - prevents repeating the same track twice
 * Automatically chains to next random track when current song ends
 * Includes error handling for failed audio loads
 */
function playRandomGameMusic() {
    if (!musicEnabled) return;
    
    stopAllMusic();
    
    // Avoid repeating the same track consecutively
    let availableTracks = [...GAME_MUSIC_TRACKS];
    if (availableTracks.length > 1 && lastPlayedTrack) {
        availableTracks = availableTracks.filter(track => track !== lastPlayedTrack);
    }
    
    // Select and play random track
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    const trackName = availableTracks[randomIndex];
    lastPlayedTrack = trackName;
    currentGameTrack = AUDIO[trackName];
    
    if (currentGameTrack) {
        currentGameTrack.currentTime = 0;
        const actualMusicVolume = musicEnabled ? (musicVolume * musicVolume * 0.3) : 0;
        currentGameTrack.volume = actualMusicVolume * 0.8;
        
        // Set up auto-play next track when current ends
        currentGameTrack.onended = () => playRandomGameMusic();
        currentGameTrack.onerror = () => {
            // If track fails to load, try again with a delay
            setTimeout(() => {
                lastPlayedTrack = null;
                playRandomGameMusic();
            }, 2000);
        };
        
        currentGameTrack.play().catch(() => {});
    }
}

/**
 * Stops all music tracks and resets their state
 */
function stopAllMusic() {
    AUDIO.menuMusic.pause();
    AUDIO.menuMusic.currentTime = 0;
    
    GAME_MUSIC_TRACKS.forEach(trackName => {
        if (AUDIO[trackName]) {
            AUDIO[trackName].pause();
            AUDIO[trackName].currentTime = 0;
            AUDIO[trackName].onended = null;
        }
    });
    
    currentGameTrack = null;
}

/**
 * Emergency stop for all audio - used when switching game states
 */
function stopAllAudio() {
    Object.values(AUDIO).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
    });
    currentGameTrack = null;
}

/**
 * Updates audio settings and resumes appropriate music for current game state
 * Called when audio settings are changed in options menu
 */
function updateAudioSettings() {
    setAudioVolumes();
    
    if (currentState === GAME_STATES.MENU) {
        if (musicEnabled && AUDIO.menuMusic.paused) {
            AUDIO.menuMusic.play().catch(() => {});
        } else if (!musicEnabled && !AUDIO.menuMusic.paused) {
            AUDIO.menuMusic.pause();
        }
    } else if (currentState === GAME_STATES.PLAYING) {
        if (musicEnabled && (!currentGameTrack || currentGameTrack.paused)) {
            playRandomGameMusic();
        } else if (!musicEnabled && currentGameTrack && !currentGameTrack.paused) {
            stopAllMusic();
        }
    }
}

/**
 * Initializes audio system after first user interaction
 * Required due to browser autoplay policies
 */
function initializeAudio() {
    if (audioInitialized) return;
    audioInitialized = true;
    setAudioVolumes();
    
    if (currentState === GAME_STATES.MENU) {
        playMusic('menuMusic');
    }
}

// ================================================================================================
// GAME STATE & VARIABLES
// ================================================================================================

let currentState = GAME_STATES.MENU;  // Current game state
let selectedMenuItem = 0;              // Currently selected menu item
let selectedOptionItem = 0;            // Currently selected option item
let controlScheme = 'arrow';           // Control scheme: 'arrow' or 'wasd'

// Menu configuration
const menuItems = ['Start', 'Options', 'About'];
const optionItems = ['Controls', 'Music', 'Sounds', 'Volume', 'Back'];

// Core game state variables
let gameBoard = [];          // 2D array representing the game board
let currentPiece = null;     // Currently falling piece
let nextPiece = null;        // Next piece to spawn
let dropTime = 0;           // Last time piece dropped automatically
let dropInterval = 1000;    // Current drop interval (decreases with level)
let score = 0;              // Current score
let lines = 0;              // Total lines cleared
let level = 1;              // Current level

// Classic Tetris DAS (Delayed Auto Shift) system
let keysPressed = new Set();    // Currently pressed keys
let keyTimers = new Map();      // Timers for key auto-repeat
const DAS_DELAY = 250;          // Initial delay before auto-repeat (ms)
const DAS_SPEED = 50;           // Auto-repeat interval (ms)

const SCORING = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

const BLOCKS = {
    I: { shape: [[1,1,1,1]], color: '#00f0f0' },
    O: { shape: [[1,1],[1,1]], color: '#f0f000' },
    T: { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },
    S: { shape: [[0,1,1],[1,1,0]], color: '#00f000' },
    Z: { shape: [[1,1,0],[0,1,1]], color: '#f00000' },
    J: { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },
    L: { shape: [[0,0,1],[1,1,1]], color: '#f0a000' }
};

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

/**
 * Calculates block size based on canvas dimensions
 */
function calculateBlockSize() {
    return {
        width: canvas.width / BOARD_WIDTH,
        height: canvas.height / BOARD_HEIGHT
    };
}

/**
 * Gets rendering offsets and block dimensions for the game board
 */
function getBoardOffsets() {
    const blockSizes = calculateBlockSize();
    return {
        x: 0,
        y: 0,
        blockWidth: blockSizes.width,
        blockHeight: blockSizes.height
    };
}

/**
 * Updates the UI elements with current game statistics
 */
function updateUI() {
    document.querySelector('.score-value').textContent = score;
    document.querySelector('.lines-value').textContent = lines;
    document.querySelector('.level-value').textContent = level;
}

/**
 * Adds points to score with level multiplier
 */
function addScore(points) {
    score += points * level;
    updateUI();
}

/**
 * Adds cleared lines and handles level progression
 * Increases game speed with each level
 */
function addLines(linesCleared) {
    lines += linesCleared;
    
    const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropInterval = Math.max(50, BASE_DROP_INTERVAL - (level - 1) * 50); // Speed increases
        playSound('levelUp');
    }
    
    updateUI();
}

/**
 * Resets all game statistics to starting values
 */
function resetGame() {
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = BASE_DROP_INTERVAL;
    updateUI();
}

/**
 * Draws the next piece in the preview canvas
 * Centers the piece within the small preview area
 */
function drawNextPiece() {
    if (!nextPiece) return;
    
    const nextCanvas = document.getElementById('nextBlockCanvas');
    const nextCtx = nextCanvas.getContext('2d');
    
    // Clear the preview canvas
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const blockSize = 15;
    const shape = nextPiece.shape;
    // Center the piece in the preview canvas
    const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
    
    // Draw the next piece
    nextCtx.fillStyle = nextPiece.color;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                nextCtx.fillRect(
                    offsetX + x * blockSize,
                    offsetY + y * blockSize,
                    blockSize - 1,
                    blockSize - 1
                );
            }
        }
    }
}

// ================================================================================================
// MENU SYSTEM
// ================================================================================================

/**
 * Draws the main menu screen with navigation instructions
 */
function drawMenu() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game title
    ctx.font = '22px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3eb7ca';
    ctx.fillText('TETRIS', canvas.width / 2, 100);
    
    // Menu items with selection highlighting
    for (let i = 0; i < menuItems.length; i++) {
        ctx.fillStyle = selectedMenuItem === i ? '#fff' : '#666';
        ctx.fillText(menuItems[i], canvas.width / 2, 200 + i * 50);
    }
    
    // Navigation instructions
    ctx.fillStyle = '#3eb7ca';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Use ↑/↓ or W/S to navigate', canvas.width / 2, 400);
    ctx.fillText('Press ENTER or SPACE to select', canvas.width / 2, 430);
    
    // Audio initialization prompt (shows until first interaction)
    if (!audioInitialized) {
        ctx.fillStyle = '#f0a000';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('Press any key to enable audio', canvas.width / 2, 470);
    }
}

/**
 * Draws the options/controls menu with current settings
 */
function drawControls() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Options title
    ctx.font = '22px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3eb7ca';
    ctx.fillText('OPTIONS', canvas.width / 2, 100);
    
    // Option items with current values
    for (let i = 0; i < optionItems.length; i++) {
        ctx.fillStyle = selectedOptionItem === i ? '#fff' : '#666';
        let text = optionItems[i];
        
        // Append current setting values
        if (i === 0) text += ': ' + (controlScheme === 'arrow' ? 'ARROWS' : 'WASD');
        if (i === 1) text += ': ' + (musicEnabled ? 'ON' : 'OFF');
        if (i === 2) text += ': ' + (soundEnabled ? 'ON' : 'OFF');
        if (i === 3) text += ': ' + Math.round(musicVolume * 100) + '%';
        
        ctx.fillText(text, canvas.width / 2, 180 + i * 40);
    }
    
    // Control scheme help text
    ctx.fillStyle = '#3eb7ca';
    ctx.font = '10px "Press Start 2P"';
    const controlText = controlScheme === 'arrow'
        ? 'Arrow Keys: ← → Move, ↑ Rotate, ↓ Drop'
        : 'WASD: A D Move, W Rotate, S Drop';
    ctx.fillText(controlText, canvas.width / 2, 420);
    ctx.fillText('C: Reverse Rotate', canvas.width / 2, 440);
    ctx.fillText('SPACE: Hard Drop, P: Pause', canvas.width / 2, 460);
    ctx.fillText('Use ← → to adjust volume', canvas.width / 2, 480);
}

/**
 * Draws the about screen with game information
 */
function drawAbout() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3eb7ca';
    ctx.fillText('ABOUT', canvas.width / 2, 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = '16px "Press Start 2P"';
    ctx.fillText('Tetris', canvas.width / 2, 180);
    
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('A classic Tetris game.', canvas.width / 2, 240);
    ctx.fillText('Built with HTML, CSS, Canvas', canvas.width / 2, 260);
    ctx.fillText('and JavaScript.', canvas.width / 2, 280);
    ctx.fillText('Created by Sandesh Thapa', canvas.width / 2, 360);
    
    ctx.fillStyle = '#3eb7ca';
    ctx.fillText('Press ESC or ENTER to go back', canvas.width / 2, 400);
}

/**
 * Draws the pause screen overlay on top of the game
 */
function drawPauseScreen() {
    drawGame(); // Draw game state underneath
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pause text and instructions
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Press ESC for menu', canvas.width / 2, canvas.height / 2 + 70);
}

/**
 * Draws the game over screen overlay
 */
function drawGameOver() {
    drawGame(); // Show final game state underneath
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game over text and options
    ctx.fillStyle = '#f00';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Press ENTER to play again', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Press ESC for menu', canvas.width / 2, canvas.height / 2 + 70);
}

// ================================================================================================
// INPUT HANDLING
// ================================================================================================

/**
 * Main keyboard input handler with DAS (Delayed Auto Shift) system
 * Differentiates between movement keys (repeatable) and action keys (single press)
 */
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (!audioInitialized) {
        initializeAudio();
    }
    
    // Handle repeating keys (movement) vs non-repeating keys (rotation, etc.)
    const isMovementKey = isMovementInput(key);
    
    if (!isMovementKey && keysPressed.has(key)) return;
    if (!keysPressed.has(key)) {
        keysPressed.add(key);
        handleInput(key, true);
        
        if (isMovementKey) {
            // Set up auto-repeat for movement keys
            keyTimers.set(key, setTimeout(() => {
                startAutoRepeat(key);
            }, DAS_DELAY));
        }
    }
});

/**
 * Key release handler - stops auto-repeat timers
 */
document.addEventListener('keyup', function(event) {
    const key = event.key;
    keysPressed.delete(key);
    
    // Clear any auto-repeat timers for this key
    if (keyTimers.has(key)) {
        clearTimeout(keyTimers.get(key));
        keyTimers.delete(key);
    }
});

/**
 * Determines if a key should have auto-repeat behavior
 * Movement keys repeat, action keys (rotation, hard drop) don't
 */
function isMovementInput(key) {
    const movementKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'a', 'A', 'd', 'D', 's', 'S'];
    return movementKeys.includes(key);
}

/**
 * Handles auto-repeat for movement keys after initial DAS delay
 */
function startAutoRepeat(key) {
    if (keysPressed.has(key)) {
        handleInput(key, false); // Subsequent presses (not first)
        keyTimers.set(key, setTimeout(() => startAutoRepeat(key), DAS_SPEED));
    }
}

function handleInput(key, isFirstPress) {
    switch (currentState) {
        case GAME_STATES.MENU: handleMenuInput(key); break;
        case GAME_STATES.OPTIONS: handleOptionsInput(key); break;
        case GAME_STATES.ABOUT: handleAboutInput(key); break;
        case GAME_STATES.PLAYING: handleGameInput(key, isFirstPress); break;
        case GAME_STATES.PAUSED: handlePauseInput(key); break;
        case GAME_STATES.GAME_OVER: handleGameOverInput(key); break;
    }
}

function handleMenuInput(key) {
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        selectedMenuItem = (selectedMenuItem - 1 + menuItems.length) % menuItems.length;
        playSound('menuMove');
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        selectedMenuItem = (selectedMenuItem + 1) % menuItems.length;
        playSound('menuMove');
    } else if (key === 'Enter' || key === ' ') {
        playSound('menuSelect');
        switch (selectedMenuItem) {
            case 0: currentState = GAME_STATES.PLAYING; startGame(); break;
            case 1: currentState = GAME_STATES.OPTIONS; selectedOptionItem = 0; break;
            case 2: currentState = GAME_STATES.ABOUT; break;
        }
    }
}

function handleOptionsInput(key) {
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        selectedOptionItem = (selectedOptionItem - 1 + optionItems.length) % optionItems.length;
        playSound('menuMove');
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        selectedOptionItem = (selectedOptionItem + 1) % optionItems.length;
        playSound('menuMove');
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (selectedOptionItem === 3) {
            musicVolume = Math.max(0, musicVolume - 0.05);
            updateAudioSettings();
            playSound('menuMove');
        }
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (selectedOptionItem === 3) {
            musicVolume = Math.min(1, musicVolume + 0.05);
            updateAudioSettings();
            playSound('menuMove');
        }
    } else if (key === 'Enter' || key === ' ') {
        playSound('menuSelect');
        switch (selectedOptionItem) {
            case 0: controlScheme = controlScheme === 'arrow' ? 'wasd' : 'arrow'; break;
            case 1: musicEnabled = !musicEnabled; updateAudioSettings(); break;
            case 2: soundEnabled = !soundEnabled; updateAudioSettings(); break;
            case 3: break;
            case 4: currentState = GAME_STATES.MENU; selectedMenuItem = 0; break;
        }
    } else if (key === 'Escape') {
        playSound('menuSelect');
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    }
}

function handleAboutInput(key) {
    if (key === 'Escape' || key === 'Enter') {
        playSound('menuSelect');
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    }
}

function handleGameInput(key, isFirstPress) {
    if (key === 'Escape') {
        playSound('menuSelect');
        stopAllAudio();
        playMusic('menuMusic');
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    } else if (key === 'p' || key === 'P') {
        playSound('menuSelect');
        currentState = GAME_STATES.PAUSED;
    } else if (controlScheme === 'arrow') {
        if (key === 'ArrowLeft') { movePiece(-1, 0, false); playSound('move'); }
        else if (key === 'ArrowRight') { movePiece(1, 0, false); playSound('move'); }
        else if (key === 'ArrowDown') { movePiece(0, 1, true); playSound('drop'); } // Manual soft drop
        else if ((key === 'ArrowUp') && isFirstPress) { rotatePiece(); playSound('rotate'); }
        else if ((key === 'c' || key === 'C') && isFirstPress) { reverseRotate(); playSound('rotate'); }
        else if ((key === ' ') && isFirstPress) { hardDrop(); playSound('lock'); }
    } else {
        if (key === 'a' || key === 'A') { movePiece(-1, 0, false); playSound('move'); }
        else if (key === 'd' || key === 'D') { movePiece(1, 0, false); playSound('move'); }
        else if (key === 's' || key === 'S') { movePiece(0, 1, true); playSound('drop'); } // Manual soft drop
        else if ((key === 'w' || key === 'W') && isFirstPress) { rotatePiece(); playSound('rotate'); }
        else if ((key === 'c' || key === 'C') && isFirstPress) { reverseRotate(); playSound('rotate'); }
        else if ((key === ' ') && isFirstPress) { hardDrop(); playSound('lock'); }
    }
}

function handlePauseInput(key) {
    if (key === 'p' || key === 'P') {
        playSound('menuSelect');
        currentState = GAME_STATES.PLAYING;
    } else if (key === 'Escape') {
        playSound('menuSelect');
        stopAllAudio();
        playMusic('menuMusic');
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    }
}

function handleGameOverInput(key) {
    if (key === 'Enter' || key === ' ') {
        currentState = GAME_STATES.PLAYING;
        startGame();
    } else if (key === 'Escape') {
        stopAllAudio();
        playMusic('menuMusic');
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    }
}

// ================================================================================================
// GAME LOGIC
// ================================================================================================

/**
 * Initializes empty game board with zeros
 */
function initializeBoard() {
    gameBoard = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        gameBoard[y] = new Array(BOARD_WIDTH).fill(0);
    }
}

/**
 * Spawns a new piece at the top of the board
 * Uses the next piece if available, otherwise generates random piece
 * Checks for game over condition (piece can't spawn)
 */
function spawnPiece() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    
    // Use next piece if available
    if (nextPiece) {
        currentPiece = {
            shape: nextPiece.shape,
            color: nextPiece.color,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            type: nextPiece.type
        };
    } else {
        // Generate random piece for first spawn
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        currentPiece = {
            shape: BLOCKS[randomPiece].shape,
            color: BLOCKS[randomPiece].color,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            type: randomPiece
        };
    }
    
    // Generate next piece for preview
    const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    nextPiece = {
        shape: BLOCKS[nextRandomPiece].shape,
        color: BLOCKS[nextRandomPiece].color,
        type: nextRandomPiece
    };
    
    drawNextPiece();
    
    // Check if new piece can spawn (game over condition)
    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        stopAllAudio();
        playSound('gameOver');
        currentState = GAME_STATES.GAME_OVER;
    }
}

/**
 * Moves a piece in the specified direction
 * Handles collision detection and piece locking
 * Classic scoring: only manual drops give points
 */
function movePiece(dx, dy, isManualDrop = false) {
    if (!currentPiece) return;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    // Try to move piece
    if (!checkCollision(newX, newY, currentPiece.shape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        
        // Classic Tetris scoring: only manual soft drops give points, not gravity
        if (dy > 0 && isManualDrop) {
            addScore(SCORING.SOFT_DROP);
        }
    } else if (dy > 0) {
        playSound('lock');
        lockPiece();
        const linesCleared = clearLines();
        
        if (linesCleared > 0) {
            addLines(linesCleared);
            
            switch (linesCleared) {
                case 1: addScore(SCORING.SINGLE); break;
                case 2: addScore(SCORING.DOUBLE); break;
                case 3: addScore(SCORING.TRIPLE); break;
                case 4: addScore(SCORING.TETRIS); playSound('tetris'); break;
            }
            
            if (linesCleared < 4) {
                playSound('lineClear');
            }
        }
        
        spawnPiece();
    }
}

function rotatePiece() {
    if (!currentPiece) return;
    
    const rotated = rotateMatrix(currentPiece.shape);
    if (!checkCollision(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
    }
}

function reverseRotate() {
    if (!currentPiece) return;
    
    const rotated = rotateMatrixCCW(currentPiece.shape);
    if (!checkCollision(currentPiece.x, currentPiece.y, rotated)) {
        currentPiece.shape = rotated;
    }
}

function hardDrop() {
    if (!currentPiece) return;
    
    let dropDistance = 0;
    while (!checkCollision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
        currentPiece.y++;
        dropDistance++;
    }
    
    addScore(SCORING.HARD_DROP * dropDistance);
    
    lockPiece();
    const linesCleared = clearLines();
    
    if (linesCleared > 0) {
        addLines(linesCleared);
        
        switch (linesCleared) {
            case 1: addScore(SCORING.SINGLE); break;
            case 2: addScore(SCORING.DOUBLE); break;
            case 3: addScore(SCORING.TRIPLE); break;
            case 4: addScore(SCORING.TETRIS); playSound('tetris'); break;
        }
        
        if (linesCleared < 4) {
            playSound('lineClear');
        }
    }
    
    spawnPiece();
}

function checkCollision(x, y, shape) {
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px]) {
                const newX = x + px;
                const newY = y + py;
                
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
                if (newY >= 0 && gameBoard[newY][newX]) return true;
            }
        }
    }
    return false;
}

function lockPiece() {
    if (!currentPiece) return;
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                if (boardY >= 0) {
                    gameBoard[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (gameBoard[y].every(cell => cell !== 0)) {
            gameBoard.splice(y, 1);
            gameBoard.unshift(new Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++;
        }
    }
    return linesCleared;
}

function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    
    for (let x = 0; x < cols; x++) {
        rotated[x] = [];
        for (let y = rows - 1; y >= 0; y--) {
            rotated[x][rows - 1 - y] = matrix[y][x];
        }
    }
    return rotated;
}

function rotateMatrixCCW(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];
    
    for (let x = cols - 1; x >= 0; x--) {
        rotated[cols - 1 - x] = [];
        for (let y = 0; y < rows; y++) {
            rotated[cols - 1 - x][y] = matrix[y][x];
        }
    }
    return rotated;
}

// ================================================================================================
// RENDERING
// ================================================================================================

/**
 * Draws the main game board with locked pieces
 */
function drawBoard() {
    const { x: offsetX, y: offsetY, blockWidth, blockHeight } = getBoardOffsets();
    
    // Draw board background
    ctx.fillStyle = '#111';
    ctx.fillRect(offsetX, offsetY, BOARD_WIDTH * blockWidth, BOARD_HEIGHT * blockHeight);
    
    // Draw all locked pieces on the board
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (gameBoard[y][x]) {
                const block = gameBoard[y][x];
                ctx.fillStyle = BLOCKS[block].color;
                ctx.fillRect(offsetX + x * blockWidth, offsetY + y * blockHeight, blockWidth - 1, blockHeight - 1);
            }
        }
    }
}

/**
 * Draws the currently falling piece
 */
function drawCurrentPiece() {
    if (!currentPiece) return;
    
    const { x: offsetX, y: offsetY, blockWidth, blockHeight } = getBoardOffsets();
    
    ctx.fillStyle = currentPiece.color;
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const drawX = offsetX + (currentPiece.x + x) * blockWidth;
                const drawY = offsetY + (currentPiece.y + y) * blockHeight;
                ctx.fillRect(drawX, drawY, blockWidth - 1, blockHeight - 1);
            }
        }
    }
}

/**
 * Main game rendering function - draws board and current piece
 */
function drawGame() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawBoard();
    drawCurrentPiece();
}

// ================================================================================================
// MAIN GAME LOOP
// ================================================================================================

/**
 * Main game loop - handles automatic piece dropping and renders current game state
 * Uses requestAnimationFrame for smooth 60fps rendering
 */
function gameLoop() {
    if (currentState === GAME_STATES.PLAYING) {
        const now = Date.now();
        if (now - dropTime > dropInterval) {
            movePiece(0, 1, false); // Automatic gravity drop (no points)
            dropTime = now;
        }
    }
    
    // Render appropriate screen based on current game state
    switch (currentState) {
        case GAME_STATES.MENU: drawMenu(); break;
        case GAME_STATES.OPTIONS: drawControls(); break;
        case GAME_STATES.ABOUT: drawAbout(); break;
        case GAME_STATES.PLAYING: drawGame(); break;
        case GAME_STATES.PAUSED: drawPauseScreen(); break;
        case GAME_STATES.GAME_OVER: drawGameOver(); break;
    }
    
    requestAnimationFrame(gameLoop); // Continue the loop
}

/**
 * Initializes a new game session
 * Includes delay to allow menu-select sound to play before stopping audio
 */
function startGame() {
    setTimeout(() => {
        stopAllAudio();
        playMusic('gameMusic');
    }, 100); // Delay allows menu-select sound to play
    
    currentState = GAME_STATES.PLAYING;
    initializeBoard();
    resetGame();
    nextPiece = null;
    spawnPiece();
    dropTime = Date.now();
}

// ================================================================================================
// GAME INITIALIZATION
// ================================================================================================

setAudioVolumes();  // Initialize audio settings
gameLoop();         // Start the main game loop
