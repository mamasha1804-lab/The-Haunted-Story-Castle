(() => {
  const IMAGE_W = 1448;
  const IMAGE_H = 1086;
  const SHEET = "assets/ChatGPT Image Aug 26, 2026, 01_21_56 AM.png";

  const sourceArt = {
    character: [
      [1097,98,51,79],
      [1157,98,51,79],
      [1217,98,51,79],
      [1277,98,51,79],
      [1337,98,51,79]
    ],
    setting: [
      [1099,359,50,78],
      [1159,359,50,78],
      [1219,359,50,78],
      [1279,359,50,78],
      [1339,359,50,78]
    ],
    problem: [
      [1091,621,52,77],
      [1155,621,52,77],
      [1219,621,52,77],
      [1283,621,52,77],
      [1347,621,52,77]
    ],
    surprise: [
      [1097,881,53,77],
      [1161,881,53,77],
      [1225,881,53,77],
      [1289,881,53,77],
      [1353,881,53,77]
    ]
  };

  function paint(node, rect) {
    if (!node || !rect) return;
    const [x, y, w, h] = rect;
    node.className = 'card-art source-crop';
    node.style.backgroundImage = `url("${SHEET}")`;
    node.style.backgroundRepeat = 'no-repeat';
    node.style.backgroundSize = `${(IMAGE_W / w) * 100}% ${(IMAGE_H / h) * 100}%`;
    node.style.backgroundPosition = `${(x / (IMAGE_W - w)) * 100}% ${(y / (IMAGE_H - h)) * 100}%`;
  }

  const originalUpdateArt = window.updateArt;
  window.updateArt = function(slot, index) {
    const node = document.getElementById(
      slot === 'character' ? 'artCharacter' :
      slot === 'setting' ? 'artSetting' :
      slot === 'problem' ? 'artProblem' : 'artSurprise'
    );
    const rect = sourceArt[slot] && sourceArt[slot][index];
    if (node && rect) paint(node, rect);
    else if (typeof originalUpdateArt === 'function') originalUpdateArt(slot, index);
  };

  function currentIndices() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('hauntedSelections') || '{}'); } catch {}
    return {
      character: Number.isInteger(Number(saved.character)) ? Number(saved.character) : 0,
      setting: Number.isInteger(Number(saved.setting)) ? Number(saved.setting) : 0,
      problem: Number.isInteger(Number(saved.problem)) ? Number(saved.problem) : 0,
      surprise: Number.isInteger(Number(saved.surprise)) ? Number(saved.surprise) : 2
    };
  }

  const indices = currentIndices();
  Object.entries(indices).forEach(([slot, index]) => window.updateArt(slot, index));
})();