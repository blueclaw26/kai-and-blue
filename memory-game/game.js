(() => {
  const EMOJIS = ['🧪', '🔬', '⚗️', '🧬', '💊', '🌡️', '🔭', '🧫'];
  const grid = document.getElementById('grid');
  const movesEl = document.getElementById('moves');
  const matchesEl = document.getElementById('matches');
  const timerEl = document.getElementById('timer');
  const restartBtn = document.getElementById('restart');

  let cards = [];
  let flipped = [];
  let matched = 0;
  let moves = 0;
  let locked = false;
  let timerInterval = null;
  let seconds = 0;
  let started = false;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startTimer() {
    if (started) return;
    started = true;
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = seconds + 's';
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front"></div>
        <div class="card-face card-back">${emoji}</div>
      </div>`;
    card.addEventListener('click', () => flipCard(card));
    return card;
  }

  function flipCard(card) {
    if (locked) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;

    startTimer();
    card.classList.add('flipped');
    flipped.push(card);

    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = moves;
      locked = true;

      const [a, b] = flipped;
      if (a.dataset.emoji === b.dataset.emoji) {
        a.classList.add('matched');
        b.classList.add('matched');
        matched++;
        matchesEl.textContent = matched + ' / 8';
        flipped = [];
        locked = false;

        if (matched === 8) {
          stopTimer();
          const msg = document.createElement('div');
          msg.className = 'win-message';
          msg.textContent = `🎉 Complete! ${moves} moves, ${seconds}s`;
          document.querySelector('.container').appendChild(msg);
        }
      } else {
        setTimeout(() => {
          a.classList.remove('flipped');
          b.classList.remove('flipped');
          flipped = [];
          locked = false;
        }, 800);
      }
    }
  }

  function init() {
    grid.innerHTML = '';
    const existing = document.querySelector('.win-message');
    if (existing) existing.remove();

    cards = [];
    flipped = [];
    matched = 0;
    moves = 0;
    locked = false;
    seconds = 0;
    started = false;
    stopTimer();

    movesEl.textContent = '0';
    matchesEl.textContent = '0 / 8';
    timerEl.textContent = '0s';

    const deck = shuffle([...EMOJIS, ...EMOJIS]);
    deck.forEach((emoji, i) => {
      const card = createCard(emoji, i);
      cards.push(card);
      grid.appendChild(card);
    });
  }

  restartBtn.addEventListener('click', init);
  init();
})();
