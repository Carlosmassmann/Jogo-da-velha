const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const uiStart    = document.getElementById('ui-start');
const uiGameover = document.getElementById('ui-gameover');
const hud        = document.getElementById('hud');
const hudScore   = document.getElementById('hud-score');
const hudLevel   = document.getElementById('hud-level');
const finalScore = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);

// Canvas size
const W = 480;
const H = 640;
canvas.width  = W;
canvas.height = H;

// Falling object types
const OBJECTS = [
  { emoji: '🪨', size: 38, speed: 1.0 },
  { emoji: '⚡', size: 32, speed: 1.6 },
  { emoji: '🔥', size: 34, speed: 1.3 },
  { emoji: '💣', size: 36, speed: 0.9 },
  { emoji: '❄️',  size: 32, speed: 1.1 },
  { emoji: '☄️',  size: 40, speed: 1.4 },
];

// Star background
const STARS = Array.from({ length: 80 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  r: Math.random() * 1.5 + 0.3,
  a: Math.random(),
}));

// Game state
let player, fallers, score, level, bestScore, spawnTimer, spawnInterval;
let running = false;
let lastTime = 0;
let keys = {};

// Input
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

// Touch / mobile
let touchX = null;
canvas.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
canvas.addEventListener('touchmove',  e => {
  if (touchX === null) return;
  const dx = e.touches[0].clientX - touchX;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x + dx));
  touchX = e.touches[0].clientX;
}, { passive: true });
canvas.addEventListener('touchend', () => { touchX = null; }, { passive: true });

function startGame() {
  uiStart.classList.add('hidden');
  uiGameover.classList.add('hidden');
  hud.classList.remove('hidden');

  player = {
    x: W / 2,
    y: H - 48,
    w: 52,
    h: 36,
    speed: 320,  // px per second
    emoji: '🚀',
  };

  fallers       = [];
  score         = 0;
  level         = 1;
  spawnTimer    = 0;
  spawnInterval = 1.2; // seconds between spawns
  bestScore     = bestScore || 0;
  running       = true;
  lastTime      = performance.now();

  requestAnimationFrame(loop);
}

function spawnFaller() {
  const type = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
  const speedMult = 1 + (level - 1) * 0.18;
  fallers.push({
    x: type.size / 2 + Math.random() * (W - type.size),
    y: -type.size,
    size: type.size,
    speed: type.speed * speedMult * 180,
    emoji: type.emoji,
    rot: (Math.random() - 0.5) * 0.06,
    angle: 0,
  });
}

function update(dt) {
  // Move player
  const spd = player.speed * dt;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) player.x -= spd;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += spd;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));

  // Spawn fallers
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnFaller();
    // Extra faller at higher levels
    if (level >= 4 && Math.random() < 0.4) spawnFaller();
    spawnTimer = spawnInterval;
  }

  // Move fallers
  for (const f of fallers) {
    f.y += f.speed * dt;
    f.angle += f.rot;
  }

  // Remove off-screen fallers & add score
  const before = fallers.length;
  fallers = fallers.filter(f => f.y < H + f.size);
  score += (before - fallers.length) * 10;

  // Score ticks up over time
  score += dt * 5;

  // Level up
  level = 1 + Math.floor(score / 300);
  spawnInterval = Math.max(0.35, 1.2 - (level - 1) * 0.1);

  // Collision detection
  for (const f of fallers) {
    const dx = Math.abs(f.x - player.x);
    const dy = Math.abs(f.y - player.y);
    const hitW = (f.size * 0.4 + player.w * 0.38);
    const hitH = (f.size * 0.4 + player.h * 0.38);
    if (dx < hitW && dy < hitH) {
      endGame();
      return;
    }
  }

  hudScore.textContent = Math.floor(score);
  hudLevel.textContent = level;
}

function drawStars() {
  for (const s of STARS) {
    ctx.globalAlpha = s.a * 0.8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEmoji(emoji, x, y, size, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, 0);
  ctx.restore();
}

function draw() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(1, '#1a0a3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  drawStars();

  // Ground line
  ctx.strokeStyle = '#ffffff18';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 20);
  ctx.lineTo(W, H - 20);
  ctx.stroke();

  // Fallers
  for (const f of fallers) drawEmoji(f.emoji, f.x, f.y, f.size, f.angle);

  // Player
  drawEmoji(player.emoji, player.x, player.y, 44);

  // Thruster flame
  ctx.save();
  ctx.translate(player.x, player.y + 24);
  const flameGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
  flameGrad.addColorStop(0, '#fff');
  flameGrad.addColorStop(0.3, '#f0a500');
  flameGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function loop(ts) {
  if (!running) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  update(dt);
  if (!running) return;
  draw();
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  hud.classList.add('hidden');

  bestScore = Math.max(bestScore, Math.floor(score));
  finalScore.textContent  = Math.floor(score);
  bestScoreEl.textContent = bestScore;

  // Death flash
  ctx.fillStyle = 'rgba(255, 50, 50, 0.35)';
  ctx.fillRect(0, 0, W, H);

  setTimeout(() => uiGameover.classList.remove('hidden'), 400);
}
