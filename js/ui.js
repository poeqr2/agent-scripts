"use strict";

// ============================================================
// TOAST & HINT
// ============================================================
function showToast(msg, ms = 1800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('show'), ms);
}

function setHint(text) { document.getElementById('hint').textContent = text; }

function setActionBtn(label, cls = '') {
  const btn = document.getElementById('action-btn');
  btn.textContent = label;
  btn.className = 'action-btn ' + cls;
}

// ============================================================
// HUD UPDATE
// ============================================================
function updateUI() {
  document.getElementById('gold').textContent = Math.floor(state.gold);
  document.getElementById('caught').textContent = state.caught;
  document.getElementById('rod').textContent = RODS[state.rodIdx].name;
  document.getElementById('zone').textContent = ZONES[state.zoneIdx].name;
  updateEnergyUI();
  updateStreakUI();
}

function updateEnergyUI() {
  const pct = (state.energy / state.energyMax) * 100;
  document.getElementById('energy-fill').style.width = pct + '%';
  const el = document.getElementById('energy-text');
  if (state.energy <= 0) {
    el.textContent = `0/${state.energyMax} · ${formatCountdown(msUntilReset())}`;
    el.style.color = '#ff9f43';
  } else {
    el.textContent = `${Math.floor(state.energy)}/${state.energyMax}`;
    el.style.color = '#ffe066';
  }
}

function updateStreakUI() {
  const el = document.getElementById('streak-display');
  if (el) {
    if (state.streak > 1) {
      el.style.display = 'inline-flex';
      el.querySelector('.v').textContent = `x${Math.min(2.5, 1+(state.streak-1)*0.25).toFixed(1)}`;
    } else {
      el.style.display = 'none';
    }
  }
}

// ============================================================
// DAILY RESET TICK
// ============================================================
let dailyCheckAccum = 0;
function tickDailyReset(dt) {
  dailyCheckAccum += dt;
  if (dailyCheckAccum > 30) { dailyCheckAccum = 0; checkDailyReset(); }
  if (state.energy <= 0) updateEnergyUI();
}

// ============================================================
// MODALS
// ============================================================
function openModal(id) {
  document.getElementById(id).classList.add('open');
  if (id === 'shop-modal') renderShop();
  if (id === 'inv-modal') renderInventory();
  if (id === 'zone-modal') renderZones();
  if (id === 'quest-modal') renderQuests();
  if (id === 'bestiary-modal') renderBestiary();
  sfx('click');
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('[data-close]').forEach(el => {
  el.addEventListener('click', () => closeModal(el.dataset.close));
});
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

// Button bindings
document.getElementById('btn-shop').addEventListener('click', () => openModal('shop-modal'));
document.getElementById('btn-inv').addEventListener('click', () => openModal('inv-modal'));
document.getElementById('btn-zone').addEventListener('click', () => openModal('zone-modal'));
document.getElementById('btn-quest').addEventListener('click', () => openModal('quest-modal'));
document.getElementById('btn-bestiary').addEventListener('click', () => openModal('bestiary-modal'));
document.getElementById('btn-mute').addEventListener('click', () => {
  state.muted = !state.muted;
  document.getElementById('btn-mute').textContent = state.muted ? '🔇' : '🔊';
  saveGame();
});

// ============================================================
// SHOP (Rods + Baits + Cosmetics)
// ============================================================
function renderShop() {
  const list = document.getElementById('shop-list');
  list.innerHTML = '<h3 style="color:#4ecdc4;margin:6px 0;">🎣 Rods</h3>';
  RODS.forEach((rod, i) => {
    const owned = i <= state.rodIdx, equipped = i === state.rodIdx;
    list.innerHTML += `<div class="shop-item ${equipped?'equipped':owned?'owned':''}"><div style="flex:1"><h3>🎣 ${rod.name} ${equipped?'★':''}</h3><p>Power x${rod.power.toFixed(1)} · Energy ${rod.energyMax} · Reel ${rod.reelSpeed.toFixed(1)}x</p>${owned?'<p style="color:#2ecc71">Owned</p>':`<p class="price">${rod.cost.toLocaleString()} 🪙</p>`}</div><button class="small-btn" data-rod="${i}" ${owned||state.gold<rod.cost?'disabled':''}>${owned?'Owned':'Buy'}</button></div>`;
  });

  list.innerHTML += '<h3 style="color:#4ecdc4;margin:12px 0 6px;">🧪 Baits</h3>';
  BAITS.forEach(b => {
    const count = state.baitInventory[b.id] || 0;
    list.innerHTML += `<div class="shop-item"><div style="flex:1"><h3>${b.emoji} ${b.name} <small style="color:#a8c8e6">[${count}]</small></h3><p>${b.desc}</p><p class="price">${b.cost} 🪙</p></div><button class="small-btn" data-bait="${b.id}" ${state.gold<b.cost?'disabled':''}>Buy</button></div>`;
  });

  list.innerHTML += '<h3 style="color:#4ecdc4;margin:12px 0 6px;">🎨 Cosmetics</h3>';
  BOAT_SKINS.forEach(s => {
    const owned = state.ownedBoats.includes(s.id), active = state.boatSkin === s.id;
    list.innerHTML += `<div class="shop-item ${active?'equipped':owned?'owned':''}"><div style="flex:1"><h3>⛵ ${s.name} ${active?'★':''}</h3>${!owned?`<p class="price">${s.cost} 🪙</p>`:''}</div><button class="small-btn" data-boat="${s.id}" ${!owned&&state.gold<s.cost?'disabled':''}>${active?'Active':owned?'Equip':'Buy'}</button></div>`;
  });
  HAT_COLORS.forEach(h => {
    const owned = state.ownedHats.includes(h.id), active = state.hatColor === h.id;
    list.innerHTML += `<div class="shop-item ${active?'equipped':owned?'owned':''}"><div style="flex:1"><h3>🎩 ${h.name} ${active?'★':''}</h3>${!owned?`<p class="price">${h.cost} 🪙</p>`:''}</div><button class="small-btn" data-hat="${h.id}" ${!owned&&state.gold<h.cost?'disabled':''}>${active?'Active':owned?'Equip':'Buy'}</button></div>`;
  });

  // Bind buttons
  list.querySelectorAll('[data-rod]').forEach(b => b.addEventListener('click', () => buyRod(+b.dataset.rod)));
  list.querySelectorAll('[data-bait]').forEach(b => b.addEventListener('click', () => buyBait(b.dataset.bait)));
  list.querySelectorAll('[data-boat]').forEach(b => b.addEventListener('click', () => buyCosmetic('boat', b.dataset.boat)));
  list.querySelectorAll('[data-hat]').forEach(b => b.addEventListener('click', () => buyCosmetic('hat', b.dataset.hat)));
}

function buyRod(i) {
  const rod = RODS[i];
  if (i <= state.rodIdx || state.gold < rod.cost) return;
  if (i > state.rodIdx + 1) { showToast('Buy lower-tier rod first'); return; }
  state.gold -= rod.cost; state.rodIdx = i; state.energyMax = rod.energyMax;
  saveGame(); updateUI(); renderShop();
  showToast(`🎣 ${rod.name} Rod equipped!`); sfx('buy');
}

function buyBait(id) {
  const b = BAITS.find(x => x.id === id);
  if (!b || state.gold < b.cost) return;
  state.gold -= b.cost;
  state.baitInventory[id] = (state.baitInventory[id] || 0) + 1;
  saveGame(); updateUI(); renderShop();
  showToast(`${b.emoji} ${b.name} purchased!`); sfx('buy');
  updateQuestProgress('use_bait', 0); // just buying, not using yet
}

function buyCosmetic(type, id) {
  if (type === 'boat') {
    const s = BOAT_SKINS.find(x => x.id === id);
    if (!state.ownedBoats.includes(id)) {
      if (state.gold < s.cost) return;
      state.gold -= s.cost; state.ownedBoats.push(id);
    }
    state.boatSkin = id;
  } else {
    const h = HAT_COLORS.find(x => x.id === id);
    if (!state.ownedHats.includes(id)) {
      if (state.gold < h.cost) return;
      state.gold -= h.cost; state.ownedHats.push(id);
    }
    state.hatColor = id;
  }
  saveGame(); updateUI(); renderShop(); sfx('buy');
}

// ============================================================
// ZONES MODAL
// ============================================================
function renderZones() {
  const list = document.getElementById('zone-list');
  list.innerHTML = '';
  ZONES.forEach((z, i) => {
    const owned = state.ownedZones.includes(z.id), active = i === state.zoneIdx;
    list.innerHTML += `<button class="zone-btn ${active?'active':''} ${!owned&&state.gold<z.cost?'locked':''}" data-zone="${i}"><h3>${z.emoji} ${z.name} ${active?'<span style="color:#ffd24a">★</span>':''}</h3><p>${z.desc}</p><p>⚡ ${z.energyCost}/cast</p>${!owned?`<p style="color:#ffd24a">Unlock: ${z.cost.toLocaleString()} 🪙</p>`:''}</button>`;
  });
  list.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => selectZone(+b.dataset.zone)));
}

function selectZone(i) {
  const z = ZONES[i];
  if (!state.ownedZones.includes(z.id)) {
    if (state.gold < z.cost) { showToast('🪙 Not enough gold'); return; }
    state.gold -= z.cost; state.ownedZones.push(z.id); sfx('buy');
  }
  state.zoneIdx = i; ambient.length = 0;
  saveGame(); updateUI(); renderZones(); closeModal('zone-modal');
}

// ============================================================
// INVENTORY MODAL
// ============================================================
function renderInventory() {
  const grid = document.getElementById('inv-grid');
  grid.innerHTML = '';
  const items = Object.values(state.inventory);
  const summary = document.getElementById('inv-summary');
  if (!items.length) { summary.textContent = 'No fish yet.'; return; }
  summary.textContent = `${items.length} species · ${items.reduce((a,b)=>a+b.totalKg,0).toFixed(1)}kg · 🪙${items.reduce((a,b)=>a+b.totalValue,0)}`;
  items.sort((a,b) => Object.keys(RARITY).indexOf(b.rarity) - Object.keys(RARITY).indexOf(a.rarity));
  items.forEach(it => {
    grid.innerHTML += `<div class="inv-cell" style="border-color:${RARITY[it.rarity].color}"><div class="c">×${it.count}</div><div class="e">${it.e}</div><div class="n" style="color:${RARITY[it.rarity].color}">${it.name}</div></div>`;
  });
}

document.getElementById('sell-all').addEventListener('click', () => {
  const items = Object.values(state.inventory);
  if (!items.length) { showToast('🎒 Nothing to sell'); return; }
  const total = items.reduce((a,b) => a+b.totalValue, 0);
  const bonus = Math.floor(total * 0.1);
  state.gold += bonus; state.totalGoldEarned += bonus;
  state.inventory = {};
  saveGame(); updateUI(); renderInventory();
  showToast(`💰 Sold all! Bonus: +${bonus} 🪙`); sfx('buy');
});

// ============================================================
// QUESTS MODAL
// ============================================================
function renderQuests() {
  const list = document.getElementById('quest-list');
  list.innerHTML = '';
  if (!state.quests || !state.quests.length) { list.innerHTML = '<p style="text-align:center;color:#a8c8e6">No quests today</p>'; return; }
  state.quests.forEach((q, i) => {
    const done = q.progress >= q.n;
    const text = q.templateText.replace('{n}', q.n).replace('{rarity}', q.rarity||'').replace('{zone}', q.zoneName||'');
    list.innerHTML += `<div class="shop-item ${done?'owned':''}"><div style="flex:1"><h3>${done?'✅':'📋'} ${text}</h3><p>Progress: ${Math.min(q.progress, q.n).toFixed(q.type==='weight_total'?1:0)}/${q.n} · Reward: ${q.reward} 🪙</p></div>${done&&!q.claimed?`<button class="small-btn gold" data-claim="${i}">Claim</button>`:q.claimed?'<span style="color:#2ecc71">Claimed ✓</span>':''}</div>`;
  });
  list.querySelectorAll('[data-claim]').forEach(b => b.addEventListener('click', () => claimQuest(+b.dataset.claim)));
}

function claimQuest(i) {
  const q = state.quests[i];
  if (!q || q.claimed || q.progress < q.n) return;
  q.claimed = true;
  state.gold += q.reward; state.totalGoldEarned += q.reward;
  saveGame(); updateUI(); renderQuests();
  showToast(`📋 Quest complete! +${q.reward} 🪙`); sfx('buy');
}

// ============================================================
// BESTIARY MODAL
// ============================================================
function renderBestiary() {
  const list = document.getElementById('bestiary-list');
  list.innerHTML = '';
  const allFish = [...FISH, ...BOSS_FISH];
  allFish.forEach(f => {
    const b = state.bestiary[f.name];
    const discovered = !!b;
    list.innerHTML += `<div class="inv-cell" style="border-color:${discovered ? RARITY[f.rarity].color : '#333'}"><div class="e" style="filter:${discovered?'none':'brightness(0) saturate(0)'}">${f.e}</div><div class="n" style="color:${discovered ? RARITY[f.rarity].color : '#555'}">${discovered ? f.name : '???'}</div>${discovered ? `<div class="n">Best: ${b.maxKg.toFixed(2)}kg · ×${b.count}</div>` : ''}</div>`;
  });
}

// ============================================================
// BAIT ACTIVATION (from HUD)
// ============================================================
function activateBait(id) {
  if (!state.baitInventory[id] || state.baitInventory[id] <= 0) return;
  // Energy drink is instant
  if (id === 'energy') {
    state.energy = Math.min(state.energyMax, state.energy + 5);
    state.baitInventory[id]--;
    saveGame(); updateUI();
    showToast('🥤 +5 Energy!'); sfx('buy');
    updateQuestProgress('use_bait', 1);
    return;
  }
  state.activeBait = id;
  state.baitInventory[id]--;
  saveGame();
  showToast(`${BAITS.find(b=>b.id===id).emoji} Bait ready for next cast!`);
  updateQuestProgress('use_bait', 1);
}

// ============================================================
// AUDIO
// ============================================================
let actx;
function ensureAudio() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === 'suspended') actx.resume();
}
function tone(freq, dur, type = 'sine', vol = 0.12) {
  if (state.muted) return;
  ensureAudio();
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, actx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
  o.connect(g); g.connect(actx.destination);
  o.start(); o.stop(actx.currentTime + dur);
}
function sfx(name) {
  if (state.muted) return;
  switch(name) {
    case 'cast': tone(280,.15,'triangle'); setTimeout(()=>tone(420,.08,'triangle'),100); break;
    case 'splash': tone(140,.2,'sine',.15); setTimeout(()=>tone(90,.15,'sine',.1),60); break;
    case 'bite': tone(800,.06,'square'); setTimeout(()=>tone(1100,.06,'square'),80); break;
    case 'hook': tone(440,.1,'sawtooth'); setTimeout(()=>tone(660,.1,'sawtooth'),90); break;
    case 'miss': tone(180,.3,'sawtooth',.08); break;
    case 'catch_Common': case 'catch_Uncommon': tone(523,.1); setTimeout(()=>tone(659,.12),100); setTimeout(()=>tone(784,.18),200); break;
    case 'catch_Rare': tone(523,.1); setTimeout(()=>tone(784,.1),90); setTimeout(()=>tone(988,.14),180); setTimeout(()=>tone(1175,.22),280); break;
    case 'catch_Epic': tone(659,.1); setTimeout(()=>tone(880,.1),80); setTimeout(()=>tone(1100,.12),180); setTimeout(()=>tone(1567,.24),380); break;
    case 'catch_Legendary': case 'catch_Mythic': tone(523,.1); setTimeout(()=>tone(659,.1),70); setTimeout(()=>tone(784,.1),140); setTimeout(()=>tone(1568,.3),430); break;
    case 'buy': tone(740,.08); setTimeout(()=>tone(990,.12),80); break;
    case 'click': tone(600,.05,'square',.06); break;
  }
}

// ============================================================
// TUTORIAL (first time)
// ============================================================
const TUTORIAL_STEPS = [
  'Tap CAST to charge the power meter',
  'Release near the white line for max distance',
  'When you see "!" — tap HOOK quickly!',
  'HOLD the button to reel. Keep fish in the green zone!'
];
let tutorialStep = 0;

function showTutorial() {
  if (state.tutorialDone) return;
  const overlay = document.getElementById('tutorial-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  tutorialStep = 0;
  updateTutorialText();
}

function updateTutorialText() {
  const el = document.getElementById('tutorial-text');
  if (el) el.textContent = `${tutorialStep+1}/4: ${TUTORIAL_STEPS[tutorialStep]}`;
}

function advanceTutorial() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    state.tutorialDone = true; saveGame();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'none';
  } else {
    updateTutorialText();
  }
}
