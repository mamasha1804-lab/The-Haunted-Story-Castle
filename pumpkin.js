const gs = {
  sound: localStorage.getItem('hauntedSpeech') !== 'off',
  music: false,
  started: false,
  found: 0,
  friendRound: 0,
  score: 0,
  candyTarget: 3,
  candyChoice: 0,
  completed: false,
  rewardReady: false,
  collected: false,
  startTime: 0,
  elapsed: 0,
  timer: null,
  bestTime: Number(localStorage.getItem('hauntedPatchBest') || 0)
};

const friends = [
  ['ghost', 'Find the friendly ghost.'],
  ['cat', 'Find the black cat.'],
  ['witch', 'Find the little witch.']
];
const patchCount = document.getElementById('patchCount');
const patchScore = document.getElementById('patchScore');
const patchTime = document.getElementById('patchTime');
const stageChip = document.getElementById('stageChip');
const toast = document.getElementById('toast');
const canvas = document.getElementById('patchCanvas');
const successLock = document.getElementById('successLock');
const treasureLock = document.getElementById('treasureLock');
const collectReward = document.getElementById('collectReward');
const patchMusic = document.getElementById('patchMusic');
const patchSound = document.getElementById('patchSound');
let audioCtx = null;
let ambientNodes = [];

function getAudioContext() {
  if (!audioCtx && ('AudioContext' in window || 'webkitAudioContext' in window)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function chime(frequency = 650, duration = 0.15, volume = 0.035) {
  if (!gs.sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.03);
}
function say(text) {
  if (!gs.sound || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.78;
  utterance.pitch = 1.1;
  speechSynthesis.speak(utterance);
}
function flash(text, ms = 1600) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => toast.classList.remove('show'), ms);
}
function formatTime(ms) {
  if (!ms) return '--:--';
  const total = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
function startTimer() {
  clearInterval(gs.timer);
  gs.startTime = Date.now();
  gs.elapsed = 0;
  patchTime.textContent = '00:00';
  gs.timer = setInterval(() => {
    gs.elapsed = Date.now() - gs.startTime;
    patchTime.textContent = formatTime(gs.elapsed);
  }, 500);
}
function stopTimer() {
  if (gs.startTime) gs.elapsed = Date.now() - gs.startTime;
  clearInterval(gs.timer);
  gs.timer = null;
  patchTime.textContent = formatTime(gs.elapsed);
  if (gs.elapsed && (!gs.bestTime || gs.elapsed < gs.bestTime)) {
    gs.bestTime = gs.elapsed;
    localStorage.setItem('hauntedPatchBest', String(gs.bestTime));
  }
}
function startMusic() {
  const ctx = getAudioContext();
  if (!ctx || gs.music) return;
  gs.music = true;
  const master = ctx.createGain();
  master.gain.value = 0.017;
  master.connect(ctx.destination);
  [174.61, 220, 329.63].forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index === 1 ? 'triangle' : 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = index === 1 ? 0.32 : 0.18;
    osc.connect(gain).connect(master);
    osc.start();
    ambientNodes.push({ osc });
  });
  syncAudio();
  flash('Magical background music is on.');
}
function stopMusic() {
  ambientNodes.forEach(({ osc }) => { try { osc.stop(); } catch {} });
  ambientNodes = [];
  gs.music = false;
  syncAudio();
  flash('Background music is off.');
}
function toggleMusic() { gs.music ? stopMusic() : startMusic(); }
function syncAudio() {
  patchMusic.setAttribute('aria-pressed', String(gs.music));
  patchSound.setAttribute('aria-pressed', String(gs.sound));
  patchMusic.classList.toggle('active-toggle', gs.music);
  patchSound.classList.toggle('active-toggle', gs.sound);
}
function burstFrom(element, count = 16) {
  const canvasRect = canvas.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  const cx = ((rect.left + rect.width / 2 - canvasRect.left) / canvasRect.width) * 100;
  const cy = ((rect.top + rect.height / 2 - canvasRect.top) / canvasRect.height) * 100;
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('i');
    particle.className = 'magic-particle patch-particle';
    particle.style.left = `${cx}%`;
    particle.style.top = `${cy}%`;
    particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
    particle.style.setProperty('--dy', `${-25 - Math.random() * 90}px`);
    particle.style.setProperty('--delay', `${Math.random() * 0.1}s`);
    canvas.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}
function update() {
  patchCount.textContent = `${gs.found}/5`;
  patchScore.textContent = String(gs.score);
  if (!gs.started && !gs.completed) patchTime.textContent = gs.bestTime ? `Best ${formatTime(gs.bestTime)}` : '--:--';
}
function setStage(text) { stageChip.textContent = text; }
function reset() {
  clearInterval(gs.timer);
  gs.started = false;
  gs.found = 0;
  gs.friendRound = 0;
  gs.score = 0;
  gs.candyChoice = 0;
  gs.candyTarget = Math.floor(Math.random() * 5) + 1;
  gs.completed = false;
  gs.rewardReady = false;
  gs.collected = false;
  gs.startTime = 0;
  gs.elapsed = 0;
  document.querySelectorAll('.pumpkin-target').forEach(button => button.classList.remove('found'));
  document.querySelectorAll('.clue-options button').forEach(button => button.classList.remove('correct', 'wrong'));
  document.querySelectorAll('#candyRow button').forEach(button => button.classList.remove('selected'));
  document.getElementById('friendClue').classList.remove('show');
  document.getElementById('candyGame').classList.remove('show');
  document.getElementById('winMessage').classList.remove('show');
  document.getElementById('startMessage').classList.remove('show');
  successLock.classList.remove('unlocked');
  treasureLock.classList.remove('unlocked');
  collectReward.classList.remove('ready');
  setStage('Ready to explore');
  update();
}
function showFriend() {
  const round = friends[gs.friendRound];
  document.getElementById('friendClueText').textContent = round[1];
  document.getElementById('friendClue').classList.add('show');
  setStage(`Listen: ${round[1]}`);
  say(round[1]);
}
function showCandy() {
  document.getElementById('friendClue').classList.remove('show');
  document.getElementById('candyTitle').textContent = `Put ${gs.candyTarget} candies in the basket!`;
  document.getElementById('candyGame').classList.add('show');
  setStage(`Count ${gs.candyTarget} candies`);
  say(`Put ${gs.candyTarget} candies in the basket.`);
}
function completeAdventure() {
  document.getElementById('candyGame').classList.remove('show');
  gs.completed = true;
  gs.rewardReady = true;
  gs.score += 5;
  stopTimer();
  update();
  successLock.classList.add('unlocked');
  collectReward.classList.add('ready');
  document.getElementById('winMessage').classList.add('show');
  setStage('Adventure complete — collect the chest!');
  chime(880, 0.3, 0.05);
  burstFrom(collectReward, 28);
  say('Great job! You found them all. The treasure chest is unlocked!');
}

document.getElementById('startAdventure').addEventListener('click', () => {
  reset();
  document.getElementById('startMessage').classList.add('show');
  setStage('Mission: find 5 pumpkins');
  say('Find five missing pumpkins.');
});
document.getElementById('closeStart').addEventListener('click', () => {
  document.getElementById('startMessage').classList.remove('show');
  gs.started = true;
  startTimer();
  say('Let us play. Find a pumpkin.');
});
document.getElementById('playAgain').addEventListener('click', () => {
  reset();
  document.getElementById('startMessage').classList.add('show');
  flash('Adventure restarted!');
});
collectReward.addEventListener('click', () => {
  if (!gs.rewardReady) {
    flash('Complete all three stages to unlock the chest!', 2100);
    return;
  }
  if (gs.collected) {
    flash('This treasure is already collected. Play again for another reward!');
    return;
  }
  gs.collected = true;
  gs.score += 10;
  const total = Number(localStorage.getItem('hauntedCandyCount') || 0) + 10;
  localStorage.setItem('hauntedCandyCount', String(total));
  treasureLock.classList.add('unlocked');
  collectReward.classList.remove('ready');
  update();
  chime(980, 0.36, 0.055);
  burstFrom(collectReward, 34);
  setStage(`Treasure collected — ${total} candy stars total`);
  flash('Treasure collected! +10 candy stars', 2400);
  say('Treasure collected! You earned ten candy stars.');
});

document.querySelectorAll('.pumpkin-target').forEach(button => button.addEventListener('click', () => {
  if (!gs.started) {
    flash('Press Start Adventure first.');
    return;
  }
  if (button.classList.contains('found')) return;
  button.classList.add('found');
  gs.found += 1;
  gs.score += 1;
  update();
  burstFrom(button, 12);
  chime(560 + gs.found * 60, 0.12);
  say('Pumpkin');
  flash(`Pumpkin ${gs.found} of 5 found!`);
  setStage(`${gs.found}/5 pumpkins found`);
  if (gs.found === 5) setTimeout(showFriend, 600);
}));

document.querySelectorAll('.clue-options button').forEach(button => button.addEventListener('click', () => {
  const expected = friends[gs.friendRound][0];
  document.querySelectorAll('.clue-options button').forEach(item => item.classList.remove('wrong'));
  if (button.dataset.friend === expected) {
    button.classList.add('correct');
    gs.score += 2;
    update();
    chime(760, 0.16);
    say('Yes! Great listening!');
    setTimeout(() => {
      button.classList.remove('correct');
      gs.friendRound += 1;
      if (gs.friendRound >= friends.length) showCandy();
      else showFriend();
    }, 650);
  } else {
    button.classList.add('wrong');
    chime(260, 0.1, 0.02);
    say('Try again.');
  }
}));

document.querySelectorAll('#candyRow button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('#candyRow button').forEach(item => item.classList.remove('selected'));
  button.classList.add('selected');
  gs.candyChoice = Number(button.dataset.count);
  chime(480 + gs.candyChoice * 45, 0.1, 0.022);
  say(String(gs.candyChoice));
}));
document.getElementById('checkCandy').addEventListener('click', () => {
  if (!gs.candyChoice) {
    flash('Choose a number first.');
    say('Choose a number first.');
    return;
  }
  if (gs.candyChoice === gs.candyTarget) completeAdventure();
  else {
    flash('Try counting again!');
    chime(250, 0.12, 0.02);
    say('Try counting again.');
  }
});
document.getElementById('closeWin').addEventListener('click', () => {
  document.getElementById('winMessage').classList.remove('show');
  flash('The treasure chest is ready to collect!');
});
patchMusic.addEventListener('click', toggleMusic);
patchSound.addEventListener('click', () => {
  gs.sound = !gs.sound;
  localStorage.setItem('hauntedSpeech', gs.sound ? 'on' : 'off');
  if (!gs.sound && 'speechSynthesis' in window) speechSynthesis.cancel();
  syncAudio();
  flash(gs.sound ? 'Spoken English is on.' : 'Spoken English is off.');
});

syncAudio();
reset();
