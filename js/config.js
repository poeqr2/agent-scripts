"use strict";

// ============================================================
// RARITY TIERS
// ============================================================
const RARITY = {
  Common:    { color: '#cfd8dc', mult: 1.0,  weight: 50 },
  Uncommon:  { color: '#2ecc71', mult: 1.4,  weight: 25 },
  Rare:      { color: '#54a0ff', mult: 2.0,  weight: 14 },
  Epic:      { color: '#c56cf0', mult: 3.5,  weight: 7  },
  Legendary: { color: '#ff9f43', mult: 6.0,  weight: 3  },
  Mythic:    { color: '#ff6b6b', mult: 12.0, weight: 1  },
};

// ============================================================
// FISH SPECIES (17 + 2 boss)
// ============================================================
const FISH = [
  { name: 'Sardine',    e: '🐟', rarity: 'Common',    base: 6,   kg: 0.4,  sp: 1.4 },
  { name: 'Minnow',     e: '🐠', rarity: 'Common',    base: 8,   kg: 0.3,  sp: 1.6 },
  { name: 'Anchovy',    e: '🐟', rarity: 'Common',    base: 10,  kg: 0.5,  sp: 1.3 },
  { name: 'Trout',      e: '🐠', rarity: 'Uncommon',  base: 22,  kg: 1.2,  sp: 1.1 },
  { name: 'Bass',       e: '🐟', rarity: 'Uncommon',  base: 28,  kg: 1.8,  sp: 1.0 },
  { name: 'Carp',       e: '🐠', rarity: 'Uncommon',  base: 32,  kg: 2.5,  sp: 0.9 },
  { name: 'Salmon',     e: '🐟', rarity: 'Rare',      base: 75,  kg: 3.5,  sp: 1.0 },
  { name: 'Pufferfish', e: '🐡', rarity: 'Rare',      base: 90,  kg: 1.5,  sp: 0.8 },
  { name: 'Octopus',    e: '🐙', rarity: 'Rare',      base: 110, kg: 4.0,  sp: 0.7 },
  { name: 'Swordfish',  e: '🗡️', rarity: 'Epic',      base: 220, kg: 25,   sp: 0.9 },
  { name: 'Lobster',    e: '🦞', rarity: 'Epic',      base: 260, kg: 3.5,  sp: 0.6 },
  { name: 'Shark',      e: '🦈', rarity: 'Epic',      base: 320, kg: 80,   sp: 1.2 },
  { name: 'Dolphin',    e: '🐬', rarity: 'Legendary', base: 700, kg: 150,  sp: 1.3 },
  { name: 'Whale',      e: '🐋', rarity: 'Legendary', base: 1100,kg: 4500, sp: 0.5 },
  { name: 'Golden Koi', e: '🐡', rarity: 'Legendary', base: 1500,kg: 8,    sp: 1.0 },
  { name: 'Kraken',     e: '🦑', rarity: 'Mythic',    base: 4500,kg: 900,  sp: 0.6 },
  { name: 'Sea Dragon', e: '🐲', rarity: 'Mythic',    base: 6000,kg: 200,  sp: 1.1 },
];

// Boss fish (separate pool, only in Abyss at night or with Boss Lure)
const BOSS_FISH = [
  { name: 'Megalodon',  e: '🦈', rarity: 'Mythic', base: 15000, kg: 8000, sp: 0.4, boss: true },
  { name: 'Leviathan',  e: '🐉', rarity: 'Mythic', base: 25000, kg: 12000, sp: 0.3, boss: true },
];

// ============================================================
// ZONES
// ============================================================
const ZONES = [
  {
    id: 'pond', name: 'Quiet Pond', emoji: '🪷', cost: 0,
    desc: 'A calm pond. Easy fish, common rewards.',
    palette: { sky1: '#ffb37a', sky2: '#f4d35e', sky3: '#5fa8d3', deep: '#1a4a1a', mid: '#2d6a30', shallow: '#5fa860' },
    rarityBoost: { Common: 1.5, Uncommon: 1.0, Rare: 0.4, Epic: 0.0, Legendary: 0.0, Mythic: 0.0 },
    energyCost: 1,
  },
  {
    id: 'lake', name: 'Misty Lake', emoji: '🌫️', cost: 250,
    desc: 'Cool waters with bigger fish.',
    palette: { sky1: '#a8c8e6', sky2: '#dce8f5', sky3: '#7fa8d3', deep: '#0a3550', mid: '#1d6a92', shallow: '#4a9bbf' },
    rarityBoost: { Common: 1.0, Uncommon: 1.5, Rare: 1.0, Epic: 0.4, Legendary: 0.0, Mythic: 0.0 },
    energyCost: 2,
  },
  {
    id: 'reef', name: 'Coral Reef', emoji: '🪸', cost: 1500,
    desc: 'Vibrant reef teeming with rare species.',
    palette: { sky1: '#ff9f9f', sky2: '#ffd28a', sky3: '#5fc4d3', deep: '#02101f', mid: '#0a3550', shallow: '#1d8a92' },
    rarityBoost: { Common: 0.6, Uncommon: 1.2, Rare: 1.8, Epic: 1.2, Legendary: 0.3, Mythic: 0.0 },
    energyCost: 3,
  },
  {
    id: 'deep', name: 'Deep Trench', emoji: '🌑', cost: 8000,
    desc: 'Dark depths. Legendary creatures await.',
    palette: { sky1: '#3b3b6d', sky2: '#1f1f44', sky3: '#0a1030', deep: '#000510', mid: '#02091a', shallow: '#1a2a4a' },
    rarityBoost: { Common: 0.2, Uncommon: 0.6, Rare: 1.4, Epic: 1.8, Legendary: 1.2, Mythic: 0.4 },
    energyCost: 4,
  },
  {
    id: 'abyss', name: 'Abyssal Rift', emoji: '🔮', cost: 40000,
    desc: 'Reality bends here. Mythic catches possible.',
    palette: { sky1: '#6a0dad', sky2: '#2a0a44', sky3: '#06002a', deep: '#000005', mid: '#0a0530', shallow: '#2a1060' },
    rarityBoost: { Common: 0.0, Uncommon: 0.3, Rare: 0.8, Epic: 1.5, Legendary: 2.0, Mythic: 1.2 },
    energyCost: 6,
  },
];

// ============================================================
// RODS — energyMax scaled for 30/day budget
// ============================================================
const RODS = [
  { name: 'Bamboo',     cost: 0,      power: 1.0, energyMax: 30, reelSpeed: 1.0, lineWidth: 1.0 },
  { name: 'Fiberglass', cost: 200,    power: 1.3, energyMax: 36, reelSpeed: 1.2, lineWidth: 1.1 },
  { name: 'Carbon',     cost: 1200,   power: 1.7, energyMax: 42, reelSpeed: 1.4, lineWidth: 1.2 },
  { name: 'Titanium',   cost: 5000,   power: 2.2, energyMax: 50, reelSpeed: 1.6, lineWidth: 1.4 },
  { name: 'Mythril',    cost: 20000,  power: 3.0, energyMax: 60, reelSpeed: 1.9, lineWidth: 1.6 },
  { name: 'Celestial',  cost: 100000, power: 4.5, energyMax: 80, reelSpeed: 2.3, lineWidth: 2.0 },
];

// ============================================================
// BAITS / CONSUMABLES
// ============================================================
const BAITS = [
  { id: 'lucky',   name: 'Lucky Bait',    emoji: '🍀', cost: 50,   desc: '+50% rarity boost for 1 cast', effect: 'rarityBoost', value: 1.5 },
  { id: 'energy',  name: 'Energy Drink',  emoji: '🥤', cost: 80,   desc: '+5 energy instantly', effect: 'energy', value: 5 },
  { id: 'magnet',  name: 'Magnet Bait',   emoji: '🧲', cost: 120,  desc: 'Auto-hook (skip bite phase)', effect: 'autoHook', value: 1 },
  { id: 'gold',    name: 'Gold Bait',     emoji: '✨', cost: 200,  desc: '2x gold from next catch', effect: 'goldMult', value: 2 },
  { id: 'boss',    name: 'Boss Lure',     emoji: '💀', cost: 500,  desc: 'Guarantees boss encounter (Abyss only)', effect: 'bossLure', value: 1 },
];

// ============================================================
// COSMETICS
// ============================================================
const BOAT_SKINS = [
  { id: 'default', name: 'Oak Classic', color: '#5d3a1a', stripe: '#8b5a2b', cost: 0 },
  { id: 'red',     name: 'Crimson Tide', color: '#8b1a1a', stripe: '#cc3333', cost: 300 },
  { id: 'blue',    name: 'Ocean Blue',  color: '#1a3a8b', stripe: '#4488cc', cost: 300 },
  { id: 'gold',    name: 'Golden Ark',  color: '#8b6a1a', stripe: '#ffd700', cost: 1500 },
  { id: 'purple',  name: 'Phantom Ship', color: '#4a1a6b', stripe: '#9b59b6', cost: 3000 },
  { id: 'rainbow', name: 'Prismatic',   color: '#ff6b6b', stripe: '#4ecdc4', cost: 10000 },
];

const HAT_COLORS = [
  { id: 'green',  name: 'Forest Cap', color: '#2c5f2d', cost: 0 },
  { id: 'red',    name: 'Red Beanie', color: '#cc3333', cost: 150 },
  { id: 'blue',   name: 'Sailor Hat', color: '#2255aa', cost: 150 },
  { id: 'gold',   name: 'Crown',      color: '#ffd700', cost: 2000 },
  { id: 'black',  name: 'Pirate Hat', color: '#1a1a1a', cost: 800 },
];

// ============================================================
// ACHIEVEMENTS
// ============================================================
const ACHIEVEMENTS = [
  { id: 'first_catch',    name: 'First Catch',       desc: 'Catch your first fish', check: s => s.caught >= 1 },
  { id: 'catch_10',       name: 'Apprentice Angler', desc: 'Catch 10 fish total', check: s => s.caught >= 10 },
  { id: 'catch_50',       name: 'Seasoned Fisher',   desc: 'Catch 50 fish total', check: s => s.caught >= 50 },
  { id: 'catch_200',      name: 'Master Angler',     desc: 'Catch 200 fish total', check: s => s.caught >= 200 },
  { id: 'gold_1000',      name: 'Getting Rich',      desc: 'Earn 1,000 gold total', check: s => s.totalGoldEarned >= 1000 },
  { id: 'gold_50000',     name: 'Tycoon',            desc: 'Earn 50,000 gold total', check: s => s.totalGoldEarned >= 50000 },
  { id: 'all_common',     name: 'Common Collector',  desc: 'Catch all Common species', check: s => FISH.filter(f=>f.rarity==='Common').every(f=>s.bestiary[f.name]) },
  { id: 'all_rare',       name: 'Rare Hunter',       desc: 'Catch all Rare species', check: s => FISH.filter(f=>f.rarity==='Rare').every(f=>s.bestiary[f.name]) },
  { id: 'all_epic',       name: 'Epic Explorer',     desc: 'Catch all Epic species', check: s => FISH.filter(f=>f.rarity==='Epic').every(f=>s.bestiary[f.name]) },
  { id: 'all_legendary',  name: 'Legend Seeker',     desc: 'Catch all Legendary species', check: s => FISH.filter(f=>f.rarity==='Legendary').every(f=>s.bestiary[f.name]) },
  { id: 'mythic_catch',   name: 'Myth Made Real',    desc: 'Catch a Mythic fish', check: s => FISH.filter(f=>f.rarity==='Mythic').some(f=>s.bestiary[f.name]) },
  { id: 'boss_catch',     name: 'Boss Slayer',       desc: 'Defeat a Boss fish', check: s => BOSS_FISH.some(f=>s.bestiary[f.name]) },
  { id: 'all_zones',      name: 'World Explorer',    desc: 'Unlock all fishing zones', check: s => s.ownedZones.length >= ZONES.length },
  { id: 'streak_5',       name: 'On Fire',           desc: 'Get a 5x catch streak', check: s => s.maxStreak >= 5 },
];

// ============================================================
// DAILY QUEST TEMPLATES
// ============================================================
const QUEST_TEMPLATES = [
  { id: 'catch_any_N',     text: 'Catch {n} fish',            gen: () => ({type:'catch_any', n: 3+Math.floor(Math.random()*5), reward: 50}) },
  { id: 'catch_rarity',    text: 'Catch a {rarity} fish',     gen: () => {const r=['Uncommon','Rare','Epic'][Math.floor(Math.random()*3)]; return {type:'catch_rarity', rarity:r, n:1, reward: r==='Epic'?200:r==='Rare'?100:60}} },
  { id: 'visit_zone',      text: 'Fish in {zone}',            gen: () => {const z=ZONES[1+Math.floor(Math.random()*(ZONES.length-1))]; return {type:'visit_zone', zoneId:z.id, zoneName:z.name, n:1, reward:80}} },
  { id: 'earn_gold',       text: 'Earn {n} gold from catches',gen: () => ({type:'earn_gold', n: 50+Math.floor(Math.random()*150), reward: 100}) },
  { id: 'weight_total',    text: 'Catch {n}kg total weight',  gen: () => ({type:'weight_total', n: 5+Math.floor(Math.random()*20), reward: 120}) },
  { id: 'streak',          text: 'Get a {n}x streak',         gen: () => ({type:'streak', n: 3, reward: 150}) },
  { id: 'use_bait',        text: 'Use any bait',              gen: () => ({type:'use_bait', n: 1, reward: 40}) },
];

// ============================================================
// ENERGY CONSTANTS
// ============================================================
const ENERGY_PER_DAY = 30;
// Reset at 7:00 AM WIB = 00:00 UTC
const RESET_HOUR_UTC = 0; // midnight UTC = 7AM WIB (UTC+7)
