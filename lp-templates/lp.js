window.LP_TEMPLATES = [
  // ─── Template 1: B2B SaaS ───
  {
    name: 'SaaS プロダクト',
    target: 'B2B / ビジネス',
    description: 'クリーンでプロフェッショナルなSaaS向けLP。機能紹介、料金表、FAQ付き。',
    colors: ['#2563eb', '#93c5fd'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CloudFlow — ビジネスを加速するSaaS</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans JP',sans-serif;color:#1a1a1a;background:#fff}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);color:#fff;padding:100px 20px 80px;text-align:center}
.hero h1{font-size:42px;font-weight:700;margin-bottom:16px;line-height:1.3}
.hero p{font-size:18px;opacity:0.9;max-width:600px;margin:0 auto 32px;line-height:1.7}
.btn-primary{display:inline-block;background:#fff;color:#2563eb;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;transition:transform 0.2s,box-shadow 0.2s}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.15)}
.btn-secondary{display:inline-block;border:2px solid rgba(255,255,255,0.5);color:#fff;padding:12px 32px;border-radius:8px;font-weight:500;font-size:15px;margin-left:12px;transition:border-color 0.2s}
.btn-secondary:hover{border-color:#fff}

/* Features */
.features{padding:80px 20px;max-width:960px;margin:0 auto;text-align:center}
.features h2{font-size:28px;font-weight:700;margin-bottom:12px}
.features>p{color:#6b6b6b;margin-bottom:48px;font-size:15px}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px}
.feature-card{padding:32px 24px;border-radius:12px;background:#f8fafc;text-align:center}
.feature-icon{font-size:36px;margin-bottom:16px}
.feature-card h3{font-size:17px;font-weight:600;margin-bottom:8px}
.feature-card p{color:#6b6b6b;font-size:14px;line-height:1.6}

/* Pricing */
.pricing{background:#f8fafc;padding:80px 20px}
.pricing h2{text-align:center;font-size:28px;font-weight:700;margin-bottom:48px}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto}
.price-card{background:#fff;border-radius:12px;padding:36px 28px;text-align:center;border:2px solid transparent;transition:border-color 0.2s}
.price-card.popular{border-color:#2563eb;position:relative}
.price-card.popular::before{content:"人気";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:600}
.price-card h3{font-size:18px;font-weight:600;margin-bottom:8px}
.price-amount{font-size:40px;font-weight:700;color:#2563eb;margin:16px 0 8px}
.price-amount span{font-size:16px;font-weight:400;color:#6b6b6b}
.price-card ul{list-style:none;margin:24px 0;text-align:left}
.price-card li{padding:8px 0;font-size:14px;color:#444;border-bottom:1px solid #f0f0f0}
.price-card li::before{content:"✓ ";color:#2563eb;font-weight:600}
.price-btn{display:block;width:100%;padding:12px;border-radius:8px;font-weight:600;font-size:14px;text-align:center;transition:background 0.2s}
.price-btn-outline{border:2px solid #2563eb;color:#2563eb;background:transparent}
.price-btn-outline:hover{background:#eff6ff}
.price-btn-fill{background:#2563eb;color:#fff;border:none}
.price-btn-fill:hover{background:#1d4ed8}

/* Trust */
.trust{padding:60px 20px;text-align:center;max-width:800px;margin:0 auto}
.trust p{color:#6b6b6b;font-size:14px;margin-bottom:24px;text-transform:uppercase;letter-spacing:1px}
.trust-logos{display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
.trust-logo{color:#aaa;font-size:18px;font-weight:600}

/* FAQ */
.faq{padding:80px 20px;max-width:700px;margin:0 auto}
.faq h2{text-align:center;font-size:28px;font-weight:700;margin-bottom:40px}
.faq-item{border-bottom:1px solid #e5e5e5;padding:20px 0}
.faq-item h3{font-size:16px;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.faq-item p{color:#6b6b6b;font-size:14px;line-height:1.7;margin-top:12px}

/* Footer */
footer{background:#1a1a1a;color:#fff;text-align:center;padding:40px 20px}
footer p{font-size:13px;opacity:0.6}

@media(max-width:768px){
  .hero h1{font-size:28px}
  .feature-grid,.pricing-grid{grid-template-columns:1fr}
  .btn-secondary{margin-left:0;margin-top:12px;display:inline-block}
}
</style>
</head>
<body>
  <section class="hero">
    <h1>ワークフローを、もっとスマートに</h1>
    <p>CloudFlowはチーム全体の生産性を向上させるオールインワンプラットフォーム。タスク管理、コミュニケーション、分析を一つに。</p>
    <a href="#" class="btn-primary">無料で始める</a>
    <a href="#" class="btn-secondary">デモを見る →</a>
  </section>

  <section class="features">
    <h2>すべてが、ひとつに</h2>
    <p>チームが本当に必要な機能だけを、シンプルに</p>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>リアルタイム分析</h3>
        <p>ダッシュボードでKPIを一目で把握。データドリブンな意思決定を支援します。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔗</div>
        <h3>シームレス連携</h3>
        <p>Slack、Google Workspace、Notionなど200以上のツールと簡単に接続。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>エンタープライズ・セキュリティ</h3>
        <p>SOC2 Type II準拠。データは暗号化され、安全に管理されます。</p>
      </div>
    </div>
  </section>

  <section class="pricing">
    <h2>シンプルな料金プラン</h2>
    <div class="pricing-grid">
      <div class="price-card">
        <h3>スターター</h3>
        <div class="price-amount">¥0<span>/月</span></div>
        <ul>
          <li>ユーザー3名まで</li>
          <li>基本的なタスク管理</li>
          <li>5GBストレージ</li>
          <li>メールサポート</li>
        </ul>
        <a href="#" class="price-btn price-btn-outline">無料で始める</a>
      </div>
      <div class="price-card popular">
        <h3>プロ</h3>
        <div class="price-amount">¥2,980<span>/月</span></div>
        <ul>
          <li>ユーザー無制限</li>
          <li>高度な分析機能</li>
          <li>100GBストレージ</li>
          <li>優先サポート</li>
          <li>API アクセス</li>
        </ul>
        <a href="#" class="price-btn price-btn-fill">プロを選ぶ</a>
      </div>
      <div class="price-card">
        <h3>エンタープライズ</h3>
        <div class="price-amount">要相談</div>
        <ul>
          <li>カスタム機能開発</li>
          <li>専任サポート担当</li>
          <li>無制限ストレージ</li>
          <li>SLA保証</li>
          <li>オンプレミス対応</li>
        </ul>
        <a href="#" class="price-btn price-btn-outline">お問い合わせ</a>
      </div>
    </div>
  </section>

  <section class="trust">
    <p>多くの企業に選ばれています</p>
    <div class="trust-logos">
      <span class="trust-logo">TechNova</span>
      <span class="trust-logo">GreenLeaf</span>
      <span class="trust-logo">SkyBridge</span>
      <span class="trust-logo">Matsuda Corp</span>
      <span class="trust-logo">NextWave</span>
    </div>
  </section>

  <section class="faq">
    <h2>よくある質問</h2>
    <div class="faq-item">
      <h3>無料プランに期限はありますか？</h3>
      <p>いいえ、無料プランは永続的にご利用いただけます。必要に応じていつでもアップグレード可能です。</p>
    </div>
    <div class="faq-item">
      <h3>データの移行はできますか？</h3>
      <p>はい、CSV/JSON形式でのインポートに対応しています。専任チームが移行をサポートします。</p>
    </div>
    <div class="faq-item">
      <h3>解約はいつでもできますか？</h3>
      <p>はい、いつでも解約可能です。日割り返金にも対応しています。</p>
    </div>
  </section>

  <footer>
    <p>&copy; 2026 CloudFlow Inc. All rights reserved.</p>
  </footer>
</body>
</html>`
  },

  // ─── Template 2: D2C 健康食品 ───
  {
    name: '健康食品',
    target: 'D2C / 一般消費者',
    description: '緊急感と社会的証明を重視したD2C向けLP。レビュー、比較表、限定オファー付き。',
    colors: ['#4a7c59', '#e8a44a'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ナチュラグリーン — 毎日の健康をサポート</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans JP',sans-serif;color:#1a1a1a;background:#fff}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{background:linear-gradient(135deg,#f5f0e6 0%,#e8e0d0 100%);padding:80px 20px;text-align:center;position:relative;overflow:hidden}
.hero-badge{display:inline-block;background:#e74c3c;color:#fff;padding:8px 20px;border-radius:30px;font-size:14px;font-weight:700;margin-bottom:24px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.hero h1{font-size:36px;font-weight:900;margin-bottom:16px;line-height:1.4;color:#2d5a3d}
.hero p{font-size:16px;color:#666;max-width:540px;margin:0 auto 24px;line-height:1.8}
.product-visual{width:280px;height:280px;background:linear-gradient(135deg,#4a7c59,#6da67a);border-radius:50%;margin:0 auto 32px;display:flex;align-items:center;justify-content:center;font-size:80px;box-shadow:0 20px 40px rgba(74,124,89,0.2)}
.btn-cta{display:inline-block;background:#4a7c59;color:#fff;padding:16px 48px;border-radius:40px;font-weight:700;font-size:17px;transition:transform 0.2s,box-shadow 0.2s}
.btn-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(74,124,89,0.3)}
.btn-cta small{display:block;font-size:12px;font-weight:400;opacity:0.9;margin-top:4px}

/* Benefits */
.benefits{padding:80px 20px;max-width:900px;margin:0 auto}
.section-title{text-align:center;font-size:26px;font-weight:700;margin-bottom:48px;color:#2d5a3d}
.benefit-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.benefit-card{text-align:center;padding:28px 20px}
.benefit-icon{font-size:40px;margin-bottom:16px}
.benefit-card h3{font-size:17px;font-weight:600;margin-bottom:8px}
.benefit-card p{color:#666;font-size:14px;line-height:1.7}

/* Testimonials */
.testimonials{background:#faf7f2;padding:80px 20px}
.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto}
.review-card{background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
.review-stars{color:#e8a44a;font-size:18px;margin-bottom:12px}
.review-card p{font-size:14px;line-height:1.7;color:#444;margin-bottom:16px}
.review-author{font-size:13px;color:#888}

/* Comparison */
.comparison{padding:80px 20px;max-width:700px;margin:0 auto}
.compare-table{width:100%;border-collapse:collapse;margin-top:32px}
.compare-table th{background:#4a7c59;color:#fff;padding:14px 16px;text-align:left;font-size:14px}
.compare-table th:first-child{border-radius:8px 0 0 0}
.compare-table th:last-child{border-radius:0 8px 0 0}
.compare-table td{padding:12px 16px;border-bottom:1px solid #eee;font-size:14px}
.compare-table tr:last-child td:first-child{border-radius:0 0 0 8px}
.compare-table tr:last-child td:last-child{border-radius:0 0 8px 0}
.check{color:#4a7c59;font-weight:700}
.cross{color:#ccc}

/* Offer */
.offer{background:linear-gradient(135deg,#2d5a3d,#4a7c59);color:#fff;padding:60px 20px;text-align:center}
.offer h2{font-size:28px;font-weight:700;margin-bottom:8px}
.offer p{font-size:16px;opacity:0.9;margin-bottom:8px}
.countdown{display:flex;justify-content:center;gap:16px;margin:24px 0}
.countdown-item{background:rgba(255,255,255,0.15);border-radius:8px;padding:16px 20px;min-width:70px}
.countdown-num{font-size:28px;font-weight:700;display:block}
.countdown-label{font-size:11px;opacity:0.8}
.btn-offer{display:inline-block;background:#e8a44a;color:#fff;padding:16px 48px;border-radius:40px;font-weight:700;font-size:17px;transition:transform 0.2s}
.btn-offer:hover{transform:translateY(-2px)}

/* Footer */
footer{background:#1a1a1a;color:#fff;text-align:center;padding:40px 20px}
footer p{font-size:12px;opacity:0.5;line-height:1.8}

@media(max-width:768px){
  .hero h1{font-size:26px}
  .benefit-grid,.review-grid{grid-template-columns:1fr}
  .product-visual{width:200px;height:200px;font-size:60px}
}
</style>
</head>
<body>
  <section class="hero">
    <span class="hero-badge">🎉 初回限定 50% OFF</span>
    <div class="product-visual">🌿</div>
    <h1>朝の一杯で、カラダが変わる</h1>
    <p>厳選された国産有機素材を配合。管理栄養士監修のグリーンスムージーで、毎日の健康習慣を始めませんか？</p>
    <a href="#" class="btn-cta">初回50%OFFで試す<small>送料無料・いつでも解約OK</small></a>
  </section>

  <section class="benefits">
    <h2 class="section-title">選ばれる3つの理由</h2>
    <div class="benefit-grid">
      <div class="benefit-card">
        <div class="benefit-icon">🌾</div>
        <h3>100%国産有機素材</h3>
        <p>契約農家から直接仕入れた有機野菜のみを使用。農薬・添加物は一切不使用です。</p>
      </div>
      <div class="benefit-card">
        <div class="benefit-icon">👩‍⚕️</div>
        <h3>管理栄養士が監修</h3>
        <p>1日に必要なビタミン・ミネラルの50%以上をカバー。栄養バランスを科学的に設計。</p>
      </div>
      <div class="benefit-card">
        <div class="benefit-icon">⏱️</div>
        <h3>たった30秒で完成</h3>
        <p>水や牛乳に溶かすだけ。忙しい朝でも続けられるから、3ヶ月継続率は92%。</p>
      </div>
    </div>
  </section>

  <section class="testimonials">
    <h2 class="section-title">お客様の声</h2>
    <div class="review-grid">
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>「朝の目覚めが変わりました。3週間続けていますが、明らかに体が軽くなった気がします。」</p>
        <span class="review-author">— 田中 美咲さん（32歳・会社員）</span>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>「野菜嫌いの私でも飲める味。フルーティーで、青臭さがまったくありません。」</p>
        <span class="review-author">— 佐藤 健太さん（28歳・エンジニア）</span>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★☆</div>
        <p>「家族全員で飲んでいます。子どもも喜んで飲むので、野菜不足の心配がなくなりました。」</p>
        <span class="review-author">— 山本 恵子さん（41歳・主婦）</span>
      </div>
    </div>
  </section>

  <section class="comparison">
    <h2 class="section-title">他社製品との比較</h2>
    <table class="compare-table">
      <tr><th>特徴</th><th>ナチュラグリーン</th><th>A社</th><th>B社</th></tr>
      <tr><td>有機素材100%</td><td class="check">✓</td><td class="cross">—</td><td class="cross">—</td></tr>
      <tr><td>管理栄養士監修</td><td class="check">✓</td><td class="check">✓</td><td class="cross">—</td></tr>
      <tr><td>添加物フリー</td><td class="check">✓</td><td class="cross">—</td><td class="check">✓</td></tr>
      <tr><td>初回割引</td><td class="check">50% OFF</td><td class="cross">10% OFF</td><td class="cross">なし</td></tr>
      <tr><td>定期縛りなし</td><td class="check">✓</td><td class="cross">—</td><td class="cross">—</td></tr>
    </table>
  </section>

  <section class="offer">
    <h2>期間限定キャンペーン</h2>
    <p>先着500名様限定 — 初回50%OFF + 送料無料</p>
    <div class="countdown">
      <div class="countdown-item"><span class="countdown-num">02</span><span class="countdown-label">日</span></div>
      <div class="countdown-item"><span class="countdown-num">14</span><span class="countdown-label">時間</span></div>
      <div class="countdown-item"><span class="countdown-num">37</span><span class="countdown-label">分</span></div>
    </div>
    <a href="#" class="btn-offer">今すぐ申し込む →</a>
  </section>

  <footer>
    <p>&copy; 2026 NaturaGreen Inc.<br>特定商取引法に基づく表記 | プライバシーポリシー | 利用規約</p>
  </footer>
</body>
</html>`
  },

  // ─── Template 3: レストラン / カフェ ───
  {
    name: 'レストラン',
    target: '飲食 / ローカル',
    description: 'エレガントで写真中心のレストランLP。メニュー、ストーリー、アクセス情報付き。',
    colors: ['#1a1a1a', '#c9a96e'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KUMO — 日本料理</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Serif JP',serif;color:#fff;background:#1a1a1a}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,#2a1a0e 0%,#1a1a1a 50%,#0d1117 100%);z-index:0}
.hero-content{position:relative;z-index:1}
.hero-sub{font-family:'Inter',sans-serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#c9a96e;margin-bottom:24px}
.hero h1{font-size:56px;font-weight:700;letter-spacing:8px;margin-bottom:16px}
.hero-tagline{font-size:16px;color:rgba(255,255,255,0.6);margin-bottom:40px;font-style:italic}
.btn-reserve{display:inline-block;border:1px solid #c9a96e;color:#c9a96e;padding:14px 40px;font-family:'Inter',sans-serif;font-size:13px;letter-spacing:2px;text-transform:uppercase;transition:all 0.3s}
.btn-reserve:hover{background:#c9a96e;color:#1a1a1a}
.scroll-hint{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);font-family:'Inter',sans-serif;font-size:11px;color:rgba(255,255,255,0.3);letter-spacing:2px;animation:fadeInOut 2s infinite}
@keyframes fadeInOut{0%,100%{opacity:0.3}50%{opacity:0.8}}

/* Menu */
.menu{padding:100px 20px;max-width:800px;margin:0 auto}
.section-label{font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#c9a96e;text-align:center;margin-bottom:12px}
.section-heading{text-align:center;font-size:28px;margin-bottom:60px}
.menu-item{display:flex;gap:24px;margin-bottom:48px;align-items:flex-start}
.menu-img{width:160px;height:120px;border-radius:4px;flex-shrink:0}
.menu-info{flex:1}
.menu-info h3{font-size:18px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:baseline}
.menu-price{color:#c9a96e;font-family:'Inter',sans-serif;font-size:16px;font-weight:500}
.menu-info p{color:rgba(255,255,255,0.5);font-size:14px;line-height:1.8}
.menu-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(201,169,110,0.2),transparent);margin-bottom:48px}

/* Story */
.story{padding:100px 20px;background:#141414}
.story-content{max-width:700px;margin:0 auto;text-align:center}
.story-content p{color:rgba(255,255,255,0.6);font-size:15px;line-height:2;margin-bottom:20px}
.story-img{width:100%;height:300px;background:linear-gradient(135deg,#2a2018,#3a2a1a);border-radius:4px;margin:40px 0}

/* Access */
.access{padding:100px 20px;max-width:700px;margin:0 auto;text-align:center}
.access-info{margin-top:40px;color:rgba(255,255,255,0.6);font-family:'Inter','Noto Serif JP',sans-serif;font-size:14px;line-height:2.2}
.access-info strong{color:#fff;font-weight:500}

/* CTA */
.cta-section{padding:80px 20px;text-align:center;background:linear-gradient(135deg,#1a1a1a,#2a1a0e)}
.cta-section h2{font-size:24px;margin-bottom:16px}
.cta-section p{color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:32px}

/* Footer */
footer{border-top:1px solid rgba(255,255,255,0.05);padding:40px 20px;text-align:center}
footer p{font-family:'Inter',sans-serif;font-size:12px;color:rgba(255,255,255,0.25)}

@media(max-width:768px){
  .hero h1{font-size:32px;letter-spacing:4px}
  .menu-item{flex-direction:column}
  .menu-img{width:100%;height:180px}
}
</style>
</head>
<body>
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <p class="hero-sub">Japanese Cuisine</p>
      <h1>KUMO</h1>
      <p class="hero-tagline">雲のように、軽やかに。季節を纏う一皿を。</p>
      <a href="#" class="btn-reserve">ご予約はこちら</a>
    </div>
    <span class="scroll-hint">Scroll ↓</span>
  </section>

  <section class="menu">
    <p class="section-label">Menu</p>
    <h2 class="section-heading">おすすめ料理</h2>

    <div class="menu-item">
      <div class="menu-img" style="background:linear-gradient(135deg,#4a3728,#6b5240)"></div>
      <div class="menu-info">
        <h3>季節の前菜盛り合わせ <span class="menu-price">¥2,800</span></h3>
        <p>旬の食材を5種の小皿に。目でも舌でも楽しむ、季節の移ろいを感じる前菜。</p>
      </div>
    </div>
    <div class="menu-divider"></div>

    <div class="menu-item">
      <div class="menu-img" style="background:linear-gradient(135deg,#3a2820,#5a4030)"></div>
      <div class="menu-info">
        <h3>黒毛和牛の炭火焼き <span class="menu-price">¥5,500</span></h3>
        <p>A5ランクの黒毛和牛を備長炭で。山葵と岩塩でシンプルにお召し上がりください。</p>
      </div>
    </div>
    <div class="menu-divider"></div>

    <div class="menu-item">
      <div class="menu-img" style="background:linear-gradient(135deg,#2a3a28,#3a4a38)"></div>
      <div class="menu-info">
        <h3>鯛の土鍋ごはん <span class="menu-price">¥3,200</span></h3>
        <p>明石産の天然鯛を丸ごと一匹。炊きたての土鍋ごはんと共に、2〜3名でどうぞ。</p>
      </div>
    </div>
    <div class="menu-divider"></div>

    <div class="menu-item">
      <div class="menu-img" style="background:linear-gradient(135deg,#2e2028,#4a3040)"></div>
      <div class="menu-info">
        <h3>抹茶のティラミス <span class="menu-price">¥1,400</span></h3>
        <p>宇治抹茶とマスカルポーネの出会い。ほろ苦さと甘さの絶妙なバランス。</p>
      </div>
    </div>
  </section>

  <section class="story">
    <div class="story-content">
      <p class="section-label">Our Story</p>
      <h2 class="section-heading">雲のはじまり</h2>
      <div class="story-img"></div>
      <p>2018年、京都の路地裏で小さなカウンター8席から始まったKUMO。「料理は空気のように自然であるべきだ」という信念のもと、素材の声に耳を傾け、一皿一皿を丁寧に仕立てています。</p>
      <p>化学調味料を一切使わず、出汁と素材の力だけで表現する味わい。それがKUMOのスタイルです。</p>
    </div>
  </section>

  <section class="access">
    <p class="section-label">Access</p>
    <h2 class="section-heading">アクセス</h2>
    <div class="access-info">
      <p><strong>住所:</strong> 〒604-0924 京都府京都市中京区一之船入町 384-1</p>
      <p><strong>最寄駅:</strong> 地下鉄東西線「京都市役所前」駅 徒歩5分</p>
      <p><strong>営業時間:</strong> ランチ 11:30〜14:00 / ディナー 17:30〜22:00</p>
      <p><strong>定休日:</strong> 毎週月曜日</p>
      <p><strong>電話:</strong> 075-XXX-XXXX</p>
    </div>
  </section>

  <section class="cta-section">
    <h2>ご予約を承ります</h2>
    <p>お電話またはオンラインからご予約いただけます</p>
    <a href="#" class="btn-reserve">予約する</a>
  </section>

  <footer>
    <p>&copy; 2026 KUMO — Japanese Cuisine. All rights reserved.</p>
  </footer>
</body>
</html>`
  },

  // ─── Template 4: モバイルゲーム ───
  {
    name: 'ゲームアプリ',
    target: 'エンタメ / 若年層',
    description: 'ダークでエネルギッシュなゲームアプリLP。グロー効果、ダウンロードボタン付き。',
    colors: ['#1a0a2e', '#00e5ff'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NOVA STRIKE — 銀河を支配せよ</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans JP',sans-serif;color:#fff;background:#0a0515}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 20px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(0,229,255,0.1) 0%,transparent 70%);top:-100px;left:50%;transform:translateX(-50%)}
.hero::after{content:"";position:absolute;width:400px;height:400px;background:radial-gradient(circle,rgba(255,0,128,0.08) 0%,transparent 70%);bottom:-50px;right:-100px}
.hero-label{font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#00e5ff;margin-bottom:20px}
.hero h1{font-size:56px;font-weight:900;margin-bottom:16px;background:linear-gradient(135deg,#00e5ff,#ff0080);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.2}
.hero p{color:rgba(255,255,255,0.6);font-size:16px;max-width:500px;margin:0 auto 32px;line-height:1.7}
.game-visual{width:300px;height:300px;background:linear-gradient(135deg,#1a0a2e,#2a1a4e);border:2px solid rgba(0,229,255,0.3);border-radius:20px;margin:0 auto 40px;display:flex;align-items:center;justify-content:center;font-size:80px;box-shadow:0 0 60px rgba(0,229,255,0.15),inset 0 0 60px rgba(0,229,255,0.05)}
.btn-download{display:inline-block;background:linear-gradient(135deg,#00e5ff,#0099cc);color:#0a0515;padding:16px 48px;border-radius:12px;font-weight:700;font-size:17px;transition:transform 0.2s,box-shadow 0.2s}
.btn-download:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,229,255,0.3)}

/* Features */
.features{padding:100px 20px;max-width:960px;margin:0 auto}
.section-title{text-align:center;font-size:28px;font-weight:700;margin-bottom:48px}
.section-title span{color:#00e5ff}
.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.feature-card{background:rgba(255,255,255,0.03);border:1px solid rgba(0,229,255,0.15);border-radius:16px;padding:32px 24px;text-align:center;position:relative;overflow:hidden;transition:border-color 0.3s,box-shadow 0.3s}
.feature-card:hover{border-color:rgba(0,229,255,0.5);box-shadow:0 0 30px rgba(0,229,255,0.1)}
.feature-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00e5ff,transparent);opacity:0;transition:opacity 0.3s}
.feature-card:hover::before{opacity:1}
.feature-icon{font-size:40px;margin-bottom:16px}
.feature-card h3{font-size:17px;font-weight:600;margin-bottom:8px}
.feature-card p{color:rgba(255,255,255,0.5);font-size:14px;line-height:1.7}

/* Screenshots */
.screenshots{padding:100px 20px;background:rgba(0,229,255,0.02)}
.screenshot-grid{display:flex;gap:20px;max-width:960px;margin:0 auto;overflow-x:auto;padding-bottom:12px}
.screenshot-item{min-width:220px;height:380px;background:linear-gradient(180deg,#1a0a2e,#2a1a4e);border-radius:16px;border:1px solid rgba(0,229,255,0.1);display:flex;align-items:center;justify-content:center;font-size:48px;flex-shrink:0}

/* Reviews */
.reviews{padding:100px 20px;max-width:800px;margin:0 auto}
.review-grid{display:grid;gap:20px}
.review-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;display:flex;gap:16px;align-items:flex-start}
.review-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#00e5ff,#ff0080);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700}
.review-body h4{font-size:14px;font-weight:600;margin-bottom:4px}
.review-stars{color:#ffd700;font-size:14px;margin-bottom:8px}
.review-body p{color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6}

/* Download */
.download-section{padding:100px 20px;text-align:center;background:linear-gradient(180deg,#0a0515,#1a0a2e)}
.download-section h2{font-size:32px;font-weight:900;margin-bottom:12px}
.download-section p{color:rgba(255,255,255,0.5);margin-bottom:36px;font-size:15px}
.store-buttons{display:flex;justify-content:center;gap:16px;flex-wrap:wrap}
.store-btn{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);padding:14px 28px;border-radius:12px;transition:background 0.2s,border-color 0.2s}
.store-btn:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.3)}
.store-icon{font-size:28px}
.store-text{text-align:left}
.store-text small{font-size:10px;color:rgba(255,255,255,0.5);display:block}
.store-text span{font-size:16px;font-weight:600}

/* Footer */
footer{border-top:1px solid rgba(255,255,255,0.05);padding:40px 20px;text-align:center}
footer p{font-size:12px;color:rgba(255,255,255,0.2)}

@media(max-width:768px){
  .hero h1{font-size:32px}
  .feature-grid{grid-template-columns:1fr}
  .game-visual{width:220px;height:220px;font-size:60px}
}
</style>
</head>
<body>
  <section class="hero">
    <p class="hero-label">New Season Now Live</p>
    <div class="game-visual">🚀</div>
    <h1>NOVA STRIKE</h1>
    <p>広大な銀河を舞台に繰り広げられるリアルタイムストラテジー。仲間と共に、宇宙の覇権を手に入れろ。</p>
    <a href="#" class="btn-download">🎮 無料ダウンロード</a>
  </section>

  <section class="features">
    <h2 class="section-title">なぜ<span>NOVA STRIKE</span>なのか</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">⚔️</div>
        <h3>リアルタイムPvP</h3>
        <p>世界中のプレイヤーとリアルタイムで対戦。スキルと戦略が勝敗を分ける。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🌌</div>
        <h3>1000以上の星系</h3>
        <p>探索可能な広大な銀河マップ。各星系に固有の資源と秘密が眠る。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🛸</div>
        <h3>200種以上の艦船</h3>
        <p>カスタマイズ自由な艦船で、自分だけの最強艦隊を編成しよう。</p>
      </div>
    </div>
  </section>

  <section class="screenshots">
    <h2 class="section-title">スクリーンショット</h2>
    <div class="screenshot-grid">
      <div class="screenshot-item">🌠</div>
      <div class="screenshot-item">💥</div>
      <div class="screenshot-item">🪐</div>
      <div class="screenshot-item">⭐</div>
    </div>
  </section>

  <section class="reviews">
    <h2 class="section-title">プレイヤーの声</h2>
    <div class="review-grid">
      <div class="review-card">
        <div class="review-avatar">K</div>
        <div class="review-body">
          <h4>KazuGamer</h4>
          <div class="review-stars">★★★★★</div>
          <p>マジで神ゲー。毎日ログインしてる。ギルド戦が熱すぎる！</p>
        </div>
      </div>
      <div class="review-card">
        <div class="review-avatar">M</div>
        <div class="review-body">
          <h4>MikuPlay</h4>
          <div class="review-stars">★★★★★</div>
          <p>グラフィックが綺麗すぎる。スマホでこのクオリティは凄い。課金要素も良心的。</p>
        </div>
      </div>
      <div class="review-card">
        <div class="review-avatar">T</div>
        <div class="review-body">
          <h4>TaroSTG</h4>
          <div class="review-stars">★★★★☆</div>
          <p>戦略性が高くて飽きない。チュートリアルがもう少し丁寧だと嬉しいかな。</p>
        </div>
      </div>
    </div>
  </section>

  <section class="download-section">
    <h2>今すぐプレイ</h2>
    <p>基本プレイ無料 — 600万ダウンロード突破</p>
    <div class="store-buttons">
      <a href="#" class="store-btn">
        <span class="store-icon">🍎</span>
        <div class="store-text"><small>Download on the</small><span>App Store</span></div>
      </a>
      <a href="#" class="store-btn">
        <span class="store-icon">▶️</span>
        <div class="store-text"><small>Get it on</small><span>Google Play</span></div>
      </a>
    </div>
  </section>

  <footer>
    <p>&copy; 2026 Nova Strike Studio. All rights reserved.</p>
  </footer>
</body>
</html>`
  }
];
