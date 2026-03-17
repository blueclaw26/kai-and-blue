const questions = [
  {
    q: "HTMLの略称は？",
    choices: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyper Transfer Mail Language"],
    answer: 0
  },
  {
    q: "APIとは何の略？",
    choices: ["Auto Program Interface", "Application Programming Interface", "Advanced Protocol Integration", "App Public Internet"],
    answer: 1
  },
  {
    q: "HTTPSの「S」が意味するものは？",
    choices: ["Speed", "Server", "Secure", "Simple"],
    answer: 2
  },
  {
    q: "CSSの役割として正しいのは？",
    choices: ["データを保存する", "見た目やレイアウトを定義する", "サーバーを動かす", "AIを学習させる"],
    answer: 1
  },
  {
    q: "「クラウド」とは実際には何？",
    choices: ["空の上にあるコンピュータ", "他の誰かのコンピュータ（サーバー）", "ワイヤレス通信の総称", "Googleの製品名"],
    answer: 1
  },
  {
    q: "GPTの「T」は何の略？",
    choices: ["Technology", "Transfer", "Transformer", "Training"],
    answer: 2
  },
  {
    q: "「フロントエンド」と「バックエンド」の違いは？",
    choices: ["速いか遅いか", "ユーザーに見える部分と見えない部分", "新しいか古いか", "有料か無料か"],
    answer: 1
  },
  {
    q: "JSONとは何？",
    choices: ["プログラミング言語", "データの書き方のフォーマット", "画像の圧縮形式", "Webブラウザの名前"],
    answer: 1
  },
  {
    q: "「デプロイ」とは？",
    choices: ["コードを削除すること", "バグを見つけること", "作ったものをサーバーに公開すること", "データをバックアップすること"],
    answer: 2
  },
  {
    q: "「localhost」とは？",
    choices: ["最も近いサーバー", "自分自身のコンピュータ", "Googleのサーバー", "Wi-Fiルーター"],
    answer: 1
  },
  {
    q: "LLM（大規模言語モデル）が実際にやっていることは？",
    choices: ["インターネットを検索している", "次に来る確率が高い単語を予測している", "人間のように考えている", "データベースから答えを引いている"],
    answer: 1
  },
  {
    q: "Gitの主な目的は？",
    choices: ["チャットをすること", "ファイルの変更履歴を管理すること", "Webサイトを作ること", "AIを動かすこと"],
    answer: 1
  },
  {
    q: "「レスポンシブデザイン」とは？",
    choices: ["反応が速いデザイン", "画面サイズに応じてレイアウトが変わるデザイン", "AIが自動で作るデザイン", "アニメーション付きのデザイン"],
    answer: 1
  },
  {
    q: "DNSの役割は？",
    choices: ["ウイルスを防ぐ", "ドメイン名をIPアドレスに変換する", "ファイルを圧縮する", "メールを送る"],
    answer: 1
  },
  {
    q: "「トークン」はAIの文脈で何を指す？",
    choices: ["ログイン用のパスワード", "テキストを分割した最小単位", "GPUの処理単位", "課金の単位"],
    answer: 1
  },
  {
    q: "CRUDとは？",
    choices: ["4つのプログラミング言語の略", "データの基本操作（作成・読取・更新・削除）", "セキュリティの4段階", "サーバーの種類"],
    answer: 1
  },
  {
    q: "「RAG」とは何の技術？",
    choices: ["画像生成", "外部データを検索してAIの回答に使う仕組み", "音声認識", "動画編集"],
    answer: 1
  },
  {
    q: "Webhookとは？",
    choices: ["Webサイトを攻撃する手法", "イベントが起きたら自動で通知を送る仕組み", "Webブラウザのプラグイン", "URLを短縮するサービス"],
    answer: 1
  },
  {
    q: "「プロンプト」とは、AIの文脈では？",
    choices: ["AIの学習データ", "AIへの指示や入力テキスト", "AIの出力結果", "AIのエラーメッセージ"],
    answer: 1
  },
  {
    q: "Vercelのようなサービスが提供するものは？",
    choices: ["AIモデルの学習環境", "Webサイトのホスティングとデプロイ", "ドメインの登録", "プログラミングの教育"],
    answer: 1
  }
];

let current = 0;
let score = 0;
let answered = false;

const questionText = document.getElementById('questionText');
const choicesEl = document.getElementById('choices');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const questionScreen = document.getElementById('questionScreen');
const resultScreen = document.getElementById('resultScreen');
const resultScore = document.getElementById('resultScore');
const resultMessage = document.getElementById('resultMessage');
const restartBtn = document.getElementById('restartBtn');

function renderQuestion() {
  answered = false;
  const q = questions[current];
  questionText.textContent = q.q;
  choicesEl.innerHTML = '';

  progressFill.style.width = ((current + 1) / questions.length * 100) + '%';
  progressText.textContent = (current + 1) + ' / ' + questions.length;

  q.choices.forEach((choice, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => handleAnswer(i, btn));
    choicesEl.appendChild(btn);
  });
}

function handleAnswer(selected, btn) {
  if (answered) return;
  answered = true;

  const q = questions[current];
  const buttons = choicesEl.querySelectorAll('.choice-btn');

  buttons.forEach(b => b.classList.add('disabled'));

  // Remove any previous feedback
  const oldFeedback = document.querySelector('.answer-feedback');
  if (oldFeedback) oldFeedback.remove();

  const feedback = document.createElement('div');
  feedback.className = 'answer-feedback';

  if (selected === q.answer) {
    btn.classList.add('correct');
    btn.textContent = '✓ ' + btn.textContent;
    score++;
    feedback.textContent = '正解！';
    feedback.classList.add('feedback-correct');
    // Confetti!
    if (typeof confetti === 'function') {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
  } else {
    btn.classList.add('wrong');
    btn.textContent = '✗ ' + btn.textContent;
    buttons[q.answer].classList.add('correct');
    buttons[q.answer].textContent = '✓ ' + buttons[q.answer].textContent;
    feedback.textContent = '不正解...';
    feedback.classList.add('feedback-wrong');
  }

  choicesEl.parentNode.appendChild(feedback);

  setTimeout(() => {
    current++;
    if (current < questions.length) {
      renderQuestion();
    } else {
      showResult();
    }
  }, 1000);
}

function showResult() {
  questionScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  const pct = Math.round((score / questions.length) * 100);
  resultScore.textContent = score + ' / ' + questions.length + '（' + pct + '%）';

  let msg;
  if (pct === 100) {
    msg = '完璧。あなたはもうエンジニアと対等に話せる。';
  } else if (pct >= 80) {
    msg = 'かなり詳しい。AIと一緒に仕事をする準備はできている。';
  } else if (pct >= 60) {
    msg = '基本はわかっている。もう少し深掘りすると面白くなる。';
  } else if (pct >= 40) {
    msg = '半分くらい。でも知らなかったことが見つかったのは収穫。';
  } else {
    msg = 'まだこれから。でもここに来た時点でスタートは切れている。';
  }

  resultMessage.textContent = msg;

  document.querySelector('.progress-wrapper').classList.add('hidden');
}

function restart() {
  current = 0;
  score = 0;
  answered = false;
  questionScreen.classList.remove('hidden');
  resultScreen.classList.add('hidden');
  document.querySelector('.progress-wrapper').classList.remove('hidden');
  renderQuestion();
}

restartBtn.addEventListener('click', restart);

renderQuestion();
