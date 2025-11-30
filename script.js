/* =========================================
   1. 모달(팝업) & 갤러리 기능
   ========================================= */
function openModal(id) {
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
    // 모달 열리면 게임 조작 멈춤
    keys.w = keys.a = keys.s = keys.d = false; 
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

function viewImage(element) {
    const modal = element.closest('.modal');
    const showcase = modal.querySelector('.project-showcase');
    
    if (element.dataset.type === 'video') {
        const videoId = element.dataset.videoId;
        showcase.innerHTML = `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; width:100%; height:100%; text-align:center;"><p style="color:#ccc; marginBottom:10px;">외부 재생이 허용되지 않은 영상입니다.</p><button onclick="window.open('https://www.youtube.com/watch?v=${videoId}', '_blank')" class="link-btn notion" style="cursor:pointer;">▶ 유튜브에서 영상 보기</button></div>`;
    } else if (element.tagName === 'IMG') {
        const imgSrc = element.src;
        const imgAlt = element.alt;
        showcase.innerHTML = `<img src="${imgSrc}" alt="${imgAlt}" style="width:100%; height:100%; object-fit:contain;">`;
    } else {
        const content = element.innerHTML;
        showcase.innerHTML = `<div class="img-placeholder main" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; font-family:'Galmuri11', sans-serif;">${content}</div>`;
    }
}

// ★ [NEW] 배경 음악 컨트롤
let isMusicPlaying = false;
const bgmAudio = document.getElementById('bgm-audio');
const btnMusic = document.getElementById('btn-music');

// 볼륨 설정 (약간 줄여서 은은하게)
bgmAudio.volume = 0.5;

function toggleMusic() {
    // ★ [수정] 버튼 클릭 시 포커스를 해제하여 스페이스바(점프)와 겹치는 문제 해결
    btnMusic.blur(); 

    if (isMusicPlaying) {
        bgmAudio.pause();
        isMusicPlaying = false;
        btnMusic.innerHTML = "🔇 BGM OFF";
        btnMusic.classList.remove('on');
    } else {
        playAudioSafe();
    }
}

// 안전하게 오디오 재생 시도 (실패 시 알림)
function playAudioSafe() {
    bgmAudio.play().then(() => {
        isMusicPlaying = true;
        btnMusic.innerHTML = "🎵 BGM ON";
        btnMusic.classList.add('on');
    }).catch(err => {
        console.log("음악 재생 실패:", err);
    });
}

// ★ [NEW] 자동 재생 시도 함수
// 브라우저 정책상 바로 재생이 안 될 수 있으므로, 실패 시 첫 입력(클릭/키) 때 재생하도록 예약
function tryAutoPlay() {
    bgmAudio.play().then(() => {
        isMusicPlaying = true;
        btnMusic.innerHTML = "🎵 BGM ON";
        btnMusic.classList.add('on');
    }).catch(() => {
        // 자동 재생 실패 시(사용자 인터랙션 필요), 첫 클릭이나 키 입력 시 재생 시도
        const resumeAudio = () => {
            if(!isMusicPlaying) {
                playAudioSafe();
                // 한 번 실행 후 리스너 제거
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('keydown', resumeAudio);
                document.removeEventListener('touchstart', resumeAudio);
            }
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
    });
}

/* =========================================
   2. 게임 & 물리 엔진
   ========================================= */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 게임 설정 상수
const ZOOM = 1.5;
const WORLD_WIDTH = 3000; 
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let groundY = canvasHeight - 64; 

// 델타타임 보정: 60FPS 기준
const TARGET_FPS = 60;
let lastTime = 0;

// 물리 상수 (프레임당 값)
const GRAVITY = 0.8;      
const JUMP_POWER = 18;    
const MOVE_SPEED = 7;

// 오브젝트 데이터 통합 관리
const objectConfig = [
    { id: 'zone-computer', x: 300, imgKey: 'computer' },
    { id: 'zone-easel', x: 900, imgKey: 'easel' },
    { id: 'zone-bookshelf', x: 1600, imgKey: 'bookshelf' },
    { id: 'zone-arcade', x: 2300, imgKey: 'arcade' }
];

// 이미지 자산 관리
const sprites = {
    player: new Image(),
    computer: new Image(),
    easel: new Image(),
    bookshelf: new Image(),
    arcade: new Image()
};

const imageSources = {
    player: 'assets/player.png',
    computer: 'assets/computer.png',
    easel: 'assets/easel.png',
    bookshelf: 'assets/bookshelf.png',
    arcade: 'assets/arcade.png'
};

// 플레이어 상태
const player = {
    x: 100, y: 0, width: 64, height: 64, 
    color: '#3498db', 
    velX: 0, velY: 0, isGrounded: false, direction: 1 
};

// 카메라 상태
const camera = { x: 0, y: 0 };
// 입력 상태
const keys = { w: false, a: false, s: false, d: false };

// 자산 로딩 시스템
let loadedImages = 0;
const totalImages = Object.keys(imageSources).length;

function loadAssets() {
    for (const [key, src] of Object.entries(imageSources)) {
        sprites[key].src = src;
        sprites[key].onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                // 모든 이미지가 로드되면 게임 시작
                initGame();
            }
        };
        sprites[key].onerror = () => {
            console.error(`Failed to load image: ${src}`);
            loadedImages++;
            if (loadedImages === totalImages) initGame();
        };
    }
}

// 파티클 시스템
const particles = [];
function initParticles() {
    for(let i=0; i<60; i++){
        particles.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * canvasHeight,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 0.5 - 0.25, 
            speedY: Math.random() * 0.5 - 0.25, 
            alpha: Math.random(), 
            targetAlpha: Math.random() 
        });
    }
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (Math.abs(p.targetAlpha - p.alpha) < 0.01) p.targetAlpha = Math.random(); 
        p.alpha += (p.targetAlpha - p.alpha) * 0.03; 

        if(p.x < 0) p.x = WORLD_WIDTH;
        if(p.x > WORLD_WIDTH) p.x = 0;
        if(p.y < 0) p.y = canvasHeight;
        if(p.y > canvasHeight) p.y = 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 200, ${p.alpha * 0.6})`; 
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
}

function drawBackgroundGrid() {
    const gridSize = 100;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 2;

    for (let x = 0; x <= WORLD_WIDTH; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasHeight); ctx.stroke();
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_WIDTH, y); ctx.stroke();
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    groundY = canvasHeight - 64; 
    ctx.imageSmoothingEnabled = false; 
    
    syncObjectPositions();
}
window.addEventListener('resize', resizeCanvas);

// 오브젝트 위치 동기화 함수
function syncObjectPositions() {
    objectConfig.forEach(obj => {
        const el = document.getElementById(obj.id);
        if (el) {
            el.style.left = `${obj.x}px`;
            el.style.bottom = `64px`; // 바닥 높이 고정
        }
    });
}

// 게임 초기화 (로딩 완료 후 호출)
function initGame() {
    // 로딩 화면 제거
    const loader = document.getElementById('loading-screen');
    if(loader) loader.style.display = 'none';

    resizeCanvas();
    initParticles();
    syncObjectPositions(); 
    
    // ★ [수정] 게임 시작 시 자동 재생 시도
    tryAutoPlay();

    requestAnimationFrame(gameLoop);
}

/* =========================================
   3. 입력 처리 (키보드 + 모바일)
   ========================================= */
document.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal.active')) return;

    // ★ [수정] 스페이스바나 화살표 키가 눌렸을 때, 
    // 브라우저 기본 동작(스크롤, 버튼 클릭 등)을 막아서 키 충돌 방지
    if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }

    switch(e.code) {
        case 'KeyD': case 'ArrowRight': keys.d = true; player.direction = 1; break; 
        case 'KeyA': case 'ArrowLeft': keys.a = true; player.direction = -1; break; 
        case 'KeyW': case 'ArrowUp': case 'Space': keys.w = true; break;
        case 'KeyS': case 'ArrowDown': keys.s = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyD': case 'ArrowRight': keys.d = false; break;
        case 'KeyA': case 'ArrowLeft': keys.a = false; break;
        case 'KeyW': case 'ArrowUp': case 'Space': keys.w = false; break;
        case 'KeyS': case 'ArrowDown': keys.s = false; break;
    }
});

// 모바일 터치 컨트롤
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');

function addTouchControl(btn, key, dir) {
    if(!btn) return;
    btn.addEventListener('touchstart', (e) => { 
        e.preventDefault(); // 스크롤/줌 방지
        keys[key] = true; 
        if(dir) player.direction = dir; 
    });
    btn.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        keys[key] = false; 
    });
}

addTouchControl(btnLeft, 'a', -1);
addTouchControl(btnRight, 'd', 1);
addTouchControl(btnJump, 'w', null);


/* =========================================
   4. 메인 루프 (델타타임 적용)
   ========================================= */
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // 초 단위 경과 시간
    lastTime = timestamp;

    let dtScale = dt * TARGET_FPS;
    if (dtScale > 4) dtScale = 4; 

    update(dtScale);
    draw();
    requestAnimationFrame(gameLoop);
}

function update(dtScale) {
    // 1. 좌우 이동
    if (keys.d) player.velX = MOVE_SPEED;
    else if (keys.a) player.velX = -MOVE_SPEED;
    else player.velX = 0;

    player.x += player.velX * dtScale;

    // 2. 점프
    if (keys.w && player.isGrounded) {
        player.velY = -JUMP_POWER;
        player.isGrounded = false;
    }

    // 3. 중력 적용
    player.velY += GRAVITY * dtScale;
    player.y += player.velY * dtScale;

    // 4. 바닥 충돌 처리
    if (player.y + player.height > groundY) {
        player.y = groundY - player.height;
        player.velY = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }

    // 5. 월드 경계 처리
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width;

    updateParticles();

    // 6. 카메라 로직
    const zoomedWidth = canvasWidth / ZOOM;
    camera.x = player.x - zoomedWidth / 2;
    // 카메라 경계 클램핑
    if (camera.x < 0) camera.x = 0;
    if (camera.x > WORLD_WIDTH - zoomedWidth) camera.x = WORLD_WIDTH - zoomedWidth;

    // Y축 카메라는 바닥이 보이게 고정
    camera.y = groundY - (canvasHeight - 64) / ZOOM;

    // 7. HTML 요소(클릭 존) 동기화
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

    // [배경]
    const wallGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    wallGrad.addColorStop(0, "#1a1a2e"); 
    wallGrad.addColorStop(1, "#111");    
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, WORLD_WIDTH, canvasHeight);

    drawBackgroundGrid();
    drawParticles();

    // [바닥]
    ctx.fillStyle = "#222"; 
    ctx.fillRect(0, groundY, WORLD_WIDTH, 64);

    // [바닥 선]
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ffff00"; 
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(WORLD_WIDTH, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // [가구 오브젝트]
    const objSize = 128;
    objectConfig.forEach(obj => {
        const img = sprites[obj.imgKey];
        drawSprite(img, obj.x, groundY - objSize, objSize, objSize, "#555");
    });

    // [플레이어]
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

// 시작: 자산 로딩
loadAssets();