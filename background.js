const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');

let pieces = [];
const pieceTypes = [
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1], [1, 1]],       // O
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 1, 1]],         // I
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]]  // Z
];

const pieceColors = [
    '#a000f0', '#f0f000', '#f0a000', '#0000f0', '#00f0f0', '#00f000', '#f00000'
];

function resize() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

class FloatingPiece {
    constructor() {
        this.reset();
        this.y = Math.random() * bgCanvas.height; // Start at random Y
    }

    reset() {
        this.size = Math.random() * 20 + 20;
        this.x = Math.random() * bgCanvas.width;
        this.y = -60;
        this.speed = Math.random() * 0.5 + 0.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.01;
        this.typeIndex = Math.floor(Math.random() * pieceTypes.length);
        this.color = pieceColors[this.typeIndex];
        this.opacity = Math.random() * 0.2 + 0.1;
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotSpeed;
        if (this.y > bgCanvas.height + 60) {
            this.reset();
        }
    }

    draw() {
        bgCtx.save();
        bgCtx.translate(this.x, this.y);
        bgCtx.rotate(this.rotation);
        bgCtx.globalAlpha = this.opacity;
        
        const matrix = pieceTypes[this.typeIndex];
        const s = this.size;

        // Glow effect
        bgCtx.shadowBlur = 15;
        bgCtx.shadowColor = this.color;
        bgCtx.fillStyle = this.color;

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    bgCtx.fillRect(x * s - (matrix[0].length * s) / 2, y * s - (matrix.length * s) / 2, s - 2, s - 2);
                }
            });
        });

        bgCtx.restore();
    }
}

// Initialize pieces
for (let i = 0; i < 15; i++) {
    pieces.push(new FloatingPiece());
}

function animateBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    pieces.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animateBg);
}

animateBg();
