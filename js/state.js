"use strict";

// ============================================================
// GAME STATE
// ============================================================
const SAVE_KEY = 'reel_frenzy_v2';

let state = {
  gold: 0,
  caught: 0,
  totalGoldEarned: 0,
  rodIdx: 0,
  zoneIdx: 0,
  ownedZones: ['pond'],
  inventory: {},       // name -> { name, e, rarity, count, totalKg, totalValue }
  bestiary: {},        // name -> { caught: true, maxKg, count }
  energy: ENERGY_PER_DAY,
  energyMax: ENERGY_PER_DAY,
  muted: false,
  lastDailyReset: '',  // ISO date string (UTC day)
  // Quests
  quests: [],          // [{...quest, progress, claimed}]
  questDate: '',
  // Achievements
  unlockedAchievements: [],
  maxStreak: 0,
  // Cosmetics
  boatSkin: 'default',
  hatColor: 'green',
  ownedBoats: ['default'],
  ownedHats: ['green'],
  // Baits
  baitInventory: {},   // baitId -> count
  activeBait: null,    // baitId or null (consumed on next cast)
  // Combo
  streak: 0,
  // Tutorial
  tutorialDone: false,
  // Stats
  totalCasts: 0,
  dailyCasts: 0,
  dailyGold: 0,
  dailyKg: 0,
};

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      Object.assign(state, d);
    }
  } catch(e) {}
  state.energyMax = RODS[state.rodIdx].energyMax;
  if (state.energy > state.energyMax) state.energy = state.energyMax;
  // Ensure bestiary exists
  if (!state.bestiary) state.bestiary = {};
  if (!state.baitInventory) state.baitInventory = {};
  if (!state.unlockedAchievements) state.unlockedAchievements = [];
  if (!state.ownedBoats) state.ownedBoats = ['default'];
  if (!state.ownedHats) state.ownedHats = ['green'];
  checkDailyReset();
}

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
}

// ============================================================
// DAILY RESET — triggers at 00:00 UTC (= 7:00 AM WIB)
// ============================================================
function getResetDateStr() {
  // Current UTC date as YYYY-MM-DD
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth()+1).padStart(2,'0') + '-' + String(d.getUTCDate()).padStart(2,'0');
}

function checkDailyReset() {
  const today = getResetDateStr();
  if (state.lastDailyReset !== today) {
    const wasFirst = !state.lastDailyReset;
    state.energy = state.energyMax;
    state.lastDailyReset = today;
    state.dailyCasts = 0;
    state.dailyGold = 0;
    state.dailyKg = 0;
    // Generate new quests
    generateDailyQuests();
    saveGame();
    if (!wasFirst) {
      setTimeout(() => showToast('☀️ New day! Energy refilled + new quests!', 3000), 600);
    }
  }
}

function msUntilReset() {
  const now = new Date();
  // Next reset = next 00:00 UTC
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, RESET_HOUR_UTC, 0, 0));
  return tomorrow - now;
}

function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ============================================================
// QUEST GENERATION
// ============================================================
function generateDailyQuests() {
  const pool = [...QUEST_TEMPLATES];
  const quests = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const tpl = pool.splice(idx, 1)[0];
    const data = tpl.gen();
    quests.push({ ...data, templateId: tpl.id, templateText: tpl.text, progress: 0, claimed: false });
  }
  state.quests = quests;
  state.questDate = getResetDateStr();
}

// ============================================================
// ACHIEVEMENT CHECKING
// ============================================================
function checkAchievements() {
  let newUnlocks = [];
  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue;
    if (ach.check(state)) {
      state.unlockedAchievements.push(ach.id);
      newUnlocks.push(ach);
    }
  }
  if (newUnlocks.length) {
    saveGame();
    for (const ach of newUnlocks) {
      setTimeout(() => showToast(`🏆 Achievement: ${ach.name}!`, 2500), 300);
    }
  }
}
