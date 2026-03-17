# Kai & Blue — Style Guide

サブエージェントへの指示時にこのファイルを参照させること。

## デザイントークン

- 背景: `#f7f6f3`（ウォームオフホワイト）
- テキスト: `#1a1a1a`（メイン）、`#6b6b6b`（サブ）
- アクセント: `#4a8f7f`（ティール）
- アンバー: `#e8a44a`（ongoing、アクセント用）
- フォント: `Inter` + `Noto Sans JP`（Google Fonts）
- カード: 白背景、`border-radius: 10px`、`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`

## アプリページ共通

### 📖 制作記録アイコン（必須）

CSS（`<style>`で`<head>`内に記述）:
```css
.docs-link{position:fixed;top:16px;right:16px;width:40px;height:40px;background:rgba(255,255,255,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.15);z-index:9999;transition:transform 0.2s,box-shadow 0.2s}
.docs-link:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,0.2)}
.docs-link::after{content:"制作記録";position:absolute;right:48px;background:#333;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity 0.2s}
.docs-link:hover::after{opacity:1}
```

HTML（`</body>`の直前）:
```html
<a href="../{app}-docs/" class="docs-link" title="制作記録">📖</a>
```

**ルール:**
- テキスト付き禁止（「📖 docs」「📖 制作記録」はNG）
- インラインstyle禁止
- onmouseover/onmouseout禁止
- 必ず`position:fixed`で右上固定

## ドキュメントページ共通

### 構造
```
{app}-docs/
├── index.html
└── style.css  ← journal-bot/style.cssをコピーして使う（term CSS含む）
```

### style.css に必須のCSS

journal-bot/style.cssの全内容をコピーすること。特に以下が含まれていることを確認:
- `.term` — 色、カーソル、破線下線
- `.term + .term::before` — `content: " / "`で区切り
- `.term:hover`
- `.term-explain` — 展開時の表示
- `@keyframes termSlide`
- `.tech-list a` — リンクスタイル

### 「ここで学ぶこと」のterm実装

HTML:
```html
<div class="learn">
  <span class="learn-label">ここで学ぶこと:</span>
  <span class="term" data-explain="1〜2文の解説">用語名</span>
  <span class="term" data-explain="1〜2文の解説">用語名</span>
</div>
```

JavaScript（`</body>`の直前、1ページに1回だけ）:
```html
<script>
document.querySelectorAll('.term').forEach(term => {
  term.addEventListener('click', () => {
    const existing = term.nextElementSibling;
    if (existing && existing.classList.contains('term-explain')) {
      existing.remove();
      return;
    }
    document.querySelectorAll('.term-explain').forEach(el => el.remove());
    const explain = document.createElement('div');
    explain.className = 'term-explain';
    explain.textContent = term.dataset.explain;
    term.parentNode.insertBefore(explain, term.nextSibling);
  });
});
</script>
```

**ルール:**
- JSは上記パターンのみ使用（parentNode.querySelector方式はNG）
- `term.nextElementSibling`で開閉判定
- `document.querySelectorAll('.term-explain')`で他の展開を全て閉じる
- elementは`div`で作る（`span`ではない）
- `insertBefore(explain, term.nextSibling)`でtermの直後に挿入

### 使用技術まとめ

- tech indexにエントリがある技術のみリンク付きで記載
- 概念・パターン・アルゴリズムは技術タグに入れない（「ここで学ぶこと」でカバー）
- リンク形式: `<a href="../tech/#id">技術名</a>`

### 禁止事項

- 公開ページに`tan`の表記禁止（`Kai`を使う）
- JACSの記載禁止（`Nature`を使う）
- 有機化学・触媒など分野を特定する記述禁止
- Pipedriveの記載禁止（`CRM`を使う）
- ビジネスモデルが推測できる用語禁止（弁済、新規/再契約等）

## ホームページ（index.html）

### プロジェクトカード

完了時の変更:
```html
<!-- Before -->
<div class="project-card" data-tooltip="...">
  <h3>プロジェクト名</h3>
  <span class="tag">技術タグ</span>
</div>

<!-- After -->
<a href="{app}/index.html" target="_blank" class="project-card done" data-tooltip="...">
  <h3>プロジェクト名</h3>
  <span class="tag">技術タグ</span>
</a>
```

- `div` → `a`に変更
- `target="_blank"`追加
- `done`クラス追加
- ongoingの場合は`<span class="badge">ongoing</span>`を削除

### data-tooltip

- 箇条書き形式: `・技術1 ・技術2 ・技術3`
- 「を学ぶ」等の文言不要
- 3〜6項目
