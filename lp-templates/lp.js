const templates = [
  {
    id: 'hero-cta',
    name: 'Hero + CTA',
    desc: '大きなヒーローエリア、見出し、CTA',
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #222; }
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 24px;
}
.hero h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.2;
}
.hero p {
  font-size: 1.2rem;
  max-width: 560px;
  opacity: 0.9;
  margin-bottom: 32px;
  line-height: 1.7;
}
.cta-btn {
  display: inline-block;
  padding: 16px 48px;
  background: white;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.features {
  padding: 80px 24px;
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  text-align: center;
}
.feat h3 { font-size: 1.1rem; margin: 12px 0 8px; }
.feat p { font-size: 0.9rem; color: #666; line-height: 1.6; }
.feat-icon { font-size: 2rem; }
@media (max-width: 600px) {
  .hero h1 { font-size: 2rem; }
  .features { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<div class="hero">
  <h1>あなたのビジネスを<br>次のレベルへ</h1>
  <p>シンプルで強力なツールで、チームの生産性を劇的に向上させましょう。今すぐ無料トライアルを始めてみませんか。</p>
  <a href="#" class="cta-btn">無料で始める →</a>
</div>
<div class="features">
  <div class="feat">
    <div class="feat-icon">⚡</div>
    <h3>高速パフォーマンス</h3>
    <p>最新の技術で構築された、ストレスフリーな操作体験。</p>
  </div>
  <div class="feat">
    <div class="feat-icon">🔒</div>
    <h3>セキュリティ</h3>
    <p>エンタープライズレベルの暗号化で、データを安全に保護。</p>
  </div>
  <div class="feat">
    <div class="feat-icon">📊</div>
    <h3>分析ダッシュボード</h3>
    <p>リアルタイムのデータ可視化で、的確な判断をサポート。</p>
  </div>
</div>
</body>
</html>`
  },
  {
    id: 'feature-grid',
    name: 'Feature Grid',
    desc: '見出し、3カラム機能カード、CTA',
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fafafa; }
.header {
  text-align: center;
  padding: 80px 24px 40px;
}
.header h1 {
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.header p {
  font-size: 1.1rem;
  color: #666;
  max-width: 500px;
  margin: 0 auto;
}
.grid {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}
.card:hover { transform: translateY(-4px); }
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-bottom: 16px;
}
.card-icon.blue { background: #e8f0fe; }
.card-icon.green { background: #e6f4ea; }
.card-icon.orange { background: #fef3e2; }
.card h3 { font-size: 1.05rem; margin-bottom: 8px; }
.card p { font-size: 0.9rem; color: #555; line-height: 1.7; }
.cta-section {
  text-align: center;
  padding: 40px 24px 80px;
}
.cta-btn {
  display: inline-block;
  padding: 14px 40px;
  background: #1a73e8;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}
.cta-btn:hover { background: #1557b0; }
@media (max-width: 600px) {
  .grid { grid-template-columns: 1fr; }
  .header h1 { font-size: 1.8rem; }
}
</style>
</head>
<body>
<div class="header">
  <h1>すべてが揃った<br>オールインワン</h1>
  <p>必要な機能を、ひとつのプラットフォームで。複雑さを排除し、本質に集中。</p>
</div>
<div class="grid">
  <div class="card">
    <div class="card-icon blue">📝</div>
    <h3>タスク管理</h3>
    <p>ドラッグ＆ドロップで直感的にタスクを整理。チーム全員の進捗が一目でわかる。</p>
  </div>
  <div class="card">
    <div class="card-icon green">💬</div>
    <h3>リアルタイムチャット</h3>
    <p>プロジェクトごとのチャンネルで、情報がスレッドに整理される。検索も簡単。</p>
  </div>
  <div class="card">
    <div class="card-icon orange">📁</div>
    <h3>ファイル共有</h3>
    <p>安全なクラウドストレージで、チームのファイルを一元管理。バージョン管理も自動。</p>
  </div>
</div>
<div class="cta-section">
  <a href="#" class="cta-btn">今すぐ無料で試す</a>
</div>
</body>
</html>`
  },
  {
    id: 'testimonial',
    name: 'Testimonial',
    desc: '見出し、お客様の声、CTA',
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #0f172a; }
.hero {
  text-align: center;
  padding: 80px 24px 48px;
  color: white;
}
.hero h1 {
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.hero p {
  font-size: 1.05rem;
  color: #94a3b8;
  max-width: 480px;
  margin: 0 auto;
}
.testimonials {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 24px 60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.quote-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 28px 24px;
  border: 1px solid #334155;
}
.stars {
  color: #fbbf24;
  font-size: 0.9rem;
  margin-bottom: 12px;
}
.quote-card blockquote {
  font-size: 0.92rem;
  color: #cbd5e1;
  line-height: 1.8;
  margin-bottom: 16px;
}
.author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4a8f7f;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
}
.author-info .name { font-size: 0.85rem; color: white; font-weight: 600; }
.author-info .role { font-size: 0.75rem; color: #64748b; }
.cta-section {
  text-align: center;
  padding: 20px 24px 80px;
}
.cta-btn {
  display: inline-block;
  padding: 14px 40px;
  background: #4a8f7f;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  text-decoration: none;
  transition: background 0.2s;
}
.cta-btn:hover { background: #3d7a6b; }
@media (max-width: 600px) {
  .testimonials { grid-template-columns: 1fr; }
  .hero h1 { font-size: 1.8rem; }
}
</style>
</head>
<body>
<div class="hero">
  <h1>お客様の声</h1>
  <p>実際にご利用いただいているお客様からの評価をご紹介します。</p>
</div>
<div class="testimonials">
  <div class="quote-card">
    <div class="stars">★★★★★</div>
    <blockquote>「導入後、チームの生産性が30%向上しました。UIが直感的で、トレーニング不要でした。」</blockquote>
    <div class="author">
      <div class="avatar">田</div>
      <div class="author-info">
        <div class="name">田中太郎</div>
        <div class="role">CTO, テック株式会社</div>
      </div>
    </div>
  </div>
  <div class="quote-card">
    <div class="stars">★★★★★</div>
    <blockquote>「カスタマーサポートの対応が素晴らしい。質問にはいつも丁寧に答えてくれます。」</blockquote>
    <div class="author">
      <div class="avatar">佐</div>
      <div class="author-info">
        <div class="name">佐藤花子</div>
        <div class="role">マネージャー, デザイン社</div>
      </div>
    </div>
  </div>
  <div class="quote-card">
    <div class="stars">★★★★★</div>
    <blockquote>「他のツールから乗り換えて大正解。コストを半分に削減しつつ、機能は2倍に。」</blockquote>
    <div class="author">
      <div class="avatar">鈴</div>
      <div class="author-info">
        <div class="name">鈴木一郎</div>
        <div class="role">CEO, スタートアップ inc.</div>
      </div>
    </div>
  </div>
</div>
<div class="cta-section">
  <a href="#" class="cta-btn">無料トライアルを始める</a>
</div>
</body>
</html>`
  },
  {
    id: 'pricing',
    name: 'Pricing',
    desc: '見出し、3つの料金プラン、CTA',
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #f8fafc; }
.header {
  text-align: center;
  padding: 80px 24px 48px;
}
.header h1 {
  font-size: 2.4rem;
  font-weight: 700;
  margin-bottom: 12px;
}
.header p {
  font-size: 1.05rem;
  color: #666;
}
.pricing {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px 80px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: start;
}
.plan {
  background: white;
  border-radius: 16px;
  padding: 36px 28px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 2px solid transparent;
  transition: transform 0.2s;
}
.plan:hover { transform: translateY(-4px); }
.plan.popular {
  border-color: #4a8f7f;
  position: relative;
}
.popular-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: #4a8f7f;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 20px;
}
.plan-name {
  font-size: 1rem;
  color: #888;
  font-weight: 500;
  margin-bottom: 8px;
}
.plan-price {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 4px;
}
.plan-price span { font-size: 1rem; color: #888; font-weight: 400; }
.plan-desc {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 24px;
}
.plan ul {
  list-style: none;
  margin-bottom: 28px;
  text-align: left;
}
.plan li {
  font-size: 0.9rem;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
}
.plan li::before {
  content: "✓ ";
  color: #4a8f7f;
  font-weight: 600;
}
.plan-btn {
  display: block;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid #4a8f7f;
  background: transparent;
  color: #4a8f7f;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.plan-btn:hover, .plan.popular .plan-btn {
  background: #4a8f7f;
  color: white;
}
.plan.popular .plan-btn:hover {
  background: #3d7a6b;
  border-color: #3d7a6b;
}
@media (max-width: 600px) {
  .pricing { grid-template-columns: 1fr; }
  .header h1 { font-size: 1.8rem; }
}
</style>
</head>
<body>
<div class="header">
  <h1>シンプルな料金プラン</h1>
  <p>チームの規模に合わせて、最適なプランをお選びください。</p>
</div>
<div class="pricing">
  <div class="plan">
    <div class="plan-name">Starter</div>
    <div class="plan-price">¥0<span>/月</span></div>
    <div class="plan-desc">個人利用に最適</div>
    <ul>
      <li>3プロジェクトまで</li>
      <li>1GBストレージ</li>
      <li>基本レポート</li>
      <li>メールサポート</li>
    </ul>
    <a href="#" class="plan-btn">無料で始める</a>
  </div>
  <div class="plan popular">
    <div class="popular-badge">人気No.1</div>
    <div class="plan-name">Pro</div>
    <div class="plan-price">¥2,980<span>/月</span></div>
    <div class="plan-desc">成長中のチームに</div>
    <ul>
      <li>無制限プロジェクト</li>
      <li>50GBストレージ</li>
      <li>高度な分析</li>
      <li>優先サポート</li>
    </ul>
    <a href="#" class="plan-btn">14日間無料トライアル</a>
  </div>
  <div class="plan">
    <div class="plan-name">Enterprise</div>
    <div class="plan-price">¥9,800<span>/月</span></div>
    <div class="plan-desc">大規模チーム向け</div>
    <ul>
      <li>すべてのPro機能</li>
      <li>無制限ストレージ</li>
      <li>SSO/SAML認証</li>
      <li>専任サポート</li>
    </ul>
    <a href="#" class="plan-btn">お問い合わせ</a>
  </div>
</div>
</body>
</html>`
  }
];

function init() {
  const gallery = document.getElementById('gallery');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const previewFrame = document.getElementById('preview-frame');
  const sourceView = document.getElementById('source-view');
  const tabPreview = document.getElementById('tab-preview');
  const tabSource = document.getElementById('tab-source');
  const closeBtn = document.getElementById('close-btn');

  // Render gallery cards
  templates.forEach(t => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <iframe class="card-preview" srcdoc="${escapeAttr(t.html)}" sandbox="allow-same-origin" scrolling="no" loading="lazy"></iframe>
      <div class="card-info">
        <h3>${t.name}</h3>
        <p>${t.desc}</p>
      </div>
      <div class="card-actions">
        <button class="btn btn-preview" data-id="${t.id}">プレビュー</button>
        <button class="btn btn-source" data-id="${t.id}" data-mode="source">ソースを見る</button>
      </div>
    `;
    gallery.appendChild(card);
  });

  // Event delegation for buttons
  gallery.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const t = templates.find(x => x.id === btn.dataset.id);
    if (!t) return;
    openOverlay(t, btn.dataset.mode === 'source' ? 'source' : 'preview');
  });

  function openOverlay(t, mode) {
    overlayTitle.textContent = t.name;
    previewFrame.srcdoc = t.html;
    sourceView.textContent = t.html;
    showTab(mode);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function showTab(mode) {
    if (mode === 'source') {
      previewFrame.style.display = 'none';
      sourceView.style.display = 'block';
      tabSource.classList.add('active');
      tabPreview.classList.remove('active');
    } else {
      previewFrame.style.display = 'block';
      sourceView.style.display = 'none';
      tabPreview.classList.add('active');
      tabSource.classList.remove('active');
    }
  }

  tabPreview.addEventListener('click', () => showTab('preview'));
  tabSource.addEventListener('click', () => showTab('source'));

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeOverlay();
  });

  function closeOverlay() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    previewFrame.srcdoc = '';
  }
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', init);
