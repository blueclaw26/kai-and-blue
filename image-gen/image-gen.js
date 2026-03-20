// Random prompts
const RANDOM_PROMPTS = [
  "a cat wearing a tiny top hat, sitting on a stack of books",
  "a futuristic city at sunset with flying cars",
  "a cozy coffee shop interior with rain outside the window",
  "an astronaut riding a horse on mars",
  "a Japanese garden in autumn with red maple leaves",
  "a steampunk robot playing chess",
  "underwater city with bioluminescent buildings",
  "a fox reading a newspaper in a forest clearing",
  "a medieval castle made entirely of crystals",
  "a giant octopus emerging from the ocean at dawn",
  "a tiny dragon sleeping on a keyboard",
  "a vintage train traveling through a snowy mountain pass",
  "a cyberpunk street food vendor at night",
  "a library that extends infinitely in all directions",
  "a whale flying through clouds above a city",
  "a samurai standing in a field of sunflowers",
  "a treehouse city connected by rope bridges",
  "a glass bottle containing a tiny universe",
  "a polar bear in a tropical beach setting",
  "an ancient temple overgrown with glowing mushrooms",
  "a cat astronaut floating in space with Earth in the background",
  "a magical bookshop where books fly off the shelves",
  "a tiny house on the back of a giant turtle",
  "a neon-lit ramen shop on a rainy Tokyo street"
];

// DOM elements
const promptInput = document.getElementById('prompt');
const negativeInput = document.getElementById('negative');
const styleSelect = document.getElementById('style-select');
const sizeSelect = document.getElementById('size-select');
const ratioSelect = document.getElementById('ratio-select');
const seedInput = document.getElementById('seed-input');
const generateBtn = document.getElementById('generate-btn');
const randomBtn = document.getElementById('random-btn');
const resultSection = document.getElementById('result-section');
const loadingEl = document.getElementById('loading');
const generatedImage = document.getElementById('generated-image');
const downloadBtn = document.getElementById('download-btn');
const historySection = document.getElementById('history-section');
const historyChips = document.getElementById('history-chips');

// Calculate dimensions from size + ratio
function getDimensions() {
  const base = parseInt(sizeSelect.value);
  const ratio = ratioSelect.value;
  if (ratio === '16:9') return { width: base, height: Math.round(base * 9 / 16) };
  if (ratio === '9:16') return { width: Math.round(base * 9 / 16), height: base };
  return { width: base, height: base };
}

// Build the full prompt
function buildPrompt() {
  let prompt = promptInput.value.trim();
  if (!prompt) return '';

  const style = styleSelect.value;
  if (style) prompt += ', ' + style;

  const negative = negativeInput.value.trim();
  if (negative) prompt += ', avoid: ' + negative;

  return prompt;
}

// Build the API URL
function buildUrl(prompt) {
  const { width, height } = getDimensions();
  const encoded = encodeURIComponent(prompt);
  let url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true`;

  const seed = seedInput.value.trim();
  if (seed) url += `&seed=${seed}`;

  // Cache bust to avoid browser caching
  url += `&_t=${Date.now()}`;
  return url;
}

// History management
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem('imageGenHistory') || '[]');
  } catch { return []; }
}

function saveToHistory(prompt) {
  let history = getHistory();
  // Remove duplicate if exists
  history = history.filter(h => h !== prompt);
  history.unshift(prompt);
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem('imageGenHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historySection.style.display = 'none';
    return;
  }
  historySection.style.display = '';
  historyChips.innerHTML = '';
  history.forEach(prompt => {
    const chip = document.createElement('button');
    chip.className = 'history-chip';
    chip.textContent = prompt;
    chip.title = prompt;
    chip.addEventListener('click', () => {
      promptInput.value = prompt;
      promptInput.focus();
    });
    historyChips.appendChild(chip);
  });
}

// Generate image
function generate() {
  const fullPrompt = buildPrompt();
  if (!fullPrompt) {
    promptInput.focus();
    return;
  }

  // Save raw prompt to history
  saveToHistory(promptInput.value.trim());

  // Show loading
  resultSection.style.display = '';
  loadingEl.style.display = '';
  generatedImage.style.display = 'none';
  downloadBtn.style.display = 'none';
  generateBtn.disabled = true;
  generateBtn.textContent = '生成中...';

  const url = buildUrl(fullPrompt);

  // Directly set src on the displayed image element
  generatedImage.onload = () => {
    generatedImage.style.display = '';
    loadingEl.style.display = 'none';
    downloadBtn.style.display = '';
    generateBtn.disabled = false;
    generateBtn.textContent = '生成する';
  };

  generatedImage.onerror = () => {
    loadingEl.style.display = 'none';
    generatedImage.style.display = 'none';
    downloadBtn.style.display = 'none';
    generateBtn.disabled = false;
    generateBtn.textContent = '生成する';
    alert('画像の生成に失敗しました。英語のプロンプトで試してみてください。');
  };

  generatedImage.src = url;
}

// Download
function downloadImage() {
  const img = generatedImage;
  if (!img.src || img.style.display === 'none') return;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Random prompt
function setRandomPrompt() {
  const idx = Math.floor(Math.random() * RANDOM_PROMPTS.length);
  promptInput.value = RANDOM_PROMPTS[idx];
  promptInput.focus();
}

// Event listeners
generateBtn.addEventListener('click', generate);
randomBtn.addEventListener('click', setRandomPrompt);
downloadBtn.addEventListener('click', downloadImage);

promptInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    generate();
  }
});

// Init
renderHistory();
