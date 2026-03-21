(() => {
  'use strict';

  const API_HEADERS = { 'Api-User-Agent': 'KaiAndBlue/1.0' };
  const MAX_HISTORY = 20;

  const gachaBtn = document.getElementById('gacha-btn');
  const cardContainer = document.getElementById('card-container');
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error-msg');
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');

  let currentCard = null; // { title, extract, thumbnail, pageUrl, links }
  let history = [];
  let isFirstDraw = true;
  let isFetching = false;

  // --- API ---

  async function fetchRandomSummary() {
    const res = await fetch('https://ja.wikipedia.org/api/rest_v1/page/random/summary', {
      headers: API_HEADERS
    });
    if (!res.ok) throw new Error('記事の取得に失敗しました');
    return res.json();
  }

  async function fetchSummary(title) {
    const res = await fetch(
      `https://ja.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: API_HEADERS }
    );
    if (!res.ok) throw new Error(`「${title}」の取得に失敗しました`);
    return res.json();
  }

  async function fetchLinks(title) {
    const url = `https://ja.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=links&pllimit=50&plnamespace=0&format=json&origin=*`;
    const res = await fetch(url, { headers: API_HEADERS });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];
    const page = Object.values(pages)[0];
    if (!page?.links) return [];
    return page.links
      .map(l => l.title)
      .filter(t => !t.includes(':'));
  }

  function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // --- Card Data ---

  function parseArticleData(summary, links) {
    return {
      title: summary.title,
      extract: summary.extract || '',
      thumbnail: summary.thumbnail?.source || null,
      pageUrl: summary.content_urls?.desktop?.page || `https://ja.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
      links: pickRandom(links, Math.min(5, Math.max(3, links.length)))
    };
  }

  // --- Rendering ---

  function truncate(text, max) {
    if (text.length <= max) return text;
    return text.slice(0, max) + '...';
  }

  function buildCardEl(data) {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = data.title;
    card.appendChild(title);

    if (data.thumbnail) {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = data.thumbnail;
      img.alt = data.title;
      img.loading = 'lazy';
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-image-placeholder';
      ph.textContent = '📄';
      card.appendChild(ph);
    }

    const extract = document.createElement('div');
    extract.className = 'card-extract';
    extract.textContent = truncate(data.extract, 140);
    card.appendChild(extract);

    if (data.links.length > 0) {
      const linksDiv = document.createElement('div');
      linksDiv.className = 'card-links';
      data.links.forEach(linkTitle => {
        const chip = document.createElement('button');
        chip.className = 'link-chip';
        chip.textContent = linkTitle;
        chip.title = linkTitle;
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          loadArticle(linkTitle);
        });
        linksDiv.appendChild(chip);
      });
      card.appendChild(linksDiv);
    }

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const link = document.createElement('a');
    link.href = data.pageUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Wikipediaで読む →';
    footer.appendChild(link);
    card.appendChild(footer);

    return card;
  }

  function buildCardBack() {
    const back = document.createElement('div');
    back.className = 'card-back';
    const mark = document.createElement('div');
    mark.className = 'card-back-mark';
    mark.textContent = '?';
    back.appendChild(mark);
    return back;
  }

  function buildHistoryCard(data) {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.addEventListener('click', () => loadFromHistory(data));

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = data.title;
    card.appendChild(title);

    if (data.thumbnail) {
      const img = document.createElement('img');
      img.className = 'card-image';
      img.src = data.thumbnail;
      img.alt = data.title;
      img.loading = 'lazy';
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'card-image-placeholder';
      ph.textContent = '📄';
      card.appendChild(ph);
    }

    const extract = document.createElement('div');
    extract.className = 'card-extract';
    extract.textContent = truncate(data.extract, 60);
    card.appendChild(extract);

    return card;
  }

  // --- Display ---

  function showLoading(show) {
    loadingEl.classList.toggle('hidden', !show);
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.toggle('hidden', !msg);
  }

  function displayCard(data, animate) {
    // Push current to history
    if (currentCard) {
      history.unshift(currentCard);
      if (history.length > MAX_HISTORY) history.pop();
    }
    currentCard = data;

    // Build wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'card-flip-wrapper';

    const cardEl = buildCardEl(data);
    const backEl = buildCardBack();
    wrapper.appendChild(cardEl);
    wrapper.appendChild(backEl);

    // Animate out old card
    const oldWrapper = cardContainer.querySelector('.card-flip-wrapper');
    if (oldWrapper && animate === 'slide') {
      oldWrapper.classList.add('slide-out');
      oldWrapper.addEventListener('animationend', () => oldWrapper.remove(), { once: true });
      wrapper.classList.add('slide-in');
    } else if (oldWrapper) {
      oldWrapper.remove();
      wrapper.classList.add('flipping');
    } else {
      wrapper.classList.add('flipping');
    }

    cardContainer.appendChild(wrapper);

    // Update button
    if (isFirstDraw) {
      gachaBtn.textContent = 'もう一回引く';
      isFirstDraw = false;
    }

    // Render history
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
      historySection.classList.add('hidden');
      return;
    }
    historySection.classList.remove('hidden');
    history.forEach(data => {
      historyList.appendChild(buildHistoryCard(data));
    });
  }

  // --- Actions ---

  async function drawGacha() {
    if (isFetching) return;
    isFetching = true;
    gachaBtn.disabled = true;
    showError('');
    showLoading(true);

    try {
      const summary = await fetchRandomSummary();
      const links = await fetchLinks(summary.title);
      const data = parseArticleData(summary, links);
      displayCard(data, 'flip');
    } catch (err) {
      showError(err.message || 'エラーが発生しました');
    } finally {
      showLoading(false);
      isFetching = false;
      gachaBtn.disabled = false;
    }
  }

  async function loadArticle(title) {
    if (isFetching) return;
    isFetching = true;
    gachaBtn.disabled = true;
    showError('');
    showLoading(true);

    try {
      const [summary, links] = await Promise.all([
        fetchSummary(title),
        fetchLinks(title)
      ]);
      const data = parseArticleData(summary, links);
      displayCard(data, 'slide');
    } catch (err) {
      showError(err.message || 'エラーが発生しました');
    } finally {
      showLoading(false);
      isFetching = false;
      gachaBtn.disabled = false;
    }
  }

  function loadFromHistory(data) {
    if (isFetching) return;
    // Remove from history
    history = history.filter(h => h.title !== data.title);
    displayCard(data, 'slide');
  }

  // --- Init ---
  gachaBtn.addEventListener('click', drawGacha);
})();
