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

function viewImage(thumbnail) {
    const modal = thumbnail.closest('.modal');
    const mainView = modal.querySelector('.project-showcase .img-placeholder.main');
    mainView.innerHTML = thumbnail.innerHTML;
    const originalBg = mainView.style.background;
    mainView.style.background = "#444";
    setTimeout(() => { mainView.style.background = originalBg; }, 150);
}

/* =========================================
   2. 게임 & 물리 엔진 (이미지 적용 버전)
   ========================================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ★ 도트가 흐려지지 않게 설정 (픽셀 아트 필수)
ctx.imageSmoothingEnabled = false;

const WORLD_WIDTH = 3000; 
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let groundY = canvasHeight - 100;

const GRAVITY = 0.8;      
const JUMP_POWER = 18;    

// ★ 이미지 에셋 관리자
const sprites = {
    player: new Image(),
    computer: new Image(),
    easel: new Image(),
    bookshelf: new Image(),
    arcade: new Image(),
    floor: new Image()
};

// ★ 여기에 만드신 이미지 파일명을 연결하세요! (없으면 네모 박스로 나옵니다)
sprites.player.src = 'assets/player.png';       // 플레이어 (추천: 32x32 -> 2배 export)
sprites.computer.src = 'assets/computer.png';   // 컴퓨터
sprites.easel.src = 'assets/easel.png';         // 이젤
sprites.bookshelf.src = 'assets/bookshelf.png'; // 책장
sprites.arcade.src = 'assets/arcade.png';       // 오락기
// sprites.floor.src = 'assets/floor.png';      // 바닥 패턴 (선택사항)

const player = {
    x: 100,
    y: 0, 
    width: 64,  // ★ 이미지 크기에 맞춰 조절 (32px * 2배 = 64px 추천)
    height: 64, // ★ 이미지 크기에 맞춰 조절
    color: '#3498db',
    speed: 7,
    velX: 0,
    velY: 0,
    isGrounded: false,
    direction: 1 // 1: 오른쪽, -1: 왼쪽 (이미지 반전용)
};

const camera = { x: 0, y: 0 };
const keys = { w: false, a: false, s: false, d: false };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    groundY = canvasHeight - 100;
    
    // 리사이즈 시 도트 보정 다시 적용
    ctx.imageSmoothingEnabled = false; 
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal.active')) return;
    switch(e.code) {
        case 'KeyD': keys.d = true; player.direction = 1; break; // 오른쪽
        case 'KeyA': keys.a = true; player.direction = -1; break; // 왼쪽
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

    camera.x = player.x - canvasWidth / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > WORLD_WIDTH - canvasWidth) camera.x = WORLD_WIDTH - canvasWidth;

    document.getElementById('world-space').style.transform = `translateX(${-camera.x}px)`;
}

// 이미지 그리기 도우미 함수 (이미지 없으면 네모 그리기)
function drawSprite(img, x, y, w, h, color) {
    if (img.complete && img.naturalHeight !== 0) {
        // 이미지가 로드되었으면 이미지 그리기
        ctx.drawImage(img, x, y, w, h);
    } else {
        // 이미지가 없으면 색깔 박스 그리기 (플레이스홀더)
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();
    ctx.translate(-camera.x, 0);

    // [배경]
    ctx.fillStyle = "#222"; // 나중에 배경 이미지도 drawImage로 교체 가능
    ctx.fillRect(0, 0, WORLD_WIDTH, canvasHeight);

    // [바닥]
    ctx.fillStyle = "#444";
    ctx.fillRect(0, groundY, WORLD_WIDTH, 100);

    // [오브젝트들] - drawSprite 함수 사용
    // 컴퓨터 (bottom: 100px)
    drawSprite(sprites.computer, 300, groundY - 100, 120, 100, "#555");
    
    // 이젤
    drawSprite(sprites.easel, 900, groundY - 140, 100, 140, "#555");
    
    // 책장
    drawSprite(sprites.bookshelf, 1600, groundY - 180, 150, 180, "#555");
    
    // 오락기
    drawSprite(sprites.arcade, 2300, groundY - 120, 100, 120, "#555");

    // [플레이어] (방향 전환 포함)
    ctx.save();
    if (player.direction === -1) {
        // 왼쪽을 볼 때는 캔버스를 뒤집어서 그리기
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