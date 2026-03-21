(() => {
  'use strict';

  const SHOWS = [
    { date: '2026-03-19', disp: '3/19 (木)', pref: '静岡', venue: 'アクトシティ浜松 大ホール' },
    { date: '2026-03-23', disp: '3/23 (月)', pref: '大阪', venue: 'フェスティバルホール' },
    { date: '2026-03-24', disp: '3/24 (火)', pref: '大阪', venue: 'フェスティバルホール' },
    { date: '2026-03-27', disp: '3/27 (金)', pref: '新潟', venue: '新潟県民会館' },
    { date: '2026-04-02', disp: '4/2 (木)', pref: '京都', venue: 'ロームシアター京都 メインホール' },
    { date: '2026-04-04', disp: '4/4 (土)', pref: '福井', venue: 'フェニックス・プラザ エルピス 大ホール' },
    { date: '2026-04-06', disp: '4/6 (月)', pref: '石川', venue: '金沢歌劇座' },
    { date: '2026-04-10', disp: '4/10 (金)', pref: '香川', venue: 'レクザムホール 大ホール' },
    { date: '2026-04-13', disp: '4/13 (月)', pref: '愛媛', venue: '松山市民会館 大ホール' },
    { date: '2026-04-18', disp: '4/18 (土)', pref: '北海道', venue: '帯広市民文化ホール 大ホール' },
    { date: '2026-04-20', disp: '4/20 (月)', pref: '北海道', venue: '札幌文化芸術劇場hitaru' },
    { date: '2026-04-21', disp: '4/21 (火)', pref: '北海道', venue: '札幌文化芸術劇場hitaru' },
    { date: '2026-04-24', disp: '4/24 (金)', pref: '東京', venue: '府中の森芸術劇場 どりーむホール' },
    { date: '2026-04-26', disp: '4/26 (日)', pref: '茨城', venue: 'ザ・ヒロサワ・シティ会館 大ホール' },
    { date: '2026-05-06', disp: '5/6 (水)', pref: '東京', venue: 'SGCホール有明' },
    { date: '2026-05-08', disp: '5/8 (金)', pref: '広島', venue: '広島文化学園HBGホール' },
    { date: '2026-05-09', disp: '5/9 (土)', pref: '広島', venue: '広島文化学園HBGホール' },
    { date: '2026-05-15', disp: '5/15 (金)', pref: '秋田', venue: 'あきた芸術劇場ミルハス 大ホール' },
    { date: '2026-05-17', disp: '5/17 (日)', pref: '岩手', venue: 'トーサイクラシックホール岩手 大ホール' },
    { date: '2026-05-19', disp: '5/19 (火)', pref: '宮城', venue: '仙台サンプラザホール' },
    { date: '2026-05-20', disp: '5/20 (水)', pref: '宮城', venue: '仙台サンプラザホール' },
    { date: '2026-05-29', disp: '5/29 (金)', pref: '三重', venue: '三重県文化会館 大ホール' },
    { date: '2026-05-30', disp: '5/30 (土)', pref: '岐阜', venue: '長良川国際会議場 メインホール' },
    { date: '2026-06-03', disp: '6/3 (水)', pref: '鳥取', venue: '米子コンベンションセンター 多目的ホール', reschedule: true },
    { date: '2026-06-05', disp: '6/5 (金)', pref: '島根', venue: '島根県芸術文化センター「グラントワ」大ホール', reschedule: true },
    { date: '2026-06-09', disp: '6/9 (火)', pref: '愛知', venue: 'Niterra日本特殊陶業市民会館 フォレストホール' },
    { date: '2026-06-10', disp: '6/10 (水)', pref: '愛知', venue: 'Niterra日本特殊陶業市民会館 フォレストホール' },
    { date: '2026-06-14', disp: '6/14 (日)', pref: '長崎', venue: 'アルカスSASEBO 大ホール' },
    { date: '2026-06-16', disp: '6/16 (火)', pref: '福岡', venue: '福岡サンパレス ホテル＆ホール' },
    { date: '2026-06-17', disp: '6/17 (水)', pref: '福岡', venue: '福岡サンパレス ホテル＆ホール' },
    { date: '2026-06-20', disp: '6/20 (土)', pref: '沖縄', venue: '沖縄コンベンションセンター 劇場棟' },
    { date: '2026-06-25', disp: '6/25 (木)', pref: '千葉', venue: '市原市市民会館 大ホール', reschedule: true },
    { date: '2026-06-30', disp: '6/30 (火)', pref: '兵庫', venue: '神戸国際会館 こくさいホール', reschedule: true },
    { date: '2026-07-07', disp: '7/7 (火)', pref: '東京', venue: '東京ガーデンシアター' },
    { date: '2026-07-08', disp: '7/8 (水)', pref: '東京', venue: '東京ガーデンシアター' },
  ];

  // Gourmet data keyed by venue name
  const GOURMET = {
    'アクトシティ浜松 大ホール': {
      area: '静岡（浜松）',
      items: [
        { name: '浜松餃子', desc: '浜松のソウルフード。円形に並べて焼くスタイル。「むつぎく」「石松」など有名店多数', tag: 'ご当地グルメ', emoji: '🥟' },
        { name: 'うなぎ', desc: '浜松はうなぎの名産地。「うなぎ藤田」「八百徳」が老舗', tag: '名物', emoji: '🐟' },
        { name: '遠州焼き', desc: 'たくあん入りのお好み焼き。ローカル感満載', tag: 'B級グルメ', emoji: '🫓' },
        { name: 'さわやか', desc: '静岡限定ハンバーグレストラン。げんこつハンバーグが名物。混雑必至', tag: '名物', emoji: '🍖' },
      ]
    },
    'フェスティバルホール': {
      area: '大阪（中之島エリア）',
      items: [
        { name: 'たこ焼き', desc: '「はなだこ」（梅田）、「わなか」（難波）。会場前後に寄りやすい', tag: 'ご当地グルメ', emoji: '🐙' },
        { name: 'お好み焼き', desc: '中之島から歩ける「福太郎」（難波方面）', tag: 'ご当地グルメ', emoji: '🫓' },
        { name: '串カツ', desc: '新世界の「だるま」が有名だが、梅田にも店舗あり', tag: '名物', emoji: '🍢' },
        { name: '551蓬莱', desc: '豚まん。テイクアウトして会場に持ち込み可', tag: '名物', emoji: '🥟' },
        { name: '北新地の居酒屋', desc: 'フェスティバルホール徒歩圏。ライブ後の打ち上げに', tag: '居酒屋', emoji: '🍶' },
      ]
    },
    '新潟県民会館': {
      area: '新潟',
      items: [
        { name: 'へぎそば', desc: '新潟名物。布海苔をつなぎに使った蕎麦。「小嶋屋」が有名', tag: '名物', emoji: '🍜' },
        { name: 'タレカツ丼', desc: '卵でとじない、甘辛タレのカツ丼。「とんかつ太郎」が元祖', tag: 'ご当地グルメ', emoji: '🍱' },
        { name: '日本酒', desc: '新潟は酒蔵数日本一。「ぽんしゅ館」で利き酒できる', tag: '名物', emoji: '🍶' },
        { name: 'イタリアン', desc: '新潟限定B級グルメ。焼きそばにミートソース。「みかづき」', tag: 'B級グルメ', emoji: '🍝' },
      ]
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function toDate(s) {
    return new Date(s + 'T00:00:00+09:00');
  }

  // Find first upcoming show index
  let nextShowIdx = -1;
  for (let i = 0; i < SHOWS.length; i++) {
    if (toDate(SHOWS[i].date) >= today) {
      nextShowIdx = i;
      break;
    }
  }

  // Build the first 3 upcoming venue names (unique venues)
  const upcomingGourmetVenues = new Set();
  if (nextShowIdx >= 0) {
    for (let i = nextShowIdx; i < SHOWS.length && upcomingGourmetVenues.size < 3; i++) {
      // Use the base venue name for matching
      const v = SHOWS[i].venue;
      if (GOURMET[v]) {
        upcomingGourmetVenues.add(v);
      }
    }
  }

  const timeline = document.getElementById('timeline');

  SHOWS.forEach((show, idx) => {
    const showDate = toDate(show.date);
    const isPast = showDate < today;
    const isNext = idx === nextShowIdx;

    const card = document.createElement('div');
    card.className = 'show-card' + (isPast ? ' past' : '') + (isNext ? ' next-show' : '');
    card.dataset.idx = idx;

    // Header
    let badges = '';
    if (isPast) {
      badges += '<span class="badge badge-soldout">終了</span>';
    } else if (isNext) {
      badges += '<span class="badge badge-upcoming">NEXT</span>';
    }
    if (show.reschedule) {
      badges += '<span class="badge badge-reschedule">振替</span>';
    }

    card.innerHTML = `
      <div class="card-header">
        <span class="card-date">${show.disp}</span>
        <span class="card-pref">${show.pref}${badges}</span>
      </div>
      <div class="card-venue">${show.venue}</div>
    `;

    // Gourmet panel
    const gourmet = GOURMET[show.venue];
    const hasGourmet = gourmet && upcomingGourmetVenues.has(show.venue) && !isPast;

    const panel = document.createElement('div');
    panel.className = 'gourmet-panel';

    if (hasGourmet) {
      let itemsHtml = gourmet.items.map(item => `
        <div class="gourmet-item">
          <span class="gourmet-emoji">${item.emoji}</span>
          <div class="gourmet-body">
            <div class="gourmet-name">${item.name}</div>
            <div class="gourmet-desc">${item.desc}</div>
            <span class="gourmet-tag">${item.tag}</span>
          </div>
        </div>
      `).join('');
      panel.innerHTML = `<div class="gourmet-list">${itemsHtml}</div>`;
    } else if (!isPast) {
      panel.innerHTML = '<div class="gourmet-placeholder">グルメ情報は順次追加予定</div>';
    }

    card.appendChild(panel);

    // Click to toggle
    card.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      // Close all others
      document.querySelectorAll('.gourmet-panel.open').forEach(p => p.classList.remove('open'));
      if (!isOpen) {
        panel.classList.add('open');
      }
    });

    timeline.appendChild(card);
  });

  // Scroll to next show button
  const scrollBtn = document.getElementById('scrollToNext');
  if (nextShowIdx >= 0) {
    scrollBtn.addEventListener('click', () => {
      const nextCard = timeline.querySelector('.next-show');
      if (nextCard) {
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Flash
        nextCard.style.transform = 'scale(1.02)';
        setTimeout(() => { nextCard.style.transform = ''; }, 400);
      }
    });
  } else {
    scrollBtn.style.display = 'none';
  }

  // Auto-scroll on load
  requestAnimationFrame(() => {
    const nextCard = timeline.querySelector('.next-show');
    if (nextCard) {
      setTimeout(() => {
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  });

})();
