/* =========================================
   1. 모달(팝업) & 갤러리 기능
   ========================================= */
function openModal(id) {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById(id).classList.remove('active');
}
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        document.querySelectorAll('.modal.active').forEach(modal => closeModal(modal.id));
    }
});

// 갤러리 이미지 클릭 시 메인 화면 변경
function viewImage(element) {
    const modal = element.closest('.modal');
    const showcase = modal.querySelector('.project-showcase');
    
    // 1. 이미지 태그인 경우 (<img>)
    if (element.tagName === 'IMG') {
        const imgSrc = element.src;
        const imgAlt = element.alt;
        // 메인 쇼케이스에 이미지 채우기
        showcase.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}" style="width:100%; height:100%; object-fit:contain;">`;
    }
    // 2. 일반 텍스트 박스인 경우 (<div>)
    else {
        const content = element.innerHTML;
        showcase.innerHTML = `<div class="img-placeholder main" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-family:'Galmuri11', sans-serif;">${content}</div>`;
    }
}

/* =========================================
   2. 게임 & 물리 엔진 (줌인 적용 버전)
   ========================================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

ctx.imageSmoothingEnabled = false;

const ZOOM = 1.5;
const WORLD_WIDTH = 3000; 
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let groundY = canvasHeight - 100;

const GRAVITY = 0.8;      
const JUMP_POWER = 18;    

const sprites = {
    player: new Image(),
    computer: new Image(),
    easel: new Image(),
    bookshelf: new Image(),
    arcade: new Image(),
    floor: new Image(),
    wall: new Image()
};

sprites.player.src = 'assets/player.png';       
sprites.computer.src = 'assets/computer.png';   
sprites.easel.src = 'assets/easel.png';         
sprites.bookshelf.src = 'assets/bookshelf.png'; 
sprites.arcade.src = 'assets/arcade.png';
sprites.floor.src = 'assets/floor.png';
sprites.wall.src = 'assets/wall.png';

const player = {
    x: 100, y: 0, width: 64, height: 64, 
    color: '#3498db', speed: 7, 
    velX: 0, velY: 0, isGrounded: false, direction: 1 
};

const camera = { x: 0, y: 0 };
const keys = { w: false, a: false, s: false, d: false };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    groundY = canvasHeight - 100;
    ctx.imageSmoothingEnabled = false; 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal.active')) return;
    switch(e.code) {
        case 'KeyD': keys.d = true; player.direction = 1; break; 
        case 'KeyA': keys.a = true; player.direction = -1; break; 
        case 'KeyW': case 'Space': keys.w = true; break;
        case 'KeyS': keys.s = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyD': keys.d = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyW': case 'Space': keys.w = false; break;
        case 'KeyS': keys.s = false; break;
    }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (keys.d) player.velX = player.speed;
    else if (keys.a) player.velX = -player.speed;
    else player.velX = 0;

    player.x += player.velX;

    if (keys.w && player.isGrounded) {
        player.velY = -JUMP_POWER;
        player.isGrounded = false;
    }

    player.velY += GRAVITY;
    player.y += player.velY;

    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.velY = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width;

    const zoomedWidth = canvasWidth / ZOOM;
    camera.x = player.x - zoomedWidth / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > WORLD_WIDTH - zoomedWidth) camera.x = WORLD_WIDTH - zoomedWidth;

    camera.y = groundY - (canvasHeight - 100) / ZOOM;

    const worldSpace = document.getElementById('world-space');
    worldSpace.style.transformOrigin = '0 0'; 
    worldSpace.style.transform = `translate(${-camera.x * ZOOM}px, ${-camera.y * ZOOM}px) scale(${ZOOM})`;
}

function drawSprite(img, x, y, w, h, color) {
    if (img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-camera.x, -camera.y);

    if (sprites.wall.complete && sprites.wall.naturalHeight !== 0) {
        const ptrn = ctx.createPattern(sprites.wall, 'repeat');
        ctx.fillStyle = ptrn;
        ctx.fillRect(0, 0, WORLD_WIDTH, canvasHeight);
    } else {
        ctx.fillStyle = "#222"; 
        ctx.fillRect(0, 0, WORLD_WIDTH, canvasHeight);
    }

    if (sprites.floor.complete && sprites.floor.naturalHeight !== 0) {
        const floorH = 100;
        const tileW = 64; 
        for (let i = 0; i < WORLD_WIDTH; i += tileW) {
            ctx.drawImage(sprites.floor, i, groundY, tileW, floorH);
        }
    } else {
        ctx.fillStyle = "#444";
        ctx.fillRect(0, groundY, WORLD_WIDTH, 100);
    }

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(WORLD_WIDTH, groundY);
    ctx.stroke();

    drawSprite(sprites.computer, 300, groundY - 100, 120, 100, "#555");
    drawSprite(sprites.easel, 900, groundY - 140, 100, 140, "#555");
    drawSprite(sprites.bookshelf, 1600, groundY - 180, 150, 180, "#555");
    drawSprite(sprites.arcade, 2300, groundY - 120, 100, 120, "#555");

    ctx.save();
    if (player.direction === 1) {
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1);
        drawSprite(sprites.player, 0, 0, player.width, player.height, player.color);
    } else {
        drawSprite(sprites.player, player.x, player.y, player.width, player.height, player.color);
    }
    ctx.restore();

    ctx.restore();
}

gameLoop();