"use strict";

// ============================================================
// INPUT
// ============================================================
const actionBtn = document.getElementById('action-btn');

function handleAction() {
  ensureAudio();
  if (phase === PHASE.IDLE) startCharge();
  else if (phase === PHASE.CHARGING) releaseCharge();
  else if (phase === PHASE.BITE) hookFish();
}

actionBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  if (phase === PHASE.REELING) { reel.pulling = true; return; }
  handleAction();
});
actionBtn.addEventListener('pointerup', e => { e.preventDefault(); if (phase === PHASE.REELING) reel.pulling = false; });
actionBtn.addEventListener('pointercancel', () => { if (phase === PHASE.REELING) reel.pulling = false; });

window.addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault();
    if (phase === PHASE.REELING) reel.pulling = true;
    else handleAction();
  }
});
window.addEventListener('keyup', e => { if (e.code === 'Space' && phase === PHASE.REELING) reel.pulling = false; });

// Tutorial overlay click
const tutOverlay = document.getElementById('tutorial-overlay');
if (tutOverlay) tutOverlay.addEventListener('click', advanceTutorial);

// Bait quick-use buttons (in HUD)
document.querySelectorAll('[data-use-bait]').forEach(btn => {
  btn.addEventListener('click', () => activateBait(btn.dataset.useBait));
});

// ============================================================
// MAIN LOOP
// ============================================================
let lastT = performance.now();

function loop() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  const time = now / 1000;

  ctx.clearRect(0, 0, W, H);
  drawScene(dt, time);

  // Phase updates
  if (phase === PHASE.CHARGING) chargeUpdate(dt);
  else if (phase === PHASE.CASTING) castUpdate(dt);
  else if (phase === PHASE.WAITING) waitUpdate(dt);
  else if (phase === PHASE.BITE) biteUpdate(dt);
  else if (phase === PHASE.REELING) reelUpdate(dt);

  drawFishingLine(time);

  if (phase === PHASE.REELING) {
    const remaining = Math.max(0, reel.maxDuration - reel.duration);
    actionBtn.textContent = reel.pulling ? `PULLING ${remaining.toFixed(1)}s` : `HOLD 🎣 ${remaining.toFixed(1)}s`;
  }

  updateAmbient(dt);
  updateParticles();
  drawParticles();
  tickDailyReset(dt);

  requestAnimationFrame(loop);
}

// ============================================================
// INIT
// ============================================================
loadGame();
updateUI();
resetToIdle();
requestAnimationFrame(loop);

// Pre-spawn ambient fish
for (let i = 0; i < 5; i++) spawnAmbient();

// Show tutorial if first time
if (!state.tutorialDone) setTimeout(showTutorial, 500);
