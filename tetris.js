/**
 * TETRIS GAME
 * Created by Sandesh Thapa
 */

// ================================================================================================
// CANVAS & CONSTANTS
// ================================================================================================

const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');

const GAME_STATES = {
    MENU: 'menu',
    OPTIONS: 'options',
    ABOUT: 'about',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const LINES_PER_LEVEL = 10;
const BASE_DROP_INTERVAL = 1000;

// ================================================================================================
// AUDIO SYSTEM
// ================================================================================================

const AUDIO = {
    menuMusic: new Audio('assets/menu-music.mp3'),
    gameMusic1: new Audio('assets/bgm1.mp3'),
    gameMusic2: new Audio('assets/bgm2.mp3'),
    gameMusic3: new Audio('assets/bgm3.mp3'),
    gameMusic4: new Audio('assets/bgm4.mp3'),
    gameMusic5: new Audio('assets/bgm5.mp3'),
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

const GAME_MUSIC_TRACKS = ['gameMusic1', 'gameMusic2', 'gameMusic3', 'gameMusic4', 'gameMusic5'];
let currentGameTrack = null;
let lastPlayedTrack = null;

// Audio settings
let musicEnabled = true;
let soundEnabled = true;
let musicVolume = 0.3;

AUDIO.menuMusic.loop = true;

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

function playSound(soundName) {
    if (soundEnabled && AUDIO[soundName]) {
        AUDIO[soundName].currentTime = 0;
        AUDIO[soundName].play().catch(() => {});
    }
}

function playMusic(musicName) {
    if (!musicEnabled) return;
    
    if (musicName === 'menuMusic') {
        stopAllMusic();
        AUDIO.menuMusic.play().catch(() => {});
    } else if (musicName === 'gameMusic') {
        playRandomGameMusic();
    }
}

function playRandomGameMusic() {
    if (!musicEnabled) return;
    
    stopAllMusic();
    
    let availableTracks = [...GAME_MUSIC_TRACKS];
    if (availableTracks.length > 1 && lastPlayedTrack) {
        availableTracks = availableTracks.filter(track => track !== lastPlayedTrack);
    }
    
    const randomIndex = Math.floor(Math.random() * availableTracks.length);
    const trackName = availableTracks[randomIndex];
    lastPlayedTrack = trackName;
    currentGameTrack = AUDIO[trackName];
    
    if (currentGameTrack) {
        currentGameTrack.currentTime = 0;
        const actualMusicVolume = musicEnabled ? (musicVolume * musicVolume * 0.3) : 0;
        currentGameTrack.volume = actualMusicVolume * 0.8;
        
        currentGameTrack.onended = () => playRandomGameMusic();
        currentGameTrack.onerror = () => {
            setTimeout(() => {
                lastPlayedTrack = null;
                playRandomGameMusic();
            }, 2000);
        };
        
        currentGameTrack.play().catch(() => {});
    }
}

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

function stopAllAudio() {
    Object.values(AUDIO).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
    });
    currentGameTrack = null;
}

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

// ================================================================================================
// GAME STATE & VARIABLES
// ================================================================================================

let currentState = GAME_STATES.MENU;
let selectedMenuItem = 0;
let selectedOptionItem = 0;
let controlScheme = 'arrow';

const menuItems = ['Start', 'Options', 'About'];
const optionItems = ['Controls', 'Music', 'Sounds', 'Volume', 'Back'];

let gameBoard = [];
let currentPiece = null;
let nextPiece = null;
let dropTime = 0;
let dropInterval = 1000;
let score = 0;
let lines = 0;
let level = 1;

let keysPressed = new Set();

const SCORING = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

// Tetris piece definitions
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

function calculateBlockSize() {
    return {
        width: canvas.width / BOARD_WIDTH,
        height: canvas.height / BOARD_HEIGHT
    };
}

function getBoardOffsets() {
    const blockSizes = calculateBlockSize();
    return {
        x: 0,
        y: 0,
        blockWidth: blockSizes.width,
        blockHeight: blockSizes.height
    };
}

function updateUI() {
    document.querySelector('.score-value').textContent = score;
    document.querySelector('.lines-value').textContent = lines;
    document.querySelector('.level-value').textContent = level;
}

function addScore(points) {
    score += points * level;
    updateUI();
}

function addLines(linesCleared) {
    lines += linesCleared;
    
    const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropInterval = Math.max(50, BASE_DROP_INTERVAL - (level - 1) * 50);
        playSound('levelUp');
    }
    
    updateUI();
}

function resetGame() {
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = BASE_DROP_INTERVAL;
    updateUI();
}

function drawNextPiece() {
    if (!nextPiece) return;
    
    const nextCanvas = document.getElementById('nextBlockCanvas');
    const nextCtx = nextCanvas.getContext('2d');
    
    nextCtx.fillStyle = '#000';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const blockSize = 15;
    const shape = nextPiece.shape;
    const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;
    
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

function drawMenu() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '22px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3eb7ca';
    ctx.fillText('TETRIS', canvas.width / 2, 100);
    
    for (let i = 0; i < menuItems.length; i++) {
        ctx.fillStyle = selectedMenuItem === i ? '#fff' : '#666';
        ctx.fillText(menuItems[i], canvas.width / 2, 200 + i * 50);
    }
    
    ctx.fillStyle = '#3eb7ca';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Use ↑/↓ or W/S to navigate', canvas.width / 2, 400);
    ctx.fillText('Press ENTER or SPACE to select', canvas.width / 2, 430);
}

function drawControls() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '22px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3eb7ca';
    ctx.fillText('OPTIONS', canvas.width / 2, 100);
    
    for (let i = 0; i < optionItems.length; i++) {
        ctx.fillStyle = selectedOptionItem === i ? '#fff' : '#666';
        let text = optionItems[i];
        
        if (i === 0) text += ': ' + (controlScheme === 'arrow' ? 'ARROWS' : 'WASD');
        if (i === 1) text += ': ' + (musicEnabled ? 'ON' : 'OFF');
        if (i === 2) text += ': ' + (soundEnabled ? 'ON' : 'OFF');
        if (i === 3) text += ': ' + Math.round(musicVolume * 100) + '%';
        
        ctx.fillText(text, canvas.width / 2, 180 + i * 40);
    }
    
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

function drawPauseScreen() {
    drawGame();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText('Press P to resume', canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText('Press ESC for menu', canvas.width / 2, canvas.height / 2 + 70);
}

function drawGameOver() {
    drawGame();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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

document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    if (keysPressed.has(key)) return;
    keysPressed.add(key);
    
    switch (currentState) {
        case GAME_STATES.MENU: handleMenuInput(key); break;
        case GAME_STATES.OPTIONS: handleOptionsInput(key); break;
        case GAME_STATES.ABOUT: handleAboutInput(key); break;
        case GAME_STATES.PLAYING: handleGameInput(key); break;
        case GAME_STATES.PAUSED: handlePauseInput(key); break;
        case GAME_STATES.GAME_OVER: handleGameOverInput(key); break;
    }
});

document.addEventListener('keyup', function(event) {
    keysPressed.delete(event.key);
});

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
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    }
}

function handleGameInput(key) {
    if (key === 'Escape') {
        stopAllAudio();
        playMusic('menuMusic');
        currentState = GAME_STATES.MENU;
        selectedMenuItem = 0;
    } else if (key === 'p' || key === 'P') {
        currentState = GAME_STATES.PAUSED;
    } else if (controlScheme === 'arrow') {
        if (key === 'ArrowLeft') { movePiece(-1, 0); playSound('move'); }
        else if (key === 'ArrowRight') { movePiece(1, 0); playSound('move'); }
        else if (key === 'ArrowDown') { movePiece(0, 1); playSound('drop'); }
        else if (key === 'ArrowUp') { rotatePiece(); playSound('rotate'); }
        else if (key === 'c' || key === 'C') { reverseRotate(); playSound('rotate'); }
        else if (key === ' ') { hardDrop(); playSound('lock'); }
    } else {
        if (key === 'a' || key === 'A') { movePiece(-1, 0); playSound('move'); }
        else if (key === 'd' || key === 'D') { movePiece(1, 0); playSound('move'); }
        else if (key === 's' || key === 'S') { movePiece(0, 1); playSound('drop'); }
        else if (key === 'w' || key === 'W') { rotatePiece(); playSound('rotate'); }
        else if (key === 'c' || key === 'C') { reverseRotate(); playSound('rotate'); }
        else if (key === ' ') { hardDrop(); playSound('lock'); }
    }
}

function handlePauseInput(key) {
    if (key === 'p' || key === 'P') {
        currentState = GAME_STATES.PLAYING;
    } else if (key === 'Escape') {
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

function initializeBoard() {
    gameBoard = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        gameBoard[y] = new Array(BOARD_WIDTH).fill(0);
    }
}

function spawnPiece() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    
    if (nextPiece) {
        currentPiece = {
            shape: nextPiece.shape,
            color: nextPiece.color,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            type: nextPiece.type
        };
    } else {
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        currentPiece = {
            shape: BLOCKS[randomPiece].shape,
            color: BLOCKS[randomPiece].color,
            x: Math.floor(BOARD_WIDTH / 2) - 1,
            y: 0,
            type: randomPiece
        };
    }
    
    const nextRandomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    nextPiece = {
        shape: BLOCKS[nextRandomPiece].shape,
        color: BLOCKS[nextRandomPiece].color,
        type: nextRandomPiece
    };
    
    drawNextPiece();
    
    if (checkCollision(currentPiece.x, currentPiece.y, currentPiece.shape)) {
        stopAllAudio();
        playSound('gameOver');
        currentState = GAME_STATES.GAME_OVER;
    }
}

function movePiece(dx, dy) {
    if (!currentPiece) return;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (!checkCollision(newX, newY, currentPiece.shape)) {
        currentPiece.x = newX;
        currentPiece.y = newY;
        
        if (dy > 0) {
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

function drawBoard() {
    const { x: offsetX, y: offsetY, blockWidth, blockHeight } = getBoardOffsets();
    
    ctx.fillStyle = '#111';
    ctx.fillRect(offsetX, offsetY, BOARD_WIDTH * blockWidth, BOARD_HEIGHT * blockHeight);
    
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

function drawGame() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawBoard();
    drawCurrentPiece();
}

// ================================================================================================
// MAIN GAME LOOP
// ================================================================================================

function gameLoop() {
    if (currentState === GAME_STATES.PLAYING) {
        const now = Date.now();
        if (now - dropTime > dropInterval) {
            movePiece(0, 1);
            dropTime = now;
        }
    }
    
    switch (currentState) {
        case GAME_STATES.MENU: drawMenu(); break;
        case GAME_STATES.OPTIONS: drawControls(); break;
        case GAME_STATES.ABOUT: drawAbout(); break;
        case GAME_STATES.PLAYING: drawGame(); break;
        case GAME_STATES.PAUSED: drawPauseScreen(); break;
        case GAME_STATES.GAME_OVER: drawGameOver(); break;
    }
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    stopAllAudio();
    currentState = GAME_STATES.PLAYING;
    initializeBoard();
    resetGame();
    nextPiece = null;
    spawnPiece();
    playMusic('gameMusic');
    dropTime = Date.now();
}

// ================================================================================================
// INITIALIZE
// ================================================================================================

setAudioVolumes();
playMusic('menuMusic');
gameLoop();
