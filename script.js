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
function viewImage(thumbnail) {
    const modal = thumbnail.closest('.modal');
    const mainView = modal.querySelector('.project-showcase .img-placeholder.main');
    
    // 내용 교체 (나중에 img src 교체로 변경 가능)
    mainView.innerHTML = thumbnail.innerHTML;
    
    // 클릭 효과 (배경 깜빡임)
    const originalBg = mainView.style.background;
    mainView.style.background = "#444";
    setTimeout(() => { mainView.style.background = originalBg; }, 150);
}

/* =========================================
   2. 게임 & 물리 엔진 (WASD + 점프)
   ========================================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WORLD_WIDTH = 3000; 
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let groundY = canvasHeight - 100;

const GRAVITY = 0.8;      
const JUMP_POWER = 18;    

const player = {
    x: 100,
    y: 0, 
    width: 40,
    height: 40,
    color: '#3498db',
    speed: 7,
    velX: 0,
    velY: 0,
    isGrounded: false
};

const camera = { x: 0, y: 0 };
const keys = { w: false, a: false, s: false, d: false };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    groundY = canvasHeight - 100;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 키보드 이벤트
document.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal.active')) return;

    switch(e.code) {
        case 'KeyD': keys.d = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyW': 
        case 'Space': keys.w = true; break;
        case 'KeyS': keys.s = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyD': keys.d = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyW': 
        case 'Space': keys.w = false; break;
        case 'KeyS': keys.s = false; break;
    }
});

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // 이동
    if (keys.d) player.velX = player.speed;
    else if (keys.a) player.velX = -player.speed;
    else player.velX = 0;

    player.x += player.velX;

    // 점프
    if (keys.w && player.isGrounded) {
        player.velY = -JUMP_POWER;
        player.isGrounded = false;
    }

    // 중력
    player.velY += GRAVITY;
    player.y += player.velY;

    // 바닥 충돌
    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.velY = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }

    // 경계 제한
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width;

    // 카메라 이동
    camera.x = player.x - canvasWidth / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > WORLD_WIDTH - canvasWidth) camera.x = WORLD_WIDTH - canvasWidth;

    // HTML 요소 동기화
    document.getElementById('world-space').style.transform = `translateX(${-camera.x}px)`;
}

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.translate(-camera.x, 0);

    // 배경
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, WORLD_WIDTH, canvasHeight);

    // 바닥
    ctx.fillStyle = "#444";
    ctx.fillRect(0, groundY, WORLD_WIDTH, 100);

    // 가구들
    ctx.fillStyle = "#555"; 
    ctx.fillRect(300, groundY - 100, 120, 100);
    ctx.fillRect(900, groundY - 140, 100, 140);
    ctx.fillRect(1600, groundY - 180, 150, 180);
    ctx.fillRect(2300, groundY - 120, 100, 120);

    // 플레이어
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.restore();
}

gameLoop();