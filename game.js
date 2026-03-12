const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdContext = holdCanvas.getContext('2d');

context.scale(30, 30);
nextContext.scale(30, 30);
holdContext.scale(30,30);

// --- AUDIO SYSTEM ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let currentMusic = null;
let musicVolume = 0.3;
let sfxVolume = 0.5;

function playSynthSound(freq, type, duration, volume) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume * sfxVolume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playLockSound() {
    playSynthSound(100, 'sine', 0.15, 0.1);
}

function playLineSound(lines, b2b) {
    const baseFreq = 440 + (lines * 40) + (b2b * 20);
    const multiplier = 1.25;
    playSynthSound(baseFreq, 'sine', 0.4, 0.15);
    setTimeout(() => playSynthSound(baseFreq * multiplier, 'sine', 0.4, 0.1), 100);
}

function stopMusic() {
    if (currentMusic) {
        // Fade out mais lento e suave
        const fadeInterval = 50; 
        const fadeStep = 0.01;
        const fadeOut = setInterval(() => {
            if (currentMusic.volume > fadeStep) {
                currentMusic.volume -= fadeStep;
            } else {
                clearInterval(fadeOut);
                currentMusic.pause();
                currentMusic.currentTime = 0;
            }
        }, fadeInterval);
    }
}

const playlists = {
    standard: ['audio/musicacalma1.mp3', 'audio/musicacalma2.mp3', 'audio/musicacalma3.mp3'],
    '40lines': ['audio/musicaanimada1.mp3', 'audio/musicaanimada2.mp3']
};

function playMusic(mode) {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }
    
    const playlist = playlists[mode === '40lines' ? '40lines' : 'standard'];
    const randomTrack = playlist[Math.floor(Math.random() * playlist.length)];

    currentMusic = new Audio(randomTrack);
    currentMusic.loop = false;
    currentMusic.volume = 0; 
    
    currentMusic.addEventListener('ended', () => playMusic(mode));

    currentMusic.play()
        .then(() => {
            // Fade in MUITO mais lento e perceptível
            const fadeInterval = 150;
            const fadeStep = 0.005;
            const fadeIn = setInterval(() => {
                if (currentMusic.volume < musicVolume - fadeStep) {
                    currentMusic.volume += fadeStep;
                } else {
                    currentMusic.volume = musicVolume;
                    clearInterval(fadeIn);
                }
            }, fadeInterval);
        })
        .catch(e => console.log("Áudio aguardando interação."));
}
// --------------------

function arenaSweep() {
    let linesClearedThisTurn = 0;

    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        linesClearedThisTurn++;
    }

    if (linesClearedThisTurn > 0) {
        if (currentGameMode === 'standard') {
            calculateStandardScore(linesClearedThisTurn);
            playLineSound(linesClearedThisTurn, player.b2bCount); // Som dinâmico
        } else {
            playLineSound(linesClearedThisTurn, 0); // Modo 40 linhas sem b2b complexo
            player.score += linesClearedThisTurn * 10;
        }
        player.lines += linesClearedThisTurn;
        updateScore();
    }

    if (currentGameMode === '40lines' && player.lines >= 40) {
        victory40Lines();
    }
}

function checkTSpin(lines) {
    // Primeiro verifica se é a peça T e se rotacionou por último
    const isTPiece = player.matrix.length === 3 && player.matrix[1][1] !== 0 && player.matrix[0][0] === 0;
    if (!isTPiece || !player.lastActionWasRotate) return { type: "none" };

    const { x, y } = player.pos;

    // Cantos relativos ao centro (1,1) da matriz 3x3
    const corners = [
        { x: x + 0, y: y + 0 }, // Top-Left
        { x: x + 2, y: y + 0 }, // Top-Right
        { x: x + 0, y: y + 2 }, // Bottom-Left
        { x: x + 2, y: y + 2 }  // Bottom-Right
    ];

    let filledCorners = 0;
    corners.forEach(c => {
        if (c.y >= 20 || c.x < 0 || c.x >= 10 || arena[c.y][c.x] !== 0) {
            filledCorners++;
        }
    });

    if (filledCorners < 3) return { type: "none" };

    // Regra das 2 pontas (frente) para diferenciar Full de Mini
    // Depende da orientação
    let frontCorners = 0;
    if (player.orientation === 0) { // Topo
        if (isFilled(x + 0, y + 0)) frontCorners++;
        if (isFilled(x + 2, y + 0)) frontCorners++;
    } else if (player.orientation === 1) { // Direita
        if (isFilled(x + 2, y + 0)) frontCorners++;
        if (isFilled(x + 2, y + 2)) frontCorners++;
    } else if (player.orientation === 2) { // Baixo
        if (isFilled(x + 0, y + 2)) frontCorners++;
        if (isFilled(x + 2, y + 2)) frontCorners++;
    } else if (player.orientation === 3) { // Esquerda
        if (isFilled(x + 0, y + 0)) frontCorners++;
        if (isFilled(x + 0, y + 2)) frontCorners++;
    }

    return { type: frontCorners >= 2 ? "full" : "mini" };
}

function isFilled(x, y) {
    return y >= 20 || x < 0 || x >= 10 || (arena[y] && arena[y][x] !== 0);
}

function calculateStandardScore(lines) {
    let basePoints = 0;
    let actionName = "";

    // Identificar se é um T-Spin legítimo
    const tspin = checkTSpin(lines);
    const isSpin = tspin.type !== "none";
    const isTetris = lines === 4;
    const isB2BEligible = isTetris || isSpin;

    // Regras de Pontuação SRS
    if (tspin.type === "full") {
        if (lines === 0) { actionName = "T-SPIN"; basePoints = 400; }
        else if (lines === 1) { actionName = "T-SPIN SINGLE"; basePoints = 800; }
        else if (lines === 2) { actionName = "T-SPIN DOUBLE"; basePoints = 1200; }
        else if (lines === 3) { actionName = "T-SPIN TRIPLE"; basePoints = 1600; }
    } else if (tspin.type === "mini") {
        actionName = "T-SPIN MINI";
        basePoints = 200;
        if (lines > 0) basePoints += lines * 100;
    } else {
        // Linhas normais
        if (lines === 1) { basePoints = 100; actionName = "SINGLE"; }
        else if (lines === 2) { basePoints = 300; actionName = "DOUBLE"; }
        else if (lines === 3) { basePoints = 500; actionName = "TRIPLE"; }
        else if (lines === 4) { basePoints = 800; actionName = "TETRIS"; }
    }

    // Lógica Back-to-Back (B2B)
    if (isB2BEligible) {
        player.b2bCount++;
        if (player.b2bCount > 1) {
            basePoints *= player.b2bCount;
        }
    } else if (lines > 0) {
        player.b2bCount = 0; // Quebra a sequência B2B apenas se limpou linha mas não foi tetris/spin
    }

    // All Clear (Tabuleiro totalmente limpo)
    const isAllClear = arena.every(row => row.every(value => value === 0));
    if (isAllClear) {
        basePoints += 1600;
        actionName = "ALL CLEAR!";
    }

    showActionFeedback(actionName, player.b2bCount);
    player.score += basePoints;
}

function showActionFeedback(text, b2b) {
    const actionEl = document.getElementById('action-text');
    const b2bEl = document.getElementById('b2b-text');

    actionEl.innerText = text;
    actionEl.classList.remove('action-anim');
    void actionEl.offsetWidth; // Trigger reflow
    actionEl.classList.add('action-anim');

    if (b2b > 1) {
        b2bEl.innerText = `BACK-TO-BACK: ${b2b}X`;
        b2bEl.classList.add('show');
    } else {
        b2bEl.classList.remove('show');
    }

    // Limpar texto após 2 segundos se não houver novos hits
    clearTimeout(actionEl.timer);
    actionEl.timer = setTimeout(() => {
        actionEl.innerText = "";
    }, 2000);
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0],
        ];
    } else if (type === 'J') {
        return [
            [4, 0, 0],
            [4, 4, 4],
            [0, 0, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 0, 0, 0],
            [5, 5, 5, 5],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

const colors = [
    null,
    '#a000f0', // T
    '#f0f000', // O
    '#f0a000', // L
    '#0000f0', // J
    '#00f0f0', // I
    '#00f000', // S
    '#f00000', // Z
];

function draw() {
    context.fillStyle = '#000'; // Fundo preto sólido e opaco
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 }, context);

    const ghostPos = getGhostPos();
    drawMatrix(player.matrix, ghostPos, context, true);

    drawMatrix(player.matrix, player.pos, context);
}

function getGhostPos() {
    const pos = { x: player.pos.x, y: player.pos.y };
    while (!collide(arena, { matrix: player.matrix, pos: pos })) {
        pos.y++;
    }
    pos.y--;
    return pos;
}

function drawNext() {
    nextContext.fillStyle = '#000'; // Fundo preto sólido e opaco
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    player.queue.forEach((matrix, index) => {
        const yOffset = index * 2.8 + 0.5;
        const xOffset = (nextCanvas.width / 30 - matrix[0].length) / 2;
        drawMatrix(matrix, { x: xOffset, y: yOffset }, nextContext);
    });
}

function drawHold() {
    holdContext.fillStyle = '#000'; // Fundo preto sólido e opaco
    holdContext.fillRect(0, 0, holdCanvas.width, holdCanvas.height);

    if (player.hold) {
        const matrix = player.hold;
        const xOffset = (holdCanvas.width / 30 - matrix[0].length) / 2;
        const yOffset = (holdCanvas.height / 30 - matrix.length) / 2;
        drawMatrix(matrix, { x: xOffset, y: yOffset }, holdContext);
    }
}

function drawMatrix(matrix, offset, ctx, isGhost = false) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                if (isGhost) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.strokeStyle = colors[value];
                    ctx.lineWidth = 0.05;
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                } else {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = colors[value];
                    ctx.fillStyle = colors[value];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctx.shadowBlur = 0;
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
                }
            }
        });
    });
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        if (!player.lockActive) {
            player.lockActive = true;
            player.lockCounter = 0;
        }
    } else {
        player.lockActive = false;
        dropCounter = 0;
        player.lastActionWasRotate = false;
    }
}

function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    lockPiece();
}

function lockPiece() {
    playLockSound(); // Som ao encaixar!
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    player.lockActive = false;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        player.lastActionWasRotate = false;
        if (player.lockActive) player.lockCounter = 0;
    }
}

function pullFromBag() {
    if (player.bag.length === 0) {
        const pieces = ['I', 'L', 'J', 'O', 'T', 'S', 'Z'];
        // Fisher-Yates shuffle
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        player.bag = pieces;
    }
    return player.bag.pop();
}

function getNextFromQueue() {
    const nextPiece = player.queue.shift();
    player.queue.push(createPiece(pullFromBag()));
    return nextPiece;
}

function playerReset() {
    // Inicializar fila se vazia
    if (player.queue.length === 0) {
        for (let i = 0; i < 5; i++) {
            player.queue.push(createPiece(pullFromBag()));
        }
    }

    player.matrix = getNextFromQueue();
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
    player.orientation = 0;

    if (collide(arena, player)) {
        gameOver();
    }

    player.canHold = true;
    player.lockActive = false;
    drawNext();
}

function playerHold() {
    if (!player.canHold) return;

    // Identificar o tipo da peça atual para salvar a forma inicial
    const pieces = [null, 'T', 'O', 'L', 'J', 'I', 'S', 'Z'];
    let typeValue = 0;

    // Procura o valor da cor na matriz para saber qual peça é
    for (let y = 0; y < player.matrix.length; y++) {
        for (let x = 0; x < player.matrix[y].length; x++) {
            if (player.matrix[y][x] !== 0) {
                typeValue = player.matrix[y][x];
                break;
            }
        }
        if (typeValue !== 0) break;
    }

    const currentType = pieces[typeValue];

    if (player.hold === null) {
        player.hold = createPiece(currentType);
        playerReset();
    } else {
        const temp = createPiece(currentType);
        player.matrix = player.hold;
        player.hold = temp;

        player.pos.y = 0;
        player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
    }

    player.canHold = false;
    player.lockActive = false;
    drawHold();
    drawNext();
}

function gameOver() {
    gameRunning = false;
    isTimerRunning = false;

    document.getElementById('end-title').innerText = "GAME OVER";
    document.getElementById('end-label').innerText = "Sua pontuação final:";
    document.getElementById('final-score').innerText = player.score;

    // Esconder scoreboard no modo padrão
    document.getElementById('best-times-container').classList.add('hidden');

    document.getElementById('game-over').classList.remove('hidden');
}

function victory40Lines() {
    gameRunning = false;
    isTimerRunning = false;
    const finalTime = performance.now() - gameStartTime;
    saveBestTime(finalTime);

    document.getElementById('end-title').innerText = "VITÓRIA!";
    document.getElementById('end-label').innerText = "Tempo Final:";
    document.getElementById('final-score').innerText = formatTime(finalTime);

    // Mostrar scoreboard apenas no modo 40 linhas
    updateBestTimesDisplay();

    document.getElementById('game-over').classList.remove('hidden');
}

function formatTime(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

function saveBestTime(time) {
    let bestTimes = JSON.parse(localStorage.getItem('tetris40Times')) || [];
    bestTimes.push(time);
    bestTimes.sort((a, b) => a - b);
    bestTimes = bestTimes.slice(0, 5);
    localStorage.setItem('tetris40Times', JSON.stringify(bestTimes));
    updateBestTimesDisplay();
}

function updateBestTimesDisplay() {
    const list = document.getElementById('best-times-list');
    const container = document.getElementById('best-times-container');
    const bestTimes = JSON.parse(localStorage.getItem('tetris40Times')) || [];

    if (bestTimes.length > 0) {
        container.classList.remove('hidden');
        list.innerHTML = bestTimes.map((time, index) =>
            `<li><span>#${index + 1}</span> <span>${formatTime(time)}</span></li>`
        ).join('');
    } else {
        container.classList.add('hidden');
    }
}
updateBestTimesDisplay();

function showMenu() {
    stopMusic();
    gameRunning = false;
    isTimerRunning = false;
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');

    // Garantir que o timer suma ao voltar para o menu
    document.querySelector('.timer-box').style.display = 'none';
    document.getElementById('timer').innerText = "0:00.00";

    // Limpar feedback
    document.getElementById('action-text').innerText = "";
    document.getElementById('b2b-text').classList.remove('show');

    resetGameState();
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    player.orientation = (player.orientation + (dir > 0 ? 1 : 3)) % 4;
    if (player.lockActive) player.lockCounter = 0;
    player.lastActionWasRotate = true;
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                    matrix[y][x],
                    matrix[x][y],
                ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;
const LOCK_DELAY = 500;

let lastTime = 0;

let exitHoldTimer = 0;
const EXIT_HOLD_DURATION = 1500; // 1.5 segundos segurando ESC

let moveState = {
    dir: 0,
    timer: 0,
    repeatTimer: 0
};
const DAS_DELAY = 170;
const DAS_INTERVAL = 50;

let currentGameMode = 'standard';
let gameStartTime = 0;
let isTimerRunning = false;

function startCountdown(mode) {
    currentGameMode = mode;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');

    // Controlar visibilidade do Timer
    const timerBox = document.querySelector('.timer-box');
    if (mode === '40lines') {
        timerBox.style.display = 'block';
    } else {
        timerBox.style.display = 'none';
    }

    // Reset visual default
    document.querySelector('#game-over h2').innerText = "GAME OVER";
    document.querySelector('#game-over p').innerText = "Sua pontuação final:";

    // Reset game state but don't start loop yet
    resetGameState();
    playerReset();
    draw();
    drawNext();
    drawHold();

    if (mode === '40lines') {
        const countdownEl = document.getElementById('countdown');
        const countdownNum = document.getElementById('countdown-number');
        countdownEl.classList.remove('hidden');

        let count = 5;
        countdownNum.innerText = count;

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNum.innerText = count;
            } else {
                clearInterval(timer);
                countdownEl.classList.add('hidden');
                playMusic(currentGameMode);
                startGame();
            }
        }, 1000);
    } else {
        playMusic(currentGameMode);
        startGame();
    }
}

function resetGameState() {
    player.score = 0;
    player.lines = 0;
    player.b2bCount = 0;
    player.lastActionWasRotate = false;
    player.queue = [];
    player.bag = [];
    player.hold = null;
    arena.forEach(row => row.fill(0));
    updateScore();
}

function startGame() {
    gameRunning = true;
    lastTime = performance.now();
    gameStartTime = lastTime;
    isTimerRunning = (currentGameMode === '40lines');
    update();
}

function update(time = 0) {
    if (!gameRunning) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    if (moveState.dir !== 0) {
        moveState.timer += deltaTime;
        if (moveState.timer >= DAS_DELAY) {
            moveState.repeatTimer += deltaTime;
            if (moveState.repeatTimer >= DAS_INTERVAL) {
                playerMove(moveState.dir);
                moveState.repeatTimer = 0;
            }
        }
    }

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    if (player.lockActive) {
        player.lockCounter += deltaTime;
        if (player.lockCounter >= LOCK_DELAY) {
            lockPiece();
        }
    }

    // Lógica de Segurar para Sair (ESC)
    const exitPrompt = document.getElementById('exit-prompt');
    const exitBar = document.getElementById('exit-progress');
    
    if (exitHoldActive && gameRunning) {
        exitHoldTimer += deltaTime;
        exitPrompt.classList.remove('hidden');
        const progress = Math.min((exitHoldTimer / EXIT_HOLD_DURATION) * 100, 100);
        exitBar.style.width = progress + '%';
        
        if (exitHoldTimer >= EXIT_HOLD_DURATION) {
            exitHoldActive = false;
            exitHoldTimer = 0;
            exitPrompt.classList.add('hidden');
            showMenu();
        }
    } else {
        exitHoldTimer = 0;
        exitPrompt.classList.add('hidden');
    }

    if (isTimerRunning) {
        const elapsed = time - gameStartTime;
        document.getElementById('timer').innerText = formatTime(elapsed);
    }

    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('lines').innerText = player.lines;
    dropInterval = Math.max(150, 1000 - (player.lines * 10));
}

const arena = createMatrix(10, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    queue: [],
    bag: [],
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    b2bCount: 0,
    orientation: 0,
    lastActionWasRotate: false,
    lockActive: false,
    lockCounter: 0
};

let keyMap = {
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    rotateCW: 'ArrowUp',
    rotateCCW: 'z',
    drop: 'ArrowDown',
    hardDrop: ' ',
    hold: 'c',
    quit: 'Escape'
};

let exitHoldActive = false;

if (localStorage.getItem('tetrisKeys')) {
    const savedKeys = JSON.parse(localStorage.getItem('tetrisKeys'));
    keyMap = { ...keyMap, ...savedKeys };
}

function updateKeyDisplay() {
    document.querySelectorAll('.key-config').forEach(btn => {
        const action = btn.dataset.action;
        let keyText = keyMap[action] || '???';
        if (keyText === ' ') keyText = 'Space';
        btn.innerText = keyText.toUpperCase().replace('ARROW', 'SETA ');
    });
}
updateKeyDisplay();

let waitingForKey = null;
document.querySelectorAll('.key-config').forEach(btn => {
    btn.addEventListener('click', () => {
        if (waitingForKey) return;
        waitingForKey = btn;
        btn.classList.add('waiting');
        btn.innerText = '...';
    });
});

document.addEventListener('keydown', e => {
    if (waitingForKey) {
        const action = waitingForKey.dataset.action;
        keyMap[action] = e.key;
        localStorage.setItem('tetrisKeys', JSON.stringify(keyMap));
        waitingForKey.classList.remove('waiting');
        waitingForKey = null;
        updateKeyDisplay();
        return;
    }

    if (!gameRunning) return;

    if (e.key === keyMap.moveLeft) {
        if (moveState.dir !== -1) {
            playerMove(-1);
            moveState.dir = -1;
            moveState.timer = 0;
        }
    } else if (e.key === keyMap.moveRight) {
        if (moveState.dir !== 1) {
            playerMove(1);
            moveState.dir = 1;
            moveState.timer = 0;
        }
    } else if (e.key === keyMap.drop) {
        playerDrop();
    } else if (e.key === keyMap.rotateCW) {
        playerRotate(1);
    } else if (e.key === keyMap.rotateCCW) {
        playerRotate(-1);
    } else if (e.key === keyMap.hardDrop) {
        playerHardDrop();
    } else if (e.key === keyMap.hold) {
        playerHold();
    } else if (e.key === keyMap.quit) {
        exitHoldActive = true;
    }
});

document.addEventListener('keyup', e => {
    if (e.key === keyMap.quit) {
        exitHoldActive = false;
    }
    if (e.key === keyMap.moveLeft && moveState.dir === -1) {
        moveState.dir = 0;
    } else if (e.key === keyMap.moveRight && moveState.dir === 1) {
        moveState.dir = 0;
    }
});

// Controle de Volume
document.getElementById('music-volume').addEventListener('input', (e) => {
    musicVolume = parseFloat(e.target.value);
    if (currentMusic) currentMusic.volume = musicVolume;
});

document.getElementById('sfx-volume').addEventListener('input', (e) => {
    sfxVolume = parseFloat(e.target.value);
});

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

let gameRunning = false;

document.getElementById('start-standard-btn').addEventListener('click', () => {
    startCountdown('standard');
});

document.getElementById('start-40-btn').addEventListener('click', () => {
    startCountdown('40lines');
});

document.getElementById('restart-btn').addEventListener('click', () => {
    startCountdown(currentGameMode);
});

document.getElementById('menu-btn').addEventListener('click', () => {
    showMenu();
});

// Inicialização: Mostrar Ajustes no Primeiro Login
function initOnboarding() {
    const settingsModal = document.getElementById('settings-modal');
    const settingsTitle = document.getElementById('settings-title');
    const startScreen = document.getElementById('start-screen');
    
    // Esconde o menu principal temporariamente
    startScreen.classList.add('hidden');
    
    // Configura o modal de ajustes como tela de boas-vindas
    settingsTitle.innerText = "CONFIGURE O SEU JOGO";
    settingsModal.classList.remove('hidden');
    
    // Quando fechar os ajustes, volta para o título padrão e mostra o menu
    const originalClose = document.getElementById('close-settings');
    const newClose = () => {
        settingsModal.classList.add('hidden');
        settingsTitle.innerText = "CONTROLES";
        startScreen.classList.remove('hidden');
        originalClose.removeEventListener('click', newClose);
    };
    originalClose.addEventListener('click', newClose);
}

// Pequeno delay para garantir que o DOM está pronto e o usuário veja a transição
setTimeout(initOnboarding, 500);
