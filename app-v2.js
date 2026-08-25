const choices = {
  character: [
    { name: 'Witch', phrase: 'a little witch' },
    { name: 'Ghost', phrase: 'a friendly ghost' },
    { name: 'Black Cat', phrase: 'a curious black cat' },
    { name: 'Pumpkin', phrase: 'a talking pumpkin' },
    { name: 'Vampire', phrase: 'a tiny vampire' }
  ],
  setting: [
    { name: 'Haunted Castle', phrase: 'the haunted castle' },
    { name: 'Spooky Forest', phrase: 'the spooky forest' },
    { name: 'Pumpkin Patch', phrase: 'the pumpkin patch' },
    { name: 'Old School', phrase: 'the old school at night' },
    { name: 'Magic Lab', phrase: 'the magical Halloween lab' }
  ],
  problem: [
    { name: 'Finds a magic book', phrase: 'found a magic book' },
    { name: 'Meets a new friend', phrase: 'met a new friend' },
    { name: 'Hears a strange sound', phrase: 'heard a strange sound' },
    { name: 'Solves a mystery', phrase: 'solved a tiny mystery' },
    { name: 'Finds a secret door', phrase: 'found a secret door' }
  ],
  surprise: [
    { name: 'Rainy Candies', phrase: 'candies rained from the sky' },
    { name: 'A magic spell', phrase: 'a funny spell made everyone giggle' },
    { name: 'A hidden treasure', phrase: 'a treasure chest popped open' },
    { name: 'A flying broom', phrase: 'a broom started flying' },
    { name: 'A ghost appears', phrase: 'a friendly ghost appeared' }
  ]
};

const defaults = { character: 0, setting: 0, problem: 0, surprise: 2 };
function clampIndex(value, list, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n < list.length ? n : fallback;
}
function cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

let savedSelection = {};
try { savedSelection = JSON.parse(localStorage.getItem('hauntedSelections') || '{}'); } catch {}

const state = {
  character: choices.character[clampIndex(savedSelection.character, choices.character, defaults.character)],
  setting: choices.setting[clampIndex(savedSelection.setting, choices.setting, defaults.setting)],
  problem: choices.problem[clampIndex(savedSelection.problem, choices.problem, defaults.problem)],
  surprise: choices.surprise[clampIndex(savedSelection.surprise, choices.surprise, defaults.surprise)],
  sound: localStorage.getItem('hauntedSpeech') !== 'off',
  music: false,
  count: Number(localStorage.getItem('hauntedStoryCount') || 0),
  rollingAll: false
};

const labels = {
  character: document.getElementById('labelCharacter'),
  setting: document.getElementById('labelSetting'),
  problem: document.getElementById('labelProblem'),
  surprise: document.getElementById('labelSurprise')
};
const art = {
  character: document.getElementById('artCharacter'),
  setting: document.getElementById('artSetting'),
  problem: document.getElementById('artProblem'),
  surprise: document.getElementById('artSurprise')
};
const artType = { character: 'char', setting: 'loc', problem: 'prob', surprise: 'sur' };
const storyText = document.getElementById('storyText');
const dynamicStory = document.getElementById('dynamicStory');
const storyCount = document.getElementById('storyCount');
const toast = document.getElementById('toast');
const canvas = document.getElementById('castleCanvas');
const settingsPanel = document.getElementById('settingsPanel');
const musicToggle = document.getElementById('musicToggle');
const soundToggle = document.getElementById('soundToggle');
const settingsSpeech = document.getElementById('settingsSpeech');
const settingsMusic = document.getElementById('settingsMusic');
const rollStoryButton = document.getElementById('rollStory');
const rollAgainButton = document.getElementById('rollAgain');

let audioCtx = null;
let ambientNodes = [];
storyCount.textContent = String(state.count);

function makeStory() {
  return `${cap(state.character.phrase)} went to ${state.setting.phrase}, ${state.problem.phrase}, and suddenly ${state.surprise.phrase}.`;
}
function flash(text, ms = 1700) {
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => toast.classList.remove('show'), ms);
}
function getAudioContext() {
  if (!audioCtx && ('AudioContext' in window || 'webkitAudioContext' in window)) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function chime(frequency = 620, duration = 0.16, volume = 0.035) {
  if (!state.sound) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}
function say(text) {
  if (!state.sound || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  utterance.pitch = 1.08;
  speechSynthesis.speak(utterance);
  dynamicStory.classList.add('speaking');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => dynamicStory.classList.remove('speaking'), 1200);
}
function startMusic() {
  const ctx = getAudioContext();
  if (!ctx || state.music) return;
  state.music = true;
  const master = ctx.createGain();
  master.gain.value = 0.016;
  master.connect(ctx.destination);
  [174.61, 261.63, 349.23].forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = index === 1 ? 'triangle' : 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = index === 1 ? 0.34 : 0.19;
    osc.connect(gain).connect(master);
    osc.start();
    ambientNodes.push({ osc });
  });
  syncAudioButtons();
  flash('Magical background music is on.');
}
function stopMusic() {
  ambientNodes.forEach(({ osc }) => { try { osc.stop(); } catch {} });
  ambientNodes = [];
  state.music = false;
  syncAudioButtons();
  flash('Background music is off.');
}
function toggleMusic() { state.music ? stopMusic() : startMusic(); }
function syncAudioButtons() {
  soundToggle.setAttribute('aria-pressed', String(state.sound));
  musicToggle.setAttribute('aria-pressed', String(state.music));
  soundToggle.classList.toggle('active-toggle', state.sound);
  musicToggle.classList.toggle('active-toggle', state.music);
  settingsSpeech.textContent = `Spoken English: ${state.sound ? 'On' : 'Off'}`;
  settingsMusic.textContent = `Background magic: ${state.music ? 'On' : 'Off'}`;
}
function saveSelections() {
  const selection = {};
  Object.keys(choices).forEach(slot => { selection[slot] = choices[slot].indexOf(state[slot]); });
  localStorage.setItem('hauntedSelections', JSON.stringify(selection));
  localStorage.setItem('hauntedLastStory', storyText.textContent);
}
function refreshStory(animate = true) {
  storyText.textContent = makeStory();
  if (animate) {
    dynamicStory.classList.remove('story-change');
    void dynamicStory.offsetWidth;
    dynamicStory.classList.add('story-change');
    setTimeout(() => dynamicStory.classList.remove('story-change'), 360);
  }
}
function animateSlot(slot) {
  const hot = document.querySelector(`.main-card[data-roll="${slot}"]`);
  if (!hot || !art[slot]) return;
  hot.classList.remove('rolling');
  art[slot].classList.remove('rolling');
  void hot.offsetWidth;
  hot.classList.add('rolling');
  art[slot].classList.add('rolling');
  setTimeout(() => {
    hot.classList.remove('rolling');
    art[slot].classList.remove('rolling');
  }, 520);
}
function updateArt(slot, index) {
  const node = art[slot];
  node.className = `card-art spr ${artType[slot]} p${index}`;
  node.classList.toggle('is-base', index === defaults[slot]);
}
function setChoice(slot, index, options = {}) {
  const { announce = true, animateStory = true } = options;
  const safeIndex = clampIndex(index, choices[slot], defaults[slot]);
  state[slot] = choices[slot][safeIndex];
  labels[slot].textContent = state[slot].name;
  document.querySelectorAll(`[data-choice-slot="${slot}"]`).forEach(button => {
    button.classList.toggle('active', Number(button.dataset.index) === safeIndex);
  });
  updateArt(slot, safeIndex);
  refreshStory(animateStory);
  saveSelections();
  if (announce) {
    chime(510 + safeIndex * 65, 0.12);
    say(state[slot].name);
  }
}
function roll(slot, options = {}) {
  const { announce = true, showToast = true } = options;
  let index = Math.floor(Math.random() * choices[slot].length);
  const current = choices[slot].indexOf(state[slot]);
  if (choices[slot].length > 1 && index === current) index = (index + 1) % choices[slot].length;
  animateSlot(slot);
  setTimeout(() => setChoice(slot, index, { announce, animateStory: true }), 190);
  if (showToast) {
    const title = slot === 'setting' ? 'Where' : slot === 'problem' ? 'What happened' : slot === 'surprise' ? 'Surprise' : 'Who';
    flash(`${title}: ${choices[slot][index].name}`);
  }
}
function burst(centerX = 43, centerY = 57, count = 22) {
  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement('i');
    particle.className = 'magic-particle';
    particle.style.left = `${centerX + (Math.random() - 0.5) * 10}%`;
    particle.style.top = `${centerY + (Math.random() - 0.5) * 6}%`;
    particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
    particle.style.setProperty('--dy', `${-30 - Math.random() * 100}px`);
    particle.style.setProperty('--delay', `${Math.random() * 0.12}s`);
    canvas.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}
function setRollingAll(active) {
  state.rollingAll = active;
  canvas.classList.toggle('is-rolling', active);
  rollStoryButton.disabled = active;
  rollAgainButton.disabled = active;
}
function rollAll() {
  if (state.rollingAll) return;
  setRollingAll(true);
  const slots = ['character', 'setting', 'problem', 'surprise'];
  slots.forEach((slot, index) => setTimeout(() => {
    chime(430 + index * 110, 0.1, 0.025);
    roll(slot, { announce: false, showToast: false });
  }, index * 155));
  setTimeout(() => {
    state.count += 1;
    localStorage.setItem('hauntedStoryCount', String(state.count));
    storyCount.textContent = String(state.count);
    refreshStory(true);
    saveSelections();
    burst();
    chime(880, 0.32, 0.045);
    say(storyText.textContent);
    flash('A new magical story is ready!', 2100);
    setRollingAll(false);
  }, 880);
}
function render(group, id) {
  const holder = document.getElementById(id);
  choices[group].forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.choiceSlot = group;
    button.dataset.index = String(index);
    button.setAttribute('aria-label', item.name);
    button.title = item.name;
    button.addEventListener('click', () => {
      if (state.rollingAll) return;
      animateSlot(group);
      setChoice(group, index, { announce: true, animateStory: true });
    });
    holder.appendChild(button);
  });
}
function openSettings() {
  settingsPanel.hidden = false;
  document.getElementById('settingsToggle').setAttribute('aria-expanded', 'true');
  setTimeout(() => settingsPanel.classList.add('show'), 10);
}
function closeSettings() {
  settingsPanel.classList.remove('show');
  document.getElementById('settingsToggle').setAttribute('aria-expanded', 'false');
  setTimeout(() => { settingsPanel.hidden = true; }, 180);
}

render('character', 'characterChoices');
render('setting', 'settingChoices');
render('problem', 'problemChoices');
render('surprise', 'surpriseChoices');
Object.keys(choices).forEach(slot => {
  const index = choices[slot].indexOf(state[slot]);
  setChoice(slot, index, { announce: false, animateStory: false });
});
refreshStory(false);
saveSelections();
syncAudioButtons();

document.querySelectorAll('[data-roll]').forEach(button => button.addEventListener('click', () => {
  if (state.rollingAll) return;
  roll(button.dataset.roll, { announce: true, showToast: true });
}));
rollStoryButton.addEventListener('click', rollAll);
rollAgainButton.addEventListener('click', rollAll);
document.getElementById('readAloud').addEventListener('click', () => {
  chime(740, 0.12);
  say(storyText.textContent);
});
musicToggle.addEventListener('click', toggleMusic);
soundToggle.addEventListener('click', () => {
  state.sound = !state.sound;
  localStorage.setItem('hauntedSpeech', state.sound ? 'on' : 'off');
  if (!state.sound && 'speechSynthesis' in window) speechSynthesis.cancel();
  syncAudioButtons();
  flash(state.sound ? 'Spoken English is on.' : 'Spoken English is off.');
});
document.getElementById('settingsToggle').addEventListener('click', () => settingsPanel.hidden ? openSettings() : closeSettings());
document.getElementById('closeSettings').addEventListener('click', closeSettings);
settingsSpeech.addEventListener('click', () => soundToggle.click());
settingsMusic.addEventListener('click', toggleMusic);
document.getElementById('resetProgress').addEventListener('click', () => {
  state.count = 0;
  storyCount.textContent = '0';
  localStorage.setItem('hauntedStoryCount', '0');
  flash('Story counter reset.');
});
document.querySelectorAll('.future-link').forEach(button => button.addEventListener('click', () => {
  flash(`${button.dataset.room} is coming soon. Pumpkin Patch is ready now!`, 2200);
}));
const storyJump = document.querySelector('[data-jump="story"]');
if (storyJump) storyJump.addEventListener('click', () => {
  rollStoryButton.focus({ preventScroll: true });
  flash('Choose four cards, or roll the whole story!');
});
