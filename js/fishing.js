"use strict";

// ============================================================
// FISHING PHASES
// ============================================================
const PHASE = { IDLE: 0, CHARGING: 1, CASTING: 2, WAITING: 3, BITE: 4, REELING: 5 };
let phase = PHASE.IDLE;
let phaseTime = 0;
let cast = { distance: 0, bobberX: 0, bobberY: 0, targetX: 0, targetY: 0, power: 0 };
let pendingFish = null;
let chargePower = 0, chargeDir = 1;
let biteWindow = 0, bitePulse = 0;

// Reel mini-game
let reel = { fishY: 0.5, fishVy: 0, fishTargetY: 0.5, fishTargetTimer: 0, zoneY: 0.5, zoneVy: 0, zoneSize: 0.2, progress: 0.3, pulling: false, duration: 0, maxDuration: 14, difficulty: 1 };

// ============================================================
// ROLL FISH
// ============================================================
function rollFish() {
  const z = ZONES[state.zoneIdx];
  const rod = RODS[state.rodIdx];
  const time = performance.now() / 1000;
  const nightBonus = isNight(time) ? 1.5 : 1.0;
  const baitBonus = (state.activeBait === 'lucky') ? 1.5 : 1.0;

  // Check boss lure
  if (state.activeBait === 'boss' && z.id === 'abyss') {
    state.activeBait = null;
    const boss = BOSS_FISH[Math.floor(Math.random() * BOSS_FISH.length)];
    const sizeRoll = 0.8 + Math.random() * 0.4;
    return { proto: boss, rarity: 'Mythic', weight: +(boss.kg * sizeRoll).toFixed(2), value: Math.round(boss.base * sizeRoll), boss: true };
  }

  // Boss chance in Abyss at night (3%)
  if (z.id === 'abyss' && isNight(time) && Math.random() < 0.03) {
    const boss = BOSS_FISH[Math.floor(Math.random() * BOSS_FISH.length)];
    const sizeRoll = 0.8 + Math.random() * 0.4;
    return { proto: boss, rarity: 'Mythic', weight: +(boss.kg * sizeRoll).toFixed(2), value: Math.round(boss.base * sizeRoll), boss: true };
  }

  // Normal fish roll
  const buckets = {};
  for (const r in RARITY) {
    const w = RARITY[r].weight * (z.rarityBoost[r] ?? 1.0) * (1 + (rod.power-1)*0.05) * nightBonus * baitBonus;
    if (w > 0) buckets[r] = w;
  }
  const total = Object.values(buckets).reduce((a,b) => a+b, 0);
  let roll = Math.random() * total;
  let chosenRarity = 'Common';
  for (const r in buckets) { roll -= buckets[r]; if (roll <= 0) { chosenRarity = r; break; } }

  const pool = FISH.filter(f => f.rarity === chosenRarity);
  if (!pool.length) return null;
  const proto = pool[Math.floor(Math.random() * pool.length)];
  const sizeRoll = 0.7 + Math.random() * 0.7;
  const wKg = +(proto.kg * sizeRoll).toFixed(2);
  let value = Math.round(proto.base * RARITY[chosenRarity].mult * sizeRoll);

  // Gold bait doubles value
  if (state.activeBait === 'gold') { value *= 2; }

  // Clear consumable bait (lucky/gold consumed on roll)
  if (state.activeBait === 'lucky' || state.activeBait === 'gold') {
    state.activeBait = null;
  }

  return { proto, rarity: chosenRarity, weight: wKg, value, boss: false };
}

// ============================================================
// CAST
// ============================================================
function startCharge() {
  const z = ZONES[state.zoneIdx];
  if (state.energy < z.energyCost) {
    showToast(`⚡ Out of energy! Refills in ${formatCountdown(msUntilReset())}`, 2800);
    return;
  }
  phase = PHASE.CHARGING;
  chargePower = 0; chargeDir = 1;
  document.getElementById('power-meter').style.display = 'block';
  setActionBtn('RELEASE 🎯', 'warn');
  setHint('Release at the white line for max distance!');
}

function releaseCharge() {
  if (phase !== PHASE.CHARGING) return;
  const accuracy = 1 - Math.abs(chargePower - 0.7);
  cast.power = chargePower;
  cast.distance = 0.3 + chargePower * 0.7;
  document.getElementById('power-meter').style.display = 'none';

  // Spend energy
  const z = ZONES[state.zoneIdx];
  state.energy = Math.max(0, state.energy - z.energyCost);
  state.totalCasts++;
  state.dailyCasts++;
  saveGame();
  updateEnergyUI();

  // Cast animation
  phase = PHASE.CASTING; phaseTime = 0;
  cast.bobberX = W / 2; cast.bobberY = waterTopY() - 16;
  const offset = (Math.random()-0.5) * (1-accuracy) * 200;
  cast.targetX = W/2 + offset;
  cast.targetY = waterTopY() + 30 + cast.distance * (H - waterTopY() - 80);

  setActionBtn('...', '');
  setHint('Casting...');
  sfx('cast');

  // Track quest: visit zone
  updateQuestProgress('visit_zone', state.zoneIdx);
}

function castUpdate(dt) {
  phaseTime += dt;
  const t = Math.min(phaseTime / 0.6, 1);
  const sx = W/2, sy = waterTopY()-16;
  cast.bobberX = sx + (cast.targetX-sx)*t;
  cast.bobberY = sy + (cast.targetY-sy)*t + (-Math.min(120, cast.distance*200))*Math.sin(Math.PI*t);

  if (t >= 1) {
    cast.bobberY = cast.targetY;
    addSplash(cast.bobberX, cast.bobberY);
    sfx('splash');
    phase = PHASE.WAITING; phaseTime = 0;
    biteWindow = 1.5 + Math.random()*4 + cast.distance*1.5;
    setActionBtn('WAITING...', '');
    setHint('🫧 Watch the bobber...');
  }
}

function waitUpdate(dt) {
  phaseTime += dt;
  if (phaseTime >= biteWindow) {
    pendingFish = rollFish();
    if (!pendingFish) { resetToIdle(); return; }

    // Magnet bait = auto-hook
    if (state.activeBait === 'magnet') {
      state.activeBait = null;
      hookFish();
      return;
    }

    phase = PHASE.BITE; phaseTime = 0; bitePulse = 0;
    sfx('bite');
    setActionBtn('HOOK! 🎯', 'danger');
    setHint('Tap quickly to set the hook!');
  }
}

function biteUpdate(dt) {
  phaseTime += dt; bitePulse += dt;
  if (phaseTime > 1.4) {
    sfx('miss');
    showToast('💨 Got away!');
    // Line snap animation
    addLineSnap(W/2, waterTopY()-28, cast.bobberX, cast.bobberY);
    onFishEscaped();
    resetToIdle();
  }
}

function hookFish() {
  if (phase !== PHASE.BITE && phase !== PHASE.WAITING) return;
  if (!pendingFish) return;
  phase = PHASE.REELING; phaseTime = 0;

  const rod = RODS[state.rodIdx];
  const rarityIdx = Object.keys(RARITY).indexOf(pendingFish.rarity);
  const bossMult = pendingFish.boss ? 1.8 : 1.0;
  reel.difficulty = (0.6 + rarityIdx * 0.35) * bossMult;
  reel.zoneSize = Math.max(0.10, (0.30 - rarityIdx*0.025) * (0.85 + (rod.lineWidth-1)*0.4) / bossMult);
  reel.fishY = 0.5; reel.fishVy = 0;
  reel.fishTargetY = 0.3 + Math.random()*0.4;
  reel.zoneY = 0.5; reel.zoneVy = 0;
  reel.progress = 0.35; reel.pulling = false;
  reel.duration = 0;
  reel.maxDuration = pendingFish.boss ? 25 : (14 + rarityIdx*3);

  document.getElementById('reel-game').style.display = 'block';
  setActionBtn('HOLD 🎣', 'warn');
  setHint(pendingFish.boss ? '⚠️ BOSS! Hold steady!' : 'HOLD to pull up. Release to drop.');
  sfx('hook');
}

function reelUpdate(dt) {
  reel.duration += dt;
  if (reel.duration > reel.maxDuration) { finishReel(false); return; }

  reel.fishTargetTimer -= dt;
  if (reel.fishTargetTimer <= 0) {
    reel.fishTargetY = 0.1 + Math.random()*0.8;
    reel.fishTargetTimer = 0.4 + Math.random()*(1.0/reel.difficulty);
  }
  const fishAccel = (reel.fishTargetY - reel.fishY) * 4 * reel.difficulty;
  reel.fishVy += fishAccel * dt;
  reel.fishVy *= 0.9;
  reel.fishY += reel.fishVy * dt;
  reel.fishY = Math.max(0.05, Math.min(0.95, reel.fishY));

  const pullForce = reel.pulling ? -2.0 * RODS[state.rodIdx].reelSpeed : 1.4;
  reel.zoneVy += pullForce * dt;
  reel.zoneVy *= 0.92;
  reel.zoneY += reel.zoneVy * dt;
  if (reel.zoneY < reel.zoneSize/2) { reel.zoneY = reel.zoneSize/2; reel.zoneVy = 0; }
  if (reel.zoneY > 1-reel.zoneSize/2) { reel.zoneY = 1-reel.zoneSize/2; reel.zoneVy = 0; }

  const inside = Math.abs(reel.fishY - reel.zoneY) < reel.zoneSize/2;
  reel.progress += (inside ? 0.22*RODS[state.rodIdx].reelSpeed : -0.14) * dt;

  if (reel.progress >= 1) { finishReel(true); return; }
  if (reel.progress <= 0) { finishReel(false); return; }

  // Update reel DOM
  const fishEl = document.getElementById('reel-fish');
  const zoneEl = document.getElementById('reel-zone');
  const progEl = document.getElementById('reel-progress');
  // Fish size scales with weight
  const fishSize = pendingFish.boss ? 36 : Math.min(34, 22 + pendingFish.weight * 0.02);
  fishEl.style.fontSize = fishSize + 'px';
  fishEl.textContent = pendingFish.proto.e;
  fishEl.style.top = (reel.fishY*100) + '%';
  zoneEl.style.height = (reel.zoneSize*100) + '%';
  zoneEl.style.top = ((reel.zoneY - reel.zoneSize/2)*100) + '%';
  zoneEl.style.background = inside ? 'linear-gradient(180deg, rgba(46,204,113,0.8), rgba(46,204,113,0.45))' : 'linear-gradient(180deg, rgba(78,205,196,0.7), rgba(78,205,196,0.4))';
  zoneEl.style.borderColor = inside ? '#2ecc71' : '#4ecdc4';
  progEl.style.height = (reel.progress*100) + '%';
}

function finishReel(success) {
  document.getElementById('reel-game').style.display = 'none';
  if (success && pendingFish) {
    landFish(pendingFish);
  } else {
    sfx('miss');
    showToast('🐟 Got away!');
    addLineSnap(W/2, waterTopY()-28, cast.bobberX, cast.bobberY);
    onFishEscaped();
  }
  resetToIdle();
}

// ============================================================
// LAND FISH (combo, quests, bestiary, record)
// ============================================================
function landFish(f) {
  // Combo multiplier
  state.streak++;
  if (state.streak > state.maxStreak) state.maxStreak = state.streak;
  const comboMult = Math.min(2.5, 1.0 + (state.streak - 1) * 0.25);
  const finalValue = Math.round(f.value * comboMult);

  state.gold += finalValue;
  state.totalGoldEarned += finalValue;
  state.caught += 1;
  state.dailyGold += finalValue;
  state.dailyKg += f.weight;

  // Inventory
  const key = f.proto.name;
  if (!state.inventory[key]) {
    state.inventory[key] = { name: f.proto.name, e: f.proto.e, rarity: f.rarity, count: 0, totalKg: 0, totalValue: 0 };
  }
  state.inventory[key].count += 1;
  state.inventory[key].totalKg += f.weight;
  state.inventory[key].totalValue += finalValue;

  // Bestiary + NEW RECORD check
  let isNewRecord = false;
  if (!state.bestiary[key]) {
    state.bestiary[key] = { caught: true, maxKg: f.weight, count: 1 };
    isNewRecord = true;
  } else {
    state.bestiary[key].count++;
    if (f.weight > state.bestiary[key].maxKg) {
      state.bestiary[key].maxKg = f.weight;
      isNewRecord = true;
    }
  }

  saveGame();
  updateUI();

  // Show catch card
  const card = document.getElementById('catch-card');
  document.getElementById('catch-emoji').textContent = f.proto.e;
  document.getElementById('catch-name').textContent = f.proto.name + (isNewRecord ? ' ⭐ NEW RECORD!' : '');
  const rt = document.getElementById('catch-rarity');
  rt.textContent = f.rarity + (f.boss ? ' BOSS' : '');
  rt.className = 'rarity-tag rarity-' + f.rarity;
  document.getElementById('catch-weight').textContent = f.weight.toFixed(2) + 'kg';
  const comboStr = comboMult > 1 ? ` (x${comboMult.toFixed(1)})` : '';
  document.getElementById('catch-value').textContent = '+' + finalValue + comboStr;
  card.classList.add('show');
  setTimeout(() => card.classList.remove('show'), 2500);

  // Record bonus
  if (isNewRecord) {
    const bonus = Math.round(finalValue * 0.25);
    state.gold += bonus;
    state.totalGoldEarned += bonus;
    setTimeout(() => showToast(`⭐ Record bonus: +${bonus} 🪙`, 2000), 800);
  }

  addSparkle(W/2, waterTopY()-30, 'rgba(78,205,196,');
  if (f.rarity === 'Legendary' || f.rarity === 'Mythic') addSparkle(W/2, H/2, 'rgba(255,210,74,');

  sfx('catch_' + f.rarity);

  // Quest progress
  updateQuestProgress('catch_any', 1);
  updateQuestProgress('catch_rarity', f.rarity);
  updateQuestProgress('earn_gold', finalValue);
  updateQuestProgress('weight_total', f.weight);
  updateQuestProgress('streak', state.streak);

  // Achievement check
  checkAchievements();
}

function onFishEscaped() {
  // Reset combo streak
  state.streak = 0;
  saveGame();
}

function resetToIdle() {
  phase = PHASE.IDLE; phaseTime = 0;
  pendingFish = null; chargePower = 0;
  setActionBtn('CAST 🎣', '');
  setHint(state.streak > 1 ? `🔥 ${state.streak}x streak! Keep going!` : 'Tap CAST to throw your line');
  document.getElementById('power-meter').style.display = 'none';
  document.getElementById('reel-game').style.display = 'none';
}

function chargeUpdate(dt) {
  chargePower += chargeDir * dt * 1.6;
  if (chargePower >= 1) { chargePower = 1; chargeDir = -1; }
  if (chargePower <= 0) { chargePower = 0; chargeDir = 1; }
  document.getElementById('power-fill').style.width = (chargePower*100) + '%';
}

// ============================================================
// FISHING LINE & BOBBER DRAW
// ============================================================
function drawFishingLine(time) {
  if (phase === PHASE.IDLE || phase === PHASE.CHARGING) return;
  const cx = W/2, cy = waterTopY()-28;
  let bx = cast.bobberX, by = cast.bobberY;
  if (phase === PHASE.WAITING) by += Math.sin(time*4)*1.2;
  else if (phase === PHASE.BITE) { by += Math.sin(time*18)*4; bx += Math.sin(time*22)*2; }
  else if (phase === PHASE.REELING) by += Math.sin(time*12)*3;

  // Line
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.quadraticCurveTo((cx+bx)/2, (cy+by)/2+8, bx, by);
  ctx.stroke(); ctx.restore();

  // Bobber
  ctx.save();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#cc1f1f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(bx, by, 6, Math.PI, 0); ctx.fill();
  ctx.restore();

  // Bite "!" indicator
  if (phase === PHASE.BITE) {
    const pulse = 0.7 + Math.sin(bitePulse*12)*0.3;
    ctx.save(); ctx.translate(bx, by-28); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff3b3b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeText('!', 0, 0); ctx.fillText('!', 0, 0);
    ctx.restore();
  }

  // Bubbles when waiting
  if (phase === PHASE.WAITING && Math.random() < 0.15) {
    particles.push({ x: bx+(Math.random()-0.5)*12, y: by+8, vx: 0, vy: -0.6-Math.random()*0.5, g: 0, r: 1+Math.random()*2, life: 1, decay: 0.02, color: 'rgba(180,230,255,' });
  }
}

// ============================================================
// QUEST PROGRESS
// ============================================================
function updateQuestProgress(type, value) {
  if (!state.quests) return;
  for (const q of state.quests) {
    if (q.claimed) continue;
    if (q.type === 'catch_any' && type === 'catch_any') q.progress += value;
    else if (q.type === 'catch_rarity' && type === 'catch_rarity' && value === q.rarity) q.progress += 1;
    else if (q.type === 'visit_zone' && type === 'visit_zone') { if (ZONES[value]?.id === q.zoneId) q.progress = 1; }
    else if (q.type === 'earn_gold' && type === 'earn_gold') q.progress += value;
    else if (q.type === 'weight_total' && type === 'weight_total') q.progress += value;
    else if (q.type === 'streak' && type === 'streak' && value >= q.n) q.progress = q.n;
    else if (q.type === 'use_bait' && type === 'use_bait') q.progress += 1;
  }
  saveGame();
}
