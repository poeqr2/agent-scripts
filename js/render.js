"use strict";

// ============================================================
// CANVAS SETUP
// ============================================================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function waterTopY() { return H * 0.42; }

// ============================================================
// TIME OF DAY (8-min cycle)
// ============================================================
const DAY_CYCLE_MS = 8 * 60 * 1000; // 8 minutes per full day

function getTimeOfDay(time) {
  // Returns 0..1 where 0=dawn, 0.25=noon, 0.5=dusk, 0.75=midnight
  const phase = ((time * 1000) % DAY_CYCLE_MS) / DAY_CYCLE_MS;
  return phase;
}

function isNight(time) {
  const phase = getTimeOfDay(time);
  return phase > 0.6 || phase < 0.1; // ~night period
}

function getDayNightAlpha(time) {
  // Returns darkness overlay alpha (0 = full day, 0.4 = night)
  const phase = getTimeOfDay(time);
  if (phase >= 0.6 && phase <= 0.9) {
    // Transition into night
    const t = (phase - 0.6) / 0.3;
    return t * 0.35;
  } else if (phase > 0.9 || phase < 0.05) {
    return 0.35;
  } else if (phase >= 0.05 && phase <= 0.15) {
    // Dawn
    const t = (phase - 0.05) / 0.1;
    return (1 - t) * 0.35;
  }
  return 0;
}

// ============================================================
// AMBIENT FISH
// ============================================================
const ambient = [];

function spawnAmbient() {
  const rarityRoll = Math.random();
  let rarity = 'Common';
  if (rarityRoll > 0.97) rarity = 'Legendary';
  else if (rarityRoll > 0.85) rarity = 'Epic';
  else if (rarityRoll > 0.65) rarity = 'Rare';
  else if (rarityRoll > 0.4) rarity = 'Uncommon';
  const pool = FISH.filter(f => f.rarity === rarity);
  if (!pool.length) return;
  const proto = pool[Math.floor(Math.random() * pool.length)];
  const dir = Math.random() < 0.5 ? 1 : -1;
  ambient.push({
    proto, x: dir > 0 ? -50 : W + 50,
    y: waterTopY() + 40 + Math.random() * (H - waterTopY() - 80),
    vx: dir * (0.4 + Math.random() * 0.8) * proto.sp,
    phase: Math.random() * Math.PI * 2,
    wob: 0.3 + Math.random() * 0.4,
    size: 22 + Math.random() * 14 + (rarity === 'Legendary' ? 10 : 0),
  });
}

function updateAmbient(dt) {
  if (ambient.length < 9 && Math.random() < 0.02) spawnAmbient();
  for (let i = ambient.length - 1; i >= 0; i--) {
    const a = ambient[i];
    a.phase += dt * 2;
    a.x += a.vx * dt * 60;
    a.y += Math.sin(a.phase) * a.wob;
    if (a.y < waterTopY() + 30) a.y = waterTopY() + 30;
    if (a.y > H - 30) a.y = H - 30;
    if (a.x < -80 || a.x > W + 80) ambient.splice(i, 1);
  }
}

function drawAmbient() {
  for (const a of ambient) {
    ctx.save();
    ctx.translate(a.x, a.y);
    if (a.vx < 0) ctx.scale(-1, 1);
    ctx.font = `${a.size}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.85;
    if (a.proto.rarity === 'Legendary' || a.proto.rarity === 'Mythic') {
      ctx.shadowColor = RARITY[a.proto.rarity].color;
      ctx.shadowBlur = 18;
    }
    ctx.fillText(a.proto.e, 0, 0);
    ctx.restore();
  }
}

// ============================================================
// PARTICLES
// ============================================================
const particles = [];

function addSplash(x, y) {
  for (let i = 0; i < 14; i++) {
    particles.push({ x, y, vx: (Math.random()-0.5)*4, vy: -Math.random()*5-1, g: 0.18, r: 2+Math.random()*3, life: 1, decay: 0.018+Math.random()*0.02, color: 'rgba(170,220,255,' });
  }
}

function addSparkle(x, y, color = 'rgba(255,210,74,') {
  for (let i = 0; i < 18; i++) {
    particles.push({ x, y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, g: 0, r: 1+Math.random()*3, life: 1, decay: 0.02, color });
  }
}

function addLineSnap(sx, sy, ex, ey) {
  // Broken line effect - small white particles along the line path
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    particles.push({
      x: sx + (ex-sx)*t + (Math.random()-0.5)*10,
      y: sy + (ey-sy)*t + (Math.random()-0.5)*10,
      vx: (Math.random()-0.5)*3, vy: -Math.random()*2-1, g: 0.1,
      r: 1+Math.random()*2, life: 1, decay: 0.03, color: 'rgba(255,255,255,'
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += p.g;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = p.color + p.life.toFixed(2) + ')';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
// SCENE DRAWING
// ============================================================
function drawScene(dt, time) {
  const z = ZONES[state.zoneIdx];
  const p = z.palette;
  const wT = waterTopY();

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, wT);
  skyGrad.addColorStop(0, p.sky1);
  skyGrad.addColorStop(0.5, p.sky2);
  skyGrad.addColorStop(1, p.sky3);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, wT);

  // Sun/Moon
  const sunX = W * 0.78, sunY = wT * 0.45;
  ctx.save();
  ctx.shadowColor = z.id === 'deep' || z.id === 'abyss' ? '#cfeaff' : '#ffd24a';
  ctx.shadowBlur = 40;
  ctx.fillStyle = z.id === 'deep' || z.id === 'abyss' ? '#e6e8f5' : '#fff5d2';
  ctx.beginPath(); ctx.arc(sunX, sunY, 38, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // Clouds
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 4; i++) {
    const cx = ((time * 6 + i * 250) % (W + 200)) - 100;
    const cy = 40 + i * 32;
    ctx.beginPath();
    ctx.arc(cx, cy, 28+i*4, 0, Math.PI*2);
    ctx.arc(cx+(28+i*4)*0.8, cy+(28+i*4)*0.2, (28+i*4)*0.7, 0, Math.PI*2);
    ctx.arc(cx-(28+i*4)*0.7, cy+(28+i*4)*0.3, (28+i*4)*0.6, 0, Math.PI*2);
    ctx.fill();
  }

  // Water
  const waterGrad = ctx.createLinearGradient(0, wT, 0, H);
  waterGrad.addColorStop(0, p.shallow);
  waterGrad.addColorStop(0.4, p.mid);
  waterGrad.addColorStop(1, p.deep);
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, wT, W, H - wT);

  // Wave shimmer
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = wT + 6 + i*8 + Math.sin((x + time*80)*0.025 + i)*3;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Light rays
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i++) {
    const rx = (W*0.2) + i*(W*0.18) + Math.sin(time+i)*20;
    ctx.beginPath();
    ctx.moveTo(rx-30, wT); ctx.lineTo(rx+30, wT);
    ctx.lineTo(rx+80, H); ctx.lineTo(rx-80, H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // Ambient bubbles
  if (Math.random() < 0.5) {
    particles.push({ x: Math.random()*W, y: H+5, vx: (Math.random()-0.5)*0.4, vy: -0.8-Math.random()*0.8, g: 0, r: 1+Math.random()*3, life: 1, decay: 0.005, color: 'rgba(180,230,255,' });
  }

  // Boat
  drawBoat(time);

  // Ambient fish
  drawAmbient();

  // Day/night overlay
  const nightAlpha = getDayNightAlpha(time);
  if (nightAlpha > 0) {
    ctx.fillStyle = `rgba(5,5,30,${nightAlpha})`;
    ctx.fillRect(0, 0, W, H);
    // Stars at night
    if (nightAlpha > 0.2) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 20; i++) {
        const sx = (Math.sin(i*127.1 + time*0.1)*0.5+0.5) * W;
        const sy = (Math.cos(i*311.7 + time*0.05)*0.3+0.15) * wT;
        ctx.beginPath(); ctx.arc(sx, sy, 1+Math.sin(time*2+i)*0.5, 0, Math.PI*2); ctx.fill();
      }
    }
  }
}

function drawBoat(time) {
  const cx = W / 2;
  const wT = waterTopY();
  const bob = Math.sin(time * 1.5) * 2;
  const by = wT - 18 + bob;
  const skin = BOAT_SKINS.find(s => s.id === state.boatSkin) || BOAT_SKINS[0];
  const hat = HAT_COLORS.find(h => h.id === state.hatColor) || HAT_COLORS[0];

  ctx.save();
  ctx.translate(cx, by);
  ctx.rotate(Math.sin(time * 1.5) * 0.025);

  // Hull
  ctx.fillStyle = skin.color;
  ctx.beginPath();
  ctx.moveTo(-50, 0);
  ctx.quadraticCurveTo(0, 22, 50, 0);
  ctx.lineTo(45, -2); ctx.lineTo(-45, -2);
  ctx.closePath(); ctx.fill();

  // Stripe
  ctx.fillStyle = skin.stripe;
  ctx.fillRect(-44, -10, 88, 8);

  // Mast
  ctx.fillStyle = '#3d2410';
  ctx.fillRect(-2, -45, 3, 35);

  // Flag
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.moveTo(2,-45); ctx.lineTo(18,-42); ctx.lineTo(2,-38); ctx.closePath(); ctx.fill();

  // Angler body
  ctx.fillStyle = '#3d2818';
  ctx.fillRect(-6, -22, 12, 14);
  // Head
  ctx.fillStyle = '#f4cba6';
  ctx.beginPath(); ctx.arc(0, -28, 5, 0, Math.PI*2); ctx.fill();
  // Hat
  ctx.fillStyle = hat.color;
  ctx.fillRect(-7, -33, 14, 4);
  ctx.fillRect(-5, -36, 10, 4);

  ctx.restore();
}
