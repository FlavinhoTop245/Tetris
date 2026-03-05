const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdContext = holdCanvas.getContext('2d');

context.scale(30, 30);
nextContext.scale(30, 30);
holdContext.scale(30, 30);

function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        player.lines += 1;
        rowCount *= 2;
    }
    updateScore();
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
    context.fillStyle = '#000';
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
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    player.queue.forEach((matrix, index) => {
        const yOffset = index * 2.8 + 0.5;
        const xOffset = (nextCanvas.width / 30 - matrix[0].length) / 2;
        drawMatrix(matrix, { x: xOffset, y: yOffset }, nextContext);
    });
}

function drawHold() {
    holdContext.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    holdContext.fillStyle = '#000';
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
    document.getElementById('final-score').innerText = player.score;
    document.getElementById('game-over').classList.remove('hidden');
    gameRunning = false;
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
    if (player.lockActive) player.lockCounter = 0;
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

let moveState = {
    dir: 0,
    timer: 0,
    repeatTimer: 0
};
const DAS_DELAY = 170;
const DAS_INTERVAL = 50;

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
    hold: 'c'
};

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
    }
});

document.addEventListener('keyup', e => {
    if (e.key === keyMap.moveLeft && moveState.dir === -1) {
        moveState.dir = 0;
    } else if (e.key === keyMap.moveRight && moveState.dir === 1) {
        moveState.dir = 0;
    }
});

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

let gameRunning = false;

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    gameRunning = true;
    player.score = 0;
    player.lines = 0;
    player.queue = [];
    player.bag = [];
    player.hold = null;
    arena.forEach(row => row.fill(0));
    updateScore();
    drawHold();
    playerReset();
    update();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over').classList.add('hidden');
    player.score = 0;
    player.lines = 0;
    player.queue = [];
    player.bag = [];
    player.hold = null;
    arena.forEach(row => row.fill(0));
    gameRunning = true;
    updateScore();
    drawHold();
    playerReset();
    update();
});
