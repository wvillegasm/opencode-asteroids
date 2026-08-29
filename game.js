'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Shooting star config ──────────────────────────────────────────────────────
const SHOOTING_STAR_SPEED         = 250;   // px/s, ~3x fastest normal asteroid
const SHOOTING_STAR_RADIUS        = 18;
const SHOOTING_STAR_POINTS        = 200;
const SHOOTING_STAR_TTL           = 6;     // safety cap before forced despawn (s)
const SHOOTING_STAR_SPAWN_INTERVAL = [20, 35]; // rare special-event spawn (s)
const SHOOTING_STAR_TRAIL_MAX     = 14;    // trailing comet points

// ── Power-up config ────────────────────────────────────────────────────────────
const POWERUP_RADIUS          = 12;   // collision/draw radius
const POWERUP_TTL             = 10;   // seconds the pickup stays on screen
const POWERUP_SPAWN_INTERVAL  = [15, 25]; // random spawn delay range [s]
const POWERUP_DRIFT_SPEED     = 40;   // slow drifting speed
const SPEED_POWER_DURATION    = 5;    // seconds of effect
const SPEED_THRUST_MULTIPLIER = 2;    // thrust multiplier while active

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── ShootingStar ──────────────────────────────────────────────────────────────
// Special fast asteroid: streaks across the screen once from one edge to the
// opposite, despawns on exit or when its TTL runs out. Awarded with bonus
// points but does not split. Warm comet trail visual.
class ShootingStar {
  constructor(x, y, angle) {
    this.x      = x;
    this.y      = y;
    this.radius = SHOOTING_STAR_RADIUS;
    this.dead   = false;

    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;

    this.life = SHOOTING_STAR_TTL;
    this.ttl  = this.life;

    this.rot       = rand(0, Math.PI * 2);
    this.rotSpeed  = rand(-3, 3);   // spins faster than normal asteroids
    this.trail     = [];

    // Irregular polygon, slightly smaller jitter than a normal asteroid
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.7, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    // No edge wrapping: streaks across once and leaves.
    this.x   += this.vx * dt;
    this.y   += this.vy * dt;
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;

    // Push trail sample
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > SHOOTING_STAR_TRAIL_MAX) this.trail.shift();

    // Despawn when fully off-screen (with a margin) or TTL expired
    const M = this.radius * 2;
    if (this.x < -M || this.x > W + M || this.y < -M || this.y > H + M || this.ttl <= 0)
      this.dead = true;
  }

  split() { return []; }   // never splits

  draw() {
    // Comet trail — older points fainter
    for (let i = 1; i < this.trail.length; i++) {
      const a = i / this.trail.length;
      ctx.strokeStyle = `rgba(255,180,60,${(a * 0.6).toFixed(2)})`;
      ctx.lineWidth = a * 3;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
    }

    // Blink in the final 1.5 s
    const blink = this.ttl < 1.5 && Math.floor(this.ttl * 6) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = Math.max(0, this.ttl / this.life);
    ctx.strokeStyle = '#ffb43c';
    ctx.lineWidth   = 1.8;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); this.speedTimer = 0; }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const thrustMult = this.speedTimer > 0 ? SPEED_THRUST_MULTIPLIER : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * thrustMult * dt;
      this.vy += Math.sin(this.angle) * THRUST * thrustMult * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ──────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.radius = POWERUP_RADIUS;
    this.ttl    = POWERUP_TTL;
    this.dead   = false;
    this.bob    = rand(0, Math.PI * 2);    // phase offset for pulse animation

    const angle = rand(0, Math.PI * 2);
    this.vx = Math.cos(angle) * POWERUP_DRIFT_SPEED;
    this.vy = Math.sin(angle) * POWERUP_DRIFT_SPEED;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.bob += dt * 4;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse  = 1 + Math.sin(this.bob) * 0.15;
    const radius = this.radius * pulse;
    const fading = this.ttl < 3 && Math.floor(this.ttl * 6) % 2 === 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = fading ? 0.4 : 1;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Outer pulsing circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Bolt icon
    ctx.beginPath();
    ctx.moveTo(-3, -7);
    ctx.lineTo( 1, -1);
    ctx.lineTo(-2, -1);
    ctx.lineTo( 3,  7);
    ctx.lineTo(-1,  1);
    ctx.lineTo( 2,  1);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let powerupSpawnTimer;
let shootingStarSpawnTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnPowerUp() {
  const SAFE_DIST = 100;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (ship && Math.hypot(x - ship.x, y - ship.y) < SAFE_DIST);
  powerups.push(new PowerUp(x, y, 'speed'));
}

function spawnShootingStar() {
  // Spawn just outside a random edge, aim across the screen toward a random
  // point on the opposite side so the streak crosses diagonally.
  const side = randInt(0, 3);   // 0=top, 1=right, 2=bottom, 3=left
  let x, y, tx, ty;
  const M = SHOOTING_STAR_RADIUS * 2;
  switch (side) {
    case 0: x = rand(0, W); y = -M;        tx = rand(0, W); ty = H + M;    break;
    case 1: x = W + M;      y = rand(0, H); tx = -M;        ty = rand(0, H); break;
    case 2: x = rand(0, W); y = H + M;     tx = rand(0, W); ty = -M;       break;
    default:x = -M;         y = rand(0, H); tx = W + M;     ty = rand(0, H);
  }
  const angle = Math.atan2(ty - y, tx - x);
  shootingStars.push(new ShootingStar(x, y, angle));
}

function resetShootingStarTimer() {
  shootingStarSpawnTimer = rand(SHOOTING_STAR_SPAWN_INTERVAL[0], SHOOTING_STAR_SPAWN_INTERVAL[1]);
}

function resetPowerUpTimer() {
  powerupSpawnTimer = rand(POWERUP_SPAWN_INTERVAL[0], POWERUP_SPAWN_INTERVAL[1]);
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  resetPowerUpTimer();
  resetShootingStarTimer();
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets       = [];
  particles     = [];
  powerups      = [];
  shootingStars = [];
  resetPowerUpTimer();
  resetShootingStarTimer();
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  // Power-up spawn timer (only one on screen at a time)
  powerupSpawnTimer -= dt;
  if (powerupSpawnTimer <= 0) {
    if (powerups.length === 0) spawnPowerUp();
    resetPowerUpTimer();
  }

  // Shooting star spawn timer (rare special event, no concurrency cap)
  shootingStarSpawnTimer -= dt;
  if (shootingStarSpawnTimer <= 0) {
    spawnShootingStar();
    resetShootingStarTimer();
  }

  bullets       = bullets.filter(b => !b.dead);
  particles     = particles.filter(p => !p.dead);
  powerups      = powerups.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz (bonus, no split)
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 14);
      }
    }
  }
  shootingStars = shootingStars.filter(s => !s.dead);
  bullets       = bullets.filter(b => !b.dead);

  // Nave vs asteroide / estrella fugaz
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
    if (!ship.dead) {
      for (const s of shootingStars) {
        if (dist(ship, s) < ship.radius + s.radius * 0.82) {
          killShip();
          break;
        }
      }
    }
  }

  // Nave vs power-up (skip if ship died this tick)
  for (const p of powerups) {
    if (!ship.dead && !p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      ship.speedTimer = SPEED_POWER_DURATION;
      explode(p.x, p.y, 10);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Active speed power-up progress bar
  if (ship.speedTimer > 0) {
    const BAR_W = 200, BAR_H = 8;
    const x = W / 2 - BAR_W / 2;
    const y = H - 24;
    const fill = (ship.speedTimer / SPEED_POWER_DURATION) * BAR_W;
    ctx.save();
    // Label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SPEED', W / 2, y - 4);
    // Background track
    ctx.fillStyle = 'rgba(0,255,255,0.15)';
    ctx.fillRect(x, y, BAR_W, BAR_H);
    // Foreground fill (shrinks as timer runs out)
    ctx.fillStyle = '#0ff';
    ctx.fillRect(x, y, fill, BAR_H);
    // Border
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x, y, BAR_W, BAR_H);
    ctx.restore();
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
