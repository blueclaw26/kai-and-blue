(() => {
  // 91mm x 55mm ratio, rendered at 2x for clarity
  const CARD_W = 728;
  const CARD_H = 440;
  const canvas = document.getElementById('card-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = CARD_W;
  canvas.height = CARD_H;

  let currentTemplate = 'classic';
  let currentColor = 'navy';
  let showBack = false;

  const colorSchemes = {
    navy:     { primary: '#1b2a4a', secondary: '#3a5a8a', accent: '#c8a960', bg: '#ffffff', text: '#1b2a4a', light: '#f0f2f5' },
    teal:     { primary: '#2a6b5e', secondary: '#4a9b8e', accent: '#e8a44a', bg: '#ffffff', text: '#2a4a42', light: '#eef7f5' },
    wine:     { primary: '#6b2a3a', secondary: '#9a4a5e', accent: '#d4a574', bg: '#ffffff', text: '#4a1a2a', light: '#f5eef0' },
    charcoal: { primary: '#333333', secondary: '#666666', accent: '#4a8f7f', bg: '#ffffff', text: '#1a1a1a', light: '#f0f0f0' },
    royal:    { primary: '#3a2a6b', secondary: '#6a5a9b', accent: '#c89a60', bg: '#ffffff', text: '#2a1a4a', light: '#f2eef7' }
  };

  const fields = {
    name:    document.getElementById('field-name'),
    title:   document.getElementById('field-title'),
    company: document.getElementById('field-company'),
    phone:   document.getElementById('field-phone'),
    email:   document.getElementById('field-email'),
    website: document.getElementById('field-website')
  };

  function getValues() {
    return {
      name:    fields.name.value,
      title:   fields.title.value,
      company: fields.company.value,
      phone:   fields.phone.value,
      email:   fields.email.value,
      website: fields.website.value
    };
  }

  function drawCard() {
    const v = getValues();
    const c = colorSchemes[currentColor];

    ctx.clearRect(0, 0, CARD_W, CARD_H);

    if (showBack) {
      drawBack(v, c);
    } else {
      switch (currentTemplate) {
        case 'classic': drawClassic(v, c); break;
        case 'modern':  drawModern(v, c); break;
        case 'minimal': drawMinimal(v, c); break;
        case 'creative': drawCreative(v, c); break;
      }
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawClassic(v, c) {
    // Background
    roundRect(0, 0, CARD_W, CARD_H, 12);
    ctx.fillStyle = c.bg;
    ctx.fill();

    // Top accent bar
    ctx.fillStyle = c.primary;
    roundRect(0, 0, CARD_W, 8, 0);
    ctx.fillRect(0, 0, CARD_W, 8);

    // Bottom line
    ctx.fillStyle = c.accent;
    ctx.fillRect(40, CARD_H - 50, CARD_W - 80, 2);

    // Company
    ctx.font = '600 22px "Noto Sans JP", sans-serif';
    ctx.fillStyle = c.primary;
    ctx.textAlign = 'left';
    ctx.fillText(v.company, 50, 70);

    // Name
    ctx.font = '700 36px "Noto Sans JP", sans-serif';
    ctx.fillStyle = c.text;
    ctx.fillText(v.name, 50, 160);

    // Title
    ctx.font = '400 18px "Noto Sans JP", sans-serif';
    ctx.fillStyle = c.secondary;
    ctx.fillText(v.title, 50, 195);

    // Contact info
    ctx.font = '400 16px Inter, sans-serif';
    ctx.fillStyle = c.text;
    let y = 270;
    if (v.phone) { ctx.fillText('📞  ' + v.phone, 50, y); y += 32; }
    if (v.email) { ctx.fillText('✉️  ' + v.email, 50, y); y += 32; }
    if (v.website) { ctx.fillText('🌐  ' + v.website, 50, y); }
  }

  function drawModern(v, c) {
    // Full background
    roundRect(0, 0, CARD_W, CARD_H, 12);
    ctx.fillStyle = c.primary;
    ctx.fill();

    // Right white section
    roundRect(CARD_W * 0.4, 0, CARD_W * 0.6, CARD_H, 0);
    ctx.fillStyle = c.bg;
    ctx.fillRect(CARD_W * 0.4, 0, CARD_W * 0.6, CARD_H);

    // Accent stripe
    ctx.fillStyle = c.accent;
    ctx.fillRect(CARD_W * 0.4, 0, 4, CARD_H);

    // Left side - Name & Title
    ctx.textAlign = 'left';
    ctx.font = '700 32px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(v.name, 40, 180);

    ctx.font = '400 16px "Noto Sans JP", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(v.title, 40, 215);

    // Right side - Company & Contact
    const rx = CARD_W * 0.4 + 40;
    ctx.fillStyle = c.primary;
    ctx.font = '600 20px "Noto Sans JP", sans-serif';
    ctx.fillText(v.company, rx, 80);

    ctx.font = '400 15px Inter, sans-serif';
    ctx.fillStyle = c.text;
    let y = 180;
    if (v.phone) { ctx.fillText(v.phone, rx, y); y += 32; }
    if (v.email) { ctx.fillText(v.email, rx, y); y += 32; }
    if (v.website) { ctx.fillText(v.website, rx, y); }
  }

  function drawMinimal(v, c) {
    // White background
    roundRect(0, 0, CARD_W, CARD_H, 12);
    ctx.fillStyle = c.bg;
    ctx.fill();

    // Thin top line
    ctx.fillStyle = c.primary;
    ctx.fillRect(50, 50, 60, 3);

    // Name centered
    ctx.textAlign = 'center';
    ctx.font = '600 34px "Noto Sans JP", sans-serif';
    ctx.fillStyle = c.text;
    ctx.fillText(v.name, CARD_W / 2, 160);

    // Title
    ctx.font = '400 16px "Noto Sans JP", sans-serif';
    ctx.fillStyle = c.secondary;
    ctx.fillText(v.title + '  |  ' + v.company, CARD_W / 2, 200);

    // Contact - centered row
    ctx.font = '400 14px Inter, sans-serif';
    ctx.fillStyle = c.text;
    const contactParts = [v.phone, v.email, v.website].filter(Boolean);
    ctx.fillText(contactParts.join('  ·  '), CARD_W / 2, 340);

    // Bottom thin line
    ctx.fillStyle = c.primary;
    ctx.fillRect(CARD_W - 110, CARD_H - 50, 60, 3);
  }

  function drawCreative(v, c) {
    // Background
    roundRect(0, 0, CARD_W, CARD_H, 12);
    ctx.fillStyle = c.primary;
    ctx.fill();

    // Decorative circles
    ctx.fillStyle = c.accent;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(CARD_W - 60, 60, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(80, CARD_H - 40, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Accent dot
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(60, 80, 8, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.textAlign = 'left';
    ctx.font = '700 38px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(v.name, 50, 165);

    // Title & Company
    ctx.font = '500 17px "Noto Sans JP", sans-serif';
    ctx.fillStyle = c.accent;
    ctx.fillText(v.title, 50, 205);
    ctx.font = '400 15px "Noto Sans JP", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(v.company, 50, 235);

    // Contact
    ctx.font = '400 14px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    let y = 320;
    if (v.phone) { ctx.fillText(v.phone, 50, y); y += 28; }
    if (v.email) { ctx.fillText(v.email, 50, y); y += 28; }
    if (v.website) { ctx.fillText(v.website, 50, y); }
  }

  function drawBack(v, c) {
    roundRect(0, 0, CARD_W, CARD_H, 12);
    ctx.fillStyle = c.primary;
    ctx.fill();

    // Company name large centered
    ctx.textAlign = 'center';
    ctx.font = '700 40px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(v.company, CARD_W / 2, CARD_H / 2 - 10);

    // Accent line
    ctx.fillStyle = c.accent;
    ctx.fillRect(CARD_W / 2 - 40, CARD_H / 2 + 15, 80, 3);

    // Website
    if (v.website) {
      ctx.font = '400 16px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(v.website, CARD_W / 2, CARD_H / 2 + 55);
    }
  }

  // Event listeners
  Object.values(fields).forEach(input => {
    input.addEventListener('input', drawCard);
  });

  document.querySelectorAll('.template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTemplate = btn.dataset.template;
      drawCard();
    });
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.dataset.color;
      drawCard();
    });
  });

  const toggleBtn = document.getElementById('toggle-side');
  toggleBtn.addEventListener('click', () => {
    showBack = !showBack;
    toggleBtn.textContent = showBack ? '表面を表示' : '裏面を表示';
    drawCard();
  });

  document.getElementById('export-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `business-card-${currentTemplate}-${showBack ? 'back' : 'front'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Initial render
  drawCard();
})();
