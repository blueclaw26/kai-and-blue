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
  },

  // ─── Template 5: 教育/オンラインコース ───
  {
    name: 'オンラインコース',
    target: '教育 / スキルアップ',
    description: '権威性と構成力を重視した教育系LP。カリキュラム、講師紹介、FAQ、返金保証付き。',
    colors: ['#4f46e5', '#93c5fd'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>プロになるWebデザイン完全マスター講座</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans JP',sans-serif;color:#1a1a2e;background:#fff}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%);color:#fff;padding:100px 20px 80px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(147,197,253,0.15),transparent 70%);top:-150px;right:-100px}
.hero-badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);padding:8px 20px;border-radius:30px;font-size:14px;font-weight:600;margin-bottom:24px;backdrop-filter:blur(4px)}
.hero-badge span{color:#fbbf24}
.hero h1{font-size:40px;font-weight:800;margin-bottom:16px;line-height:1.4}
.hero p{font-size:17px;opacity:0.9;max-width:600px;margin:0 auto 32px;line-height:1.8}
.btn-cta{display:inline-block;background:#fff;color:#4f46e5;padding:16px 48px;border-radius:10px;font-weight:700;font-size:17px;transition:transform 0.2s,box-shadow 0.2s}
.btn-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.2)}
.btn-cta small{display:block;font-size:12px;font-weight:500;color:#6366f1;margin-top:4px}
.hero-stats{display:flex;justify-content:center;gap:40px;margin-top:40px}
.hero-stat{text-align:center}
.hero-stat-num{font-size:28px;font-weight:800;display:block}
.hero-stat-label{font-size:12px;opacity:0.7}

/* Learn */
.learn{padding:80px 20px;max-width:800px;margin:0 auto}
.section-title{text-align:center;font-size:28px;font-weight:700;margin-bottom:12px}
.section-sub{text-align:center;color:#6b7280;font-size:15px;margin-bottom:48px}
.learn-list{list-style:none;display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.learn-item{display:flex;align-items:flex-start;gap:12px;padding:16px;background:#f0f0ff;border-radius:10px}
.learn-check{color:#4f46e5;font-size:20px;font-weight:700;flex-shrink:0;margin-top:2px}
.learn-item p{font-size:15px;line-height:1.6}

/* Instructor */
.instructor{padding:80px 20px;background:#f8fafc}
.instructor-card{max-width:700px;margin:0 auto;display:flex;gap:32px;align-items:center}
.instructor-avatar{width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#4f46e5,#818cf8);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:64px;color:#fff}
.instructor-info h3{font-size:22px;font-weight:700;margin-bottom:4px}
.instructor-info .title{font-size:14px;color:#4f46e5;font-weight:600;margin-bottom:12px}
.instructor-info p{font-size:14px;color:#6b7280;line-height:1.8}

/* Curriculum */
.curriculum{padding:80px 20px;max-width:700px;margin:0 auto}
.module{border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px;overflow:hidden}
.module-header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;background:#fafaff;cursor:pointer;font-weight:600;font-size:15px}
.module-header span{color:#4f46e5;font-size:13px;font-weight:500}
.module-body{padding:0 20px 18px;font-size:14px;color:#6b7280;line-height:1.8}

/* Testimonials */
.testimonials{padding:80px 20px;background:#f8fafc}
.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto}
.review-card{background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.review-stars{color:#fbbf24;font-size:16px;margin-bottom:12px}
.review-card p{font-size:14px;line-height:1.7;color:#444;margin-bottom:16px}
.review-author{font-size:13px;color:#888}

/* Pricing */
.pricing{padding:80px 20px;max-width:800px;margin:0 auto;text-align:center}
.pricing-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:700px;margin:0 auto}
.price-card{background:#fff;border-radius:16px;padding:36px 28px;border:2px solid #e5e7eb;transition:border-color 0.2s}
.price-card.popular{border-color:#4f46e5;position:relative}
.price-card.popular::before{content:"おすすめ";position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#4f46e5;color:#fff;padding:4px 18px;border-radius:20px;font-size:12px;font-weight:600}
.price-card h3{font-size:20px;font-weight:700;margin-bottom:8px}
.price-amount{font-size:40px;font-weight:800;color:#4f46e5;margin:16px 0}
.price-amount span{font-size:15px;font-weight:400;color:#9ca3af}
.price-card ul{list-style:none;text-align:left;margin:20px 0 28px}
.price-card li{padding:8px 0;font-size:14px;color:#555;border-bottom:1px solid #f3f4f6}
.price-card li::before{content:"✓ ";color:#4f46e5;font-weight:700}
.price-btn{display:block;width:100%;padding:14px;border-radius:10px;font-weight:600;font-size:15px;text-align:center;border:none;cursor:pointer;transition:background 0.2s}
.price-btn-fill{background:#4f46e5;color:#fff}
.price-btn-fill:hover{background:#4338ca}
.price-btn-outline{background:transparent;border:2px solid #4f46e5;color:#4f46e5}
.price-btn-outline:hover{background:#f0f0ff}

/* FAQ */
.faq{padding:80px 20px;max-width:700px;margin:0 auto}
.faq-item{border-bottom:1px solid #e5e7eb;padding:20px 0}
.faq-item h3{font-size:16px;font-weight:600}
.faq-item p{color:#6b7280;font-size:14px;line-height:1.7;margin-top:10px}

/* Guarantee */
.guarantee{padding:60px 20px;text-align:center;max-width:600px;margin:0 auto}
.guarantee-icon{font-size:48px;margin-bottom:16px}
.guarantee h2{font-size:22px;font-weight:700;margin-bottom:12px}
.guarantee p{color:#6b7280;font-size:14px;line-height:1.8}

/* Final CTA */
.final-cta{background:linear-gradient(135deg,#4f46e5,#3730a3);color:#fff;padding:80px 20px;text-align:center}
.final-cta h2{font-size:30px;font-weight:800;margin-bottom:12px}
.final-cta p{opacity:0.8;font-size:16px;margin-bottom:32px}

/* Footer */
footer{background:#1a1a2e;color:#fff;text-align:center;padding:40px 20px}
footer p{font-size:12px;opacity:0.5}

@media(max-width:768px){
  .hero h1{font-size:28px}
  .hero-stats{flex-direction:column;gap:16px}
  .learn-list,.review-grid,.pricing-grid{grid-template-columns:1fr}
  .instructor-card{flex-direction:column;text-align:center}
}
</style>
</head>
<body>
  <section class="hero">
    <div class="hero-badge">🎓 受講者 <span>10,000人</span> 突破</div>
    <h1>プロになる<br>Webデザイン完全マスター講座</h1>
    <p>現役デザイナーが教える、実務で使えるスキルを6ヶ月で習得。未経験からフリーランスデザイナーへ。</p>
    <a href="#" class="btn-cta">無料体験を始める<small>クレジットカード不要</small></a>
    <div class="hero-stats">
      <div class="hero-stat"><span class="hero-stat-num">10,000+</span><span class="hero-stat-label">受講者数</span></div>
      <div class="hero-stat"><span class="hero-stat-num">4.8 / 5.0</span><span class="hero-stat-label">平均評価</span></div>
      <div class="hero-stat"><span class="hero-stat-num">92%</span><span class="hero-stat-label">完走率</span></div>
    </div>
  </section>

  <section class="learn">
    <h2 class="section-title">この講座で学べること</h2>
    <p class="section-sub">実務に直結する8つのスキルを体系的に習得</p>
    <ul class="learn-list">
      <li class="learn-item"><span class="learn-check">✓</span><p>Figmaを使ったUI/UXデザインの基礎と実践</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>HTML/CSSコーディングの完全理解</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>レスポンシブデザインの設計手法</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>デザインシステムの構築と運用</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>クライアントワークの進め方</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>ポートフォリオサイトの制作</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>アクセシビリティとSEOの基礎</p></li>
      <li class="learn-item"><span class="learn-check">✓</span><p>フリーランスとしての営業・契約ノウハウ</p></li>
    </ul>
  </section>

  <section class="instructor">
    <h2 class="section-title">講師紹介</h2>
    <p class="section-sub">現場を知るプロが直接指導</p>
    <div class="instructor-card">
      <div class="instructor-avatar">👨‍🏫</div>
      <div class="instructor-info">
        <h3>高橋 亮太</h3>
        <p class="title">シニアUIデザイナー / デザイン講師</p>
        <p>大手IT企業でデザインリードを10年間務めた後、独立。累計30社以上のプロダクトデザインに携わる。「誰でも分かる」をモットーにした丁寧な解説に定評がある。著書『UIデザインの教科書』はベストセラー。</p>
      </div>
    </div>
  </section>

  <section class="curriculum">
    <h2 class="section-title">カリキュラム</h2>
    <p class="section-sub">6ヶ月・全48レッスンの充実した内容</p>
    <div class="module">
      <div class="module-header">Module 1: デザインの基礎理論 <span>8レッスン</span></div>
      <div class="module-body">色彩理論、タイポグラフィ、レイアウトの原則、視覚的階層構造などデザインの土台を学びます。</div>
    </div>
    <div class="module">
      <div class="module-header">Module 2: Figma完全マスター <span>10レッスン</span></div>
      <div class="module-body">Figmaの基本操作からコンポーネント設計、プロトタイピングまで。実務レベルのスキルを身につけます。</div>
    </div>
    <div class="module">
      <div class="module-header">Module 3: HTML/CSS実践 <span>10レッスン</span></div>
      <div class="module-body">セマンティックHTML、CSS Grid/Flexbox、アニメーション。デザインを忠実にコードで再現する力を鍛えます。</div>
    </div>
    <div class="module">
      <div class="module-header">Module 4: レスポンシブ & アクセシビリティ <span>8レッスン</span></div>
      <div class="module-body">モバイルファーストの設計、ブレイクポイント戦略、WCAG準拠のアクセシブルなデザインを実践します。</div>
    </div>
    <div class="module">
      <div class="module-header">Module 5: 実践プロジェクト <span>8レッスン</span></div>
      <div class="module-body">実際のクライアントワークを想定した3つの制作課題。ヒアリングから納品まで一気通貫で経験します。</div>
    </div>
    <div class="module">
      <div class="module-header">Module 6: キャリア構築 <span>4レッスン</span></div>
      <div class="module-body">ポートフォリオ制作、フリーランスの始め方、料金設定、契約書のテンプレートを提供します。</div>
    </div>
  </section>

  <section class="testimonials">
    <h2 class="section-title">受講者の声</h2>
    <p class="section-sub">卒業生からのリアルなフィードバック</p>
    <div class="review-grid">
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>「未経験から3ヶ月でフリーランスデビューできました。カリキュラムが実践的で、すぐに仕事に活かせる内容でした。」</p>
        <span class="review-author">— 鈴木 愛さん（26歳・元事務職）</span>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>「Figmaの使い方を我流で覚えていましたが、この講座で基礎から学び直して効率が3倍になりました。」</p>
        <span class="review-author">— 中村 翔太さん（31歳・Webエンジニア）</span>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★☆</div>
        <p>「講師への質問がいつでもできるのが心強い。挫折しかけた時もサポートのおかげで完走できました。」</p>
        <span class="review-author">— 木村 麻衣さん（29歳・副業デザイナー）</span>
      </div>
    </div>
  </section>

  <section class="pricing">
    <h2 class="section-title">料金プラン</h2>
    <p class="section-sub">あなたに合ったプランを選択</p>
    <div class="pricing-grid">
      <div class="price-card">
        <h3>セルフペース</h3>
        <div class="price-amount">¥49,800<span> 一括</span></div>
        <ul>
          <li>全48レッスン視聴</li>
          <li>課題フィードバック</li>
          <li>コミュニティアクセス</li>
          <li>修了証明書</li>
        </ul>
        <a href="#" class="price-btn price-btn-outline">このプランを選ぶ</a>
      </div>
      <div class="price-card popular">
        <h3>メンター付き</h3>
        <div class="price-amount">¥89,800<span> 一括</span></div>
        <ul>
          <li>全48レッスン視聴</li>
          <li>課題フィードバック</li>
          <li>コミュニティアクセス</li>
          <li>修了証明書</li>
          <li>週1回メンタリング</li>
          <li>ポートフォリオレビュー</li>
          <li>転職・独立サポート</li>
        </ul>
        <a href="#" class="price-btn price-btn-fill">このプランを選ぶ</a>
      </div>
    </div>
  </section>

  <section class="faq">
    <h2 class="section-title">よくある質問</h2>
    <div class="faq-item">
      <h3>全くの未経験ですが大丈夫ですか？</h3>
      <p>はい、完全未経験者を想定したカリキュラムです。基礎の基礎から丁寧に解説しますのでご安心ください。</p>
    </div>
    <div class="faq-item">
      <h3>1日どのくらいの学習時間が必要ですか？</h3>
      <p>目安は1日1〜2時間です。すき間時間にスマホでも視聴でき、自分のペースで進められます。</p>
    </div>
    <div class="faq-item">
      <h3>受講期限はありますか？</h3>
      <p>購入後は無期限で視聴可能です。何度でも繰り返し学習していただけます。</p>
    </div>
    <div class="faq-item">
      <h3>領収書は発行できますか？</h3>
      <p>はい、マイページからPDF形式の領収書をダウンロードいただけます。法人名での発行も可能です。</p>
    </div>
  </section>

  <section class="guarantee">
    <div class="guarantee-icon">🛡️</div>
    <h2>30日間 全額返金保証</h2>
    <p>受講開始から30日以内であれば、理由を問わず全額返金いたします。まずはリスクゼロでお試しください。内容にご満足いただけなければ、メール1通で返金手続きが完了します。</p>
  </section>

  <section class="final-cta">
    <h2>今日から、デザイナーへの第一歩を</h2>
    <p>10,000人以上が選んだ講座を、まずは無料で体験</p>
    <a href="#" class="btn-cta">無料体験を始める<small>クレジットカード不要</small></a>
  </section>

  <footer>
    <p>&copy; 2026 Design Master Academy. All rights reserved.</p>
  </footer>
</body>
</html>`
  },

  // ─── Template 6: 旅行/ホテル ───
  {
    name: 'ホテル・旅館',
    target: '観光 / ホスピタリティ',
    description: '高級感あるホテル・旅館LP。客室紹介、アメニティ、アクセス、特別プラン付き。',
    colors: ['#0f172a', '#d4a853'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>旅亭 雲月 — 箱根の隠れ宿</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Serif JP',serif;color:#fff;background:#0f172a}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:linear-gradient(180deg,#0f172a 0%,#1a2744 40%,#0f172a 100%);z-index:0}
.hero-bg::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(212,168,83,0.08),transparent 70%)}
.hero-content{position:relative;z-index:1}
.hero-jp{font-size:14px;letter-spacing:8px;color:#d4a853;margin-bottom:20px}
.hero h1{font-size:52px;font-weight:700;letter-spacing:6px;margin-bottom:12px}
.hero-en{font-family:'Inter',sans-serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:32px}
.hero-tagline{font-size:16px;color:rgba(255,255,255,0.6);margin-bottom:48px;font-weight:300;line-height:1.8}
.btn-reserve{display:inline-block;background:#d4a853;color:#0f172a;padding:16px 48px;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;letter-spacing:2px;border-radius:2px;transition:all 0.3s}
.btn-reserve:hover{background:#e0bb6e;box-shadow:0 8px 32px rgba(212,168,83,0.3)}

/* Rooms */
.rooms{padding:100px 20px}
.section-label{font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#d4a853;text-align:center;margin-bottom:12px}
.section-heading{text-align:center;font-size:28px;font-weight:600;margin-bottom:60px;letter-spacing:2px}
.room-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:1000px;margin:0 auto}
.room-card{border-radius:4px;overflow:hidden;background:rgba(255,255,255,0.03);border:1px solid rgba(212,168,83,0.15);transition:border-color 0.3s}
.room-card:hover{border-color:rgba(212,168,83,0.4)}
.room-img{height:220px;background:linear-gradient(135deg,#1a2744,#243356);display:flex;align-items:center;justify-content:center;font-size:48px}
.room-info{padding:24px}
.room-info h3{font-size:18px;font-weight:600;margin-bottom:8px;letter-spacing:1px}
.room-info p{color:rgba(255,255,255,0.5);font-size:13px;line-height:1.8;margin-bottom:16px}
.room-price{color:#d4a853;font-family:'Inter',sans-serif;font-size:15px;font-weight:600}
.room-price span{font-size:12px;color:rgba(255,255,255,0.4);font-weight:400}

/* Amenities */
.amenities{padding:80px 20px;background:rgba(212,168,83,0.03)}
.amenity-grid{display:flex;justify-content:center;gap:48px;flex-wrap:wrap;max-width:800px;margin:0 auto}
.amenity-item{text-align:center}
.amenity-icon{font-size:40px;margin-bottom:12px;display:block}
.amenity-item span{font-size:13px;color:rgba(255,255,255,0.6);display:block}

/* Access */
.access{padding:80px 20px;max-width:700px;margin:0 auto;text-align:center}
.access-map{width:100%;height:240px;background:linear-gradient(135deg,#1a2744,#0f172a);border:1px solid rgba(212,168,83,0.1);border-radius:4px;margin:32px 0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-family:'Inter',sans-serif;font-size:14px}
.access-info{color:rgba(255,255,255,0.6);font-size:14px;line-height:2.2}
.access-info strong{color:#fff;font-weight:500}

/* Reviews */
.reviews{padding:80px 20px;background:rgba(255,255,255,0.02)}
.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto}
.review-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:28px}
.review-stars{color:#d4a853;font-size:16px;margin-bottom:12px}
.review-card p{color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;margin-bottom:12px}
.review-author{font-size:13px;color:rgba(255,255,255,0.3)}

/* Special */
.special{padding:80px 20px;text-align:center}
.special-card{max-width:600px;margin:0 auto;background:linear-gradient(135deg,rgba(212,168,83,0.08),rgba(212,168,83,0.02));border:1px solid rgba(212,168,83,0.2);border-radius:4px;padding:48px 36px}
.special-card h3{font-size:22px;font-weight:600;color:#d4a853;margin-bottom:12px;letter-spacing:1px}
.special-card p{color:rgba(255,255,255,0.6);font-size:14px;line-height:1.8;margin-bottom:24px}
.special-price{font-family:'Inter',sans-serif;font-size:32px;font-weight:700;color:#d4a853;margin-bottom:24px}
.special-price span{font-size:14px;color:rgba(255,255,255,0.4);font-weight:400}

/* CTA */
.cta-section{padding:80px 20px;text-align:center;background:linear-gradient(180deg,#0f172a,#1a2744)}
.cta-section h2{font-size:26px;font-weight:600;margin-bottom:12px;letter-spacing:2px}
.cta-section p{color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:36px}

/* Footer */
footer{border-top:1px solid rgba(255,255,255,0.05);padding:40px 20px;text-align:center}
footer p{font-family:'Inter',sans-serif;font-size:12px;color:rgba(255,255,255,0.2)}

@media(max-width:768px){
  .hero h1{font-size:32px;letter-spacing:3px}
  .room-grid,.review-grid{grid-template-columns:1fr}
  .amenity-grid{gap:24px}
}
</style>
</head>
<body>
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <p class="hero-jp">箱根の隠れ宿</p>
      <h1>旅亭 雲月</h1>
      <p class="hero-en">Ryotei Ungetsu — Hakone</p>
      <p class="hero-tagline">四季折々の自然に抱かれ、<br>心と体を解き放つひとときを。</p>
      <a href="#" class="btn-reserve">予約する</a>
    </div>
  </section>

  <section class="rooms">
    <p class="section-label">Rooms</p>
    <h2 class="section-heading">客室のご案内</h2>
    <div class="room-grid">
      <div class="room-card">
        <div class="room-img">🏔️</div>
        <div class="room-info">
          <h3>露天風呂付き和室</h3>
          <p>12畳の広々とした和室に専用露天風呂を備えた贅沢な空間。山の稜線を望む絶景をお楽しみください。</p>
          <div class="room-price">¥45,000〜 <span>/ 1泊2食付</span></div>
        </div>
      </div>
      <div class="room-card">
        <div class="room-img">🌊</div>
        <div class="room-info">
          <h3>和洋スイート</h3>
          <p>和の趣とモダンな快適さを融合。リビング、ベッドルーム、檜の内風呂を完備した特別室。</p>
          <div class="room-price">¥65,000〜 <span>/ 1泊2食付</span></div>
        </div>
      </div>
      <div class="room-card">
        <div class="room-img">🍃</div>
        <div class="room-info">
          <h3>スタンダード和室</h3>
          <p>温かみのある8畳の和室。庭園を望む落ち着いた空間で、日常を忘れるひとときを。</p>
          <div class="room-price">¥28,000〜 <span>/ 1泊2食付</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="amenities">
    <p class="section-label">Amenities</p>
    <h2 class="section-heading">施設・サービス</h2>
    <div class="amenity-grid">
      <div class="amenity-item"><span class="amenity-icon">♨️</span><span>天然温泉<br>大浴場</span></div>
      <div class="amenity-item"><span class="amenity-icon">🏊</span><span>温水プール</span></div>
      <div class="amenity-item"><span class="amenity-icon">🍽️</span><span>会席料理<br>レストラン</span></div>
      <div class="amenity-item"><span class="amenity-icon">💆</span><span>スパ<br>エステ</span></div>
      <div class="amenity-item"><span class="amenity-icon">🅿️</span><span>無料駐車場<br>30台</span></div>
      <div class="amenity-item"><span class="amenity-icon">📶</span><span>全館Wi-Fi<br>完備</span></div>
    </div>
  </section>

  <section class="access">
    <p class="section-label">Access</p>
    <h2 class="section-heading">アクセス</h2>
    <div class="access-map">[ Map Placeholder ]</div>
    <div class="access-info">
      <p><strong>住所:</strong> 〒250-0407 神奈川県足柄下郡箱根町二ノ平 XXX-X</p>
      <p><strong>電車:</strong> 箱根登山鉄道「小涌谷」駅より送迎バス5分</p>
      <p><strong>お車:</strong> 東名高速「御殿場IC」より約30分（無料駐車場完備）</p>
      <p><strong>送迎:</strong> 小涌谷駅より無料送迎あり（要予約）</p>
    </div>
  </section>

  <section class="reviews">
    <p class="section-label">Reviews</p>
    <h2 class="section-heading">お客様の声</h2>
    <div class="review-grid">
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>「露天風呂からの景色が最高でした。料理も一品一品が丁寧で、何度でも訪れたい宿です。」</p>
        <span class="review-author">— M.S 様（東京都・50代）</span>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★★</div>
        <p>「記念日に利用しました。スタッフの心遣いが素晴らしく、最高の思い出になりました。」</p>
        <span class="review-author">— K.T 様（大阪府・30代）</span>
      </div>
      <div class="review-card">
        <div class="review-stars">★★★★☆</div>
        <p>「静かで落ち着いた雰囲気が良い。大浴場の泉質が肌に合い、とても気持ちよかったです。」</p>
        <span class="review-author">— Y.N 様（神奈川県・40代）</span>
      </div>
    </div>
  </section>

  <section class="special">
    <p class="section-label">Special Plan</p>
    <h2 class="section-heading">期間限定 特別プラン</h2>
    <div class="special-card">
      <h3>春の早割プラン</h3>
      <p>30日前までのご予約で、露天風呂付き和室が特別価格に。<br>さらに、地酒の飲み比べセットをプレゼント。</p>
      <div class="special-price">¥38,000〜 <span>/ 1泊2食付（通常¥45,000）</span></div>
      <a href="#" class="btn-reserve">このプランで予約</a>
    </div>
  </section>

  <section class="cta-section">
    <h2>特別なひとときを、雲月で</h2>
    <p>お電話またはオンラインからご予約いただけます</p>
    <a href="#" class="btn-reserve">予約する</a>
  </section>

  <footer>
    <p>&copy; 2026 旅亭 雲月 Ryotei Ungetsu. All rights reserved.</p>
  </footer>
</body>
</html>`
  },

  // ─── Template 7: テック/スタートアップ ───
  {
    name: 'スタートアップ',
    target: 'テック / 投資家向け',
    description: 'ダークでグラデーションが映えるスタートアップLP。メトリクス、チーム紹介、ウェイトリスト付き。',
    colors: ['#7c3aed', '#2563eb'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Synapse AI — 次世代のインテリジェンス</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Noto Sans JP',sans-serif;color:#fff;background:#0a0a0a}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px 20px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;width:800px;height:800px;background:radial-gradient(circle,rgba(124,58,237,0.12),transparent 70%);top:-200px;left:-200px}
.hero::after{content:"";position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(37,99,235,0.1),transparent 70%);bottom:-100px;right:-150px}
.hero-label{display:inline-block;background:linear-gradient(135deg,rgba(124,58,237,0.2),rgba(37,99,235,0.2));border:1px solid rgba(124,58,237,0.3);padding:8px 20px;border-radius:30px;font-size:13px;font-weight:500;margin-bottom:28px;backdrop-filter:blur(4px)}
.hero h1{font-size:56px;font-weight:900;margin-bottom:16px;line-height:1.2;background:linear-gradient(135deg,#c084fc,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{color:rgba(255,255,255,0.6);font-size:18px;max-width:560px;margin:0 auto 40px;line-height:1.7}
.btn-gradient{display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:16px 48px;border-radius:12px;font-weight:700;font-size:17px;transition:transform 0.2s,box-shadow 0.2s;position:relative}
.btn-gradient:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(124,58,237,0.4)}
.btn-secondary{display:inline-block;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);padding:14px 36px;border-radius:12px;font-weight:500;font-size:15px;margin-left:12px;transition:border-color 0.2s}
.btn-secondary:hover{border-color:rgba(255,255,255,0.5);color:#fff}

/* Problem/Solution */
.problem-solution{padding:100px 20px;max-width:900px;margin:0 auto}
.ps-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.ps-card{padding:40px;border-radius:16px}
.ps-card.problem{background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15)}
.ps-card.solution{background:rgba(124,58,237,0.05);border:1px solid rgba(124,58,237,0.15)}
.ps-card h3{font-size:20px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:10px}
.ps-card.problem h3{color:#f87171}
.ps-card.solution h3{color:#a78bfa}
.ps-card p{color:rgba(255,255,255,0.55);font-size:15px;line-height:1.8}

/* How it works */
.how-it-works{padding:100px 20px;background:rgba(255,255,255,0.02)}
.section-title{text-align:center;font-size:32px;font-weight:800;margin-bottom:12px}
.section-sub{text-align:center;color:rgba(255,255,255,0.5);font-size:15px;margin-bottom:60px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:900px;margin:0 auto}
.step{text-align:center;padding:32px 24px}
.step-num{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);font-size:22px;font-weight:800;margin-bottom:20px}
.step h3{font-size:17px;font-weight:600;margin-bottom:8px}
.step p{color:rgba(255,255,255,0.5);font-size:14px;line-height:1.7}

/* Metrics */
.metrics{padding:100px 20px}
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;max-width:900px;margin:0 auto}
.metric{text-align:center;padding:32px 16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px}
.metric-num{font-size:40px;font-weight:900;background:linear-gradient(135deg,#c084fc,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;display:block;margin-bottom:8px}
.metric span{color:rgba(255,255,255,0.5);font-size:13px}

/* Team */
.team{padding:100px 20px;background:rgba(255,255,255,0.02)}
.team-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;max-width:800px;margin:0 auto}
.team-member{text-align:center}
.team-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:32px}
.team-member h4{font-size:15px;font-weight:600;margin-bottom:4px}
.team-member p{color:rgba(255,255,255,0.4);font-size:12px}

/* Backers */
.backers{padding:80px 20px;text-align:center}
.backer-logos{display:flex;justify-content:center;gap:40px;flex-wrap:wrap;margin-top:32px}
.backer{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px 28px;font-size:16px;font-weight:600;color:rgba(255,255,255,0.4)}

/* Waitlist CTA */
.waitlist{padding:100px 20px;text-align:center;position:relative;overflow:hidden}
.waitlist::before{content:"";position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(124,58,237,0.1),transparent 70%);top:-200px;left:50%;transform:translateX(-50%)}
.waitlist h2{font-size:36px;font-weight:900;margin-bottom:12px;background:linear-gradient(135deg,#c084fc,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.waitlist p{color:rgba(255,255,255,0.5);font-size:16px;margin-bottom:36px}

/* Footer */
footer{border-top:1px solid rgba(255,255,255,0.06);padding:40px 20px;text-align:center}
footer p{font-size:12px;color:rgba(255,255,255,0.2)}

@media(max-width:768px){
  .hero h1{font-size:32px}
  .ps-grid,.steps,.metric-grid,.team-grid{grid-template-columns:1fr}
  .btn-secondary{margin-left:0;margin-top:12px;display:inline-block}
}
</style>
</head>
<body>
  <section class="hero">
    <span class="hero-label">🚀 Series A — $12M Raised</span>
    <h1>Synapse AI</h1>
    <p>あらゆるデータから、次の一手を。企業の意思決定を自動化する次世代AIプラットフォーム。</p>
    <div>
      <a href="#" class="btn-gradient">ウェイトリストに参加</a>
      <a href="#" class="btn-secondary">デモを見る →</a>
    </div>
  </section>

  <section class="problem-solution">
    <div class="ps-grid">
      <div class="ps-card problem">
        <h3>❌ 課題</h3>
        <p>企業の意思決定の80%は、不十分なデータ分析に基づいている。Excelとスプレッドシートに埋もれた情報は、タイムリーなインサイトに変換されず、機会損失を生み続けている。</p>
      </div>
      <div class="ps-card solution">
        <h3>✨ 解決策</h3>
        <p>Synapse AIは、社内外のあらゆるデータソースを統合し、リアルタイムでインサイトを生成。自然言語で質問するだけで、エグゼクティブレベルの分析レポートが即座に手に入る。</p>
      </div>
    </div>
  </section>

  <section class="how-it-works">
    <h2 class="section-title">How It Works</h2>
    <p class="section-sub">3ステップで、データドリブンな組織へ</p>
    <div class="steps">
      <div class="step">
        <div class="step-num">1</div>
        <h3>データ接続</h3>
        <p>CRM、ERP、BIツール、Google Analytics等を数クリックで接続。100以上のコネクタを標準搭載。</p>
      </div>
      <div class="step">
        <div class="step-num">2</div>
        <h3>AI分析</h3>
        <p>独自の大規模言語モデルがデータを構造化し、トレンド・異常値・機会を自動で検出。</p>
      </div>
      <div class="step">
        <div class="step-num">3</div>
        <h3>アクション</h3>
        <p>Slack/Teamsへの自動アラート、レポート生成、ワークフロー連携。分析から実行まで一気通貫。</p>
      </div>
    </div>
  </section>

  <section class="metrics">
    <h2 class="section-title">Key Metrics</h2>
    <p class="section-sub">成長を続けるSynapse AI</p>
    <div class="metric-grid">
      <div class="metric"><span class="metric-num">$10M</span><span>ARR</span></div>
      <div class="metric"><span class="metric-num">50K+</span><span>アクティブユーザー</span></div>
      <div class="metric"><span class="metric-num">300+</span><span>企業導入</span></div>
      <div class="metric"><span class="metric-num">99.9%</span><span>稼働率</span></div>
    </div>
  </section>

  <section class="team">
    <h2 class="section-title">Team</h2>
    <p class="section-sub">経験豊富なチームが支える</p>
    <div class="team-grid">
      <div class="team-member">
        <div class="team-avatar">👤</div>
        <h4>佐藤 翔</h4>
        <p>CEO / Co-founder<br>Ex-Google, 東大CS</p>
      </div>
      <div class="team-member">
        <div class="team-avatar">👤</div>
        <h4>Emily Chen</h4>
        <p>CTO / Co-founder<br>Ex-Meta AI, Stanford PhD</p>
      </div>
      <div class="team-member">
        <div class="team-avatar">👤</div>
        <h4>田中 理恵</h4>
        <p>CPO<br>Ex-Mercari, Design Lead</p>
      </div>
      <div class="team-member">
        <div class="team-avatar">👤</div>
        <h4>Alex Kim</h4>
        <p>VP of Sales<br>Ex-Salesforce, 15年SaaS</p>
      </div>
    </div>
  </section>

  <section class="backers">
    <h2 class="section-title">Backed By</h2>
    <p class="section-sub">トップティアVCが支援</p>
    <div class="backer-logos">
      <span class="backer">Sequoia Capital</span>
      <span class="backer">a16z</span>
      <span class="backer">Coral Capital</span>
      <span class="backer">Y Combinator</span>
    </div>
  </section>

  <section class="waitlist">
    <h2>Join the Waitlist</h2>
    <p>次世代のAI意思決定プラットフォームを、いち早く体験</p>
    <a href="#" class="btn-gradient">ウェイトリストに参加する</a>
  </section>

  <footer>
    <p>&copy; 2026 Synapse AI, Inc. All rights reserved.</p>
  </footer>
</body>
</html>`
  },

  // ─── Template 8: NPO/社会課題 ───
  {
    name: 'NPO・社会課題',
    target: '非営利 / 支援者向け',
    description: '温かみのあるNPO向けLP。インパクト数値、ストーリー、寄付の使途、ボランティア募集付き。',
    colors: ['#5c4033', '#4a7c59'],
    html: `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>みどりの架け橋 — すべての子どもに学びの機会を</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans JP',sans-serif;color:#3d2b1f;background:#faf5ef}
a{text-decoration:none;color:inherit}

/* Hero */
.hero{background:linear-gradient(135deg,#5c4033 0%,#3d2b1f 100%);color:#faf5ef;padding:100px 20px 80px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;width:500px;height:500px;background:radial-gradient(circle,rgba(74,124,89,0.12),transparent 70%);top:-100px;right:-100px}
.hero h1{font-size:36px;font-weight:800;margin-bottom:16px;line-height:1.5}
.hero p{font-size:17px;opacity:0.85;max-width:600px;margin:0 auto 32px;line-height:1.9}
.btn-support{display:inline-block;background:#4a7c59;color:#fff;padding:16px 48px;border-radius:40px;font-weight:700;font-size:17px;transition:transform 0.2s,box-shadow 0.2s}
.btn-support:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(74,124,89,0.4)}
.btn-outline{display:inline-block;border:2px solid rgba(250,245,239,0.4);color:#faf5ef;padding:14px 36px;border-radius:40px;font-weight:500;font-size:15px;margin-left:12px;transition:border-color 0.2s}
.btn-outline:hover{border-color:#faf5ef}

/* Impact */
.impact{padding:80px 20px;text-align:center}
.section-title{font-size:28px;font-weight:700;margin-bottom:12px;color:#3d2b1f}
.section-sub{color:#8b7355;font-size:15px;margin-bottom:48px}
.impact-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:800px;margin:0 auto}
.impact-card{background:#fff;border-radius:16px;padding:36px 24px;box-shadow:0 2px 12px rgba(92,64,51,0.06)}
.impact-num{font-size:44px;font-weight:800;color:#4a7c59;display:block;margin-bottom:8px;font-family:'Inter',sans-serif}
.impact-card p{color:#8b7355;font-size:14px}

/* Story */
.story{padding:80px 20px;background:#f0ebe3}
.story-content{max-width:700px;margin:0 auto}
.story-content p{font-size:15px;line-height:2;color:#5c4a3a;margin-bottom:20px}
.story-img{width:100%;height:280px;background:linear-gradient(135deg,#d4c4a8,#b8a88c);border-radius:12px;margin:32px 0;display:flex;align-items:center;justify-content:center;font-size:48px;color:#8b7355}

/* Donation breakdown */
.breakdown{padding:80px 20px;max-width:600px;margin:0 auto;text-align:center}
.breakdown-list{margin-top:36px;text-align:left}
.breakdown-item{display:flex;align-items:center;gap:16px;margin-bottom:20px}
.breakdown-bar-wrap{flex:1;height:32px;background:#e8dfd3;border-radius:8px;overflow:hidden;position:relative}
.breakdown-bar{height:100%;border-radius:8px;display:flex;align-items:center;padding-left:12px;font-size:13px;font-weight:600;color:#fff}
.breakdown-label{width:120px;flex-shrink:0;font-size:14px;font-weight:600;color:#5c4033}
.breakdown-pct{width:48px;flex-shrink:0;text-align:right;font-family:'Inter',sans-serif;font-size:15px;font-weight:700;color:#4a7c59}

/* Options */
.options{padding:80px 20px;background:#f0ebe3}
.option-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:700px;margin:0 auto}
.option-card{background:#fff;border-radius:16px;padding:36px 28px;text-align:center;border:2px solid transparent;transition:border-color 0.2s}
.option-card:hover{border-color:#4a7c59}
.option-icon{font-size:40px;margin-bottom:16px}
.option-card h3{font-size:20px;font-weight:700;margin-bottom:8px}
.option-card p{color:#8b7355;font-size:14px;line-height:1.7;margin-bottom:20px}
.option-btn{display:inline-block;padding:12px 32px;border-radius:30px;font-weight:600;font-size:14px;transition:background 0.2s}
.option-btn.donate{background:#4a7c59;color:#fff}
.option-btn.donate:hover{background:#3d6a4a}
.option-btn.volunteer{background:transparent;border:2px solid #4a7c59;color:#4a7c59}
.option-btn.volunteer:hover{background:#f0f7f2}

/* Partners */
.partners{padding:60px 20px;text-align:center}
.partner-logos{display:flex;justify-content:center;gap:32px;flex-wrap:wrap;margin-top:24px}
.partner{background:#fff;border:1px solid #e8dfd3;border-radius:8px;padding:14px 24px;font-size:14px;font-weight:600;color:#8b7355}

/* Newsletter */
.newsletter{padding:60px 20px;background:#5c4033;color:#faf5ef;text-align:center}
.newsletter h2{font-size:24px;font-weight:700;margin-bottom:8px}
.newsletter p{opacity:0.8;font-size:14px;margin-bottom:24px}
.newsletter-form{display:flex;gap:12px;justify-content:center;max-width:440px;margin:0 auto}
.newsletter-input{flex:1;padding:14px 20px;border:none;border-radius:30px;font-size:14px;background:rgba(255,255,255,0.15);color:#fff;outline:none}
.newsletter-input::placeholder{color:rgba(255,255,255,0.5)}
.newsletter-btn{background:#4a7c59;color:#fff;padding:14px 28px;border:none;border-radius:30px;font-weight:600;font-size:14px;cursor:pointer;transition:background 0.2s}
.newsletter-btn:hover{background:#3d6a4a}

/* Footer */
footer{background:#3d2b1f;color:#faf5ef;text-align:center;padding:40px 20px}
footer p{font-size:12px;opacity:0.5}

@media(max-width:768px){
  .hero h1{font-size:26px}
  .impact-grid,.option-grid{grid-template-columns:1fr}
  .btn-outline{margin-left:0;margin-top:12px;display:inline-block}
  .newsletter-form{flex-direction:column}
}
</style>
</head>
<body>
  <section class="hero">
    <h1>すべての子どもに、<br>学びの機会を届けたい</h1>
    <p>「みどりの架け橋」は、経済的理由で教育機会を失う子どもたちに、無料の学習支援と奨学金を届けるNPOです。あなたの支援が、一人の子どもの未来を変えます。</p>
    <a href="#" class="btn-support">支援する</a>
    <a href="#" class="btn-outline">活動を知る →</a>
  </section>

  <section class="impact">
    <h2 class="section-title">これまでの成果</h2>
    <p class="section-sub">皆さまのご支援のおかげで実現しました</p>
    <div class="impact-grid">
      <div class="impact-card">
        <span class="impact-num">3,200+</span>
        <p>支援した子どもたち</p>
      </div>
      <div class="impact-card">
        <span class="impact-num">48</span>
        <p>全国の学習拠点</p>
      </div>
      <div class="impact-card">
        <span class="impact-num">94%</span>
        <p>高校進学率<br>（支援対象者）</p>
      </div>
    </div>
  </section>

  <section class="story">
    <h2 class="section-title" style="text-align:center">一人の少女のストーリー</h2>
    <p class="section-sub" style="text-align:center">支援が届いた先にある、小さな奇跡</p>
    <div class="story-content">
      <div class="story-img">📖</div>
      <p>美咲さん（仮名・14歳）は、母子家庭で育ちました。家計を支えるため、中学2年で塾を辞めざるを得なくなった彼女のもとに、「みどりの架け橋」の学習支援が届いたのは、その年の秋でした。</p>
      <p>週2回の無料学習教室に通い始めた美咲さんは、大学生ボランティアのお姉さんと出会い、少しずつ勉強への意欲を取り戻していきました。「自分にも、やればできることがあるんだ」——そう気づいた瞬間が、彼女の転機でした。</p>
      <p>1年後、美咲さんは第一志望の高校に合格。現在は将来の夢である看護師を目指して、日々勉強に励んでいます。あなたの支援が、こうした一人ひとりの未来をつくっています。</p>
    </div>
  </section>

  <section class="breakdown">
    <h2 class="section-title">寄付金の使いみち</h2>
    <p class="section-sub">いただいた支援は、透明性を持って運用しています</p>
    <div class="breakdown-list">
      <div class="breakdown-item">
        <span class="breakdown-label">学習支援事業</span>
        <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:55%;background:#4a7c59">55%</div></div>
        <span class="breakdown-pct">55%</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">奨学金給付</span>
        <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:25%;background:#6da67a">25%</div></div>
        <span class="breakdown-pct">25%</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">教材・備品</span>
        <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:12%;background:#8b7355">12%</div></div>
        <span class="breakdown-pct">12%</span>
      </div>
      <div class="breakdown-item">
        <span class="breakdown-label">運営費</span>
        <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:8%;background:#b8a88c">8%</div></div>
        <span class="breakdown-pct">8%</span>
      </div>
    </div>
  </section>

  <section class="options">
    <h2 class="section-title" style="text-align:center">支援の方法</h2>
    <p class="section-sub" style="text-align:center">あなたに合った形で、力を貸してください</p>
    <div class="option-grid">
      <div class="option-card">
        <div class="option-icon">💚</div>
        <h3>寄付で支援する</h3>
        <p>月1,000円から。マンスリーサポーターとして、子どもたちの学びを継続的に支えてください。</p>
        <a href="#" class="option-btn donate">マンスリーサポーターになる</a>
      </div>
      <div class="option-card">
        <div class="option-icon">🤝</div>
        <h3>ボランティアで支援</h3>
        <p>学習指導、イベント運営、翻訳など、あなたのスキルを活かして子どもたちを応援しませんか。</p>
        <a href="#" class="option-btn volunteer">ボランティアに申し込む</a>
      </div>
    </div>
  </section>

  <section class="partners">
    <h2 class="section-title">パートナー企業</h2>
    <p class="section-sub">多くの企業・団体にご支援いただいています</p>
    <div class="partner-logos">
      <span class="partner">みずほ財団</span>
      <span class="partner">Green Future Inc.</span>
      <span class="partner">学研ホールディングス</span>
      <span class="partner">NPO支援センター</span>
    </div>
  </section>

  <section class="newsletter">
    <h2>活動レポートを受け取る</h2>
    <p>月1回、子どもたちの成長や活動の最新情報をお届けします</p>
    <div class="newsletter-form">
      <input type="email" class="newsletter-input" placeholder="メールアドレス">
      <button class="newsletter-btn">登録する</button>
    </div>
  </section>

  <footer>
    <p>&copy; 2026 特定非営利活動法人 みどりの架け橋. All rights reserved.</p>
  </footer>
</body>
</html>`
  }
];
