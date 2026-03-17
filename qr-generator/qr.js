(() => {
  const input = document.getElementById('qr-input');
  const errorLevel = document.getElementById('error-level');
  const sizeSelect = document.getElementById('qr-size');
  const overlayInput = document.getElementById('overlay-input');
  const clearOverlayBtn = document.getElementById('clear-overlay');
  const generateBtn = document.getElementById('generate-btn');
  const downloadBtn = document.getElementById('download-btn');
  const canvas = document.getElementById('qr-canvas');
  const hint = document.getElementById('preview-hint');

  let overlayImage = null;

  overlayInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        overlayImage = img;
        clearOverlayBtn.style.display = 'inline-block';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  clearOverlayBtn.addEventListener('click', () => {
    overlayImage = null;
    overlayInput.value = '';
    clearOverlayBtn.style.display = 'none';
  });

  generateBtn.addEventListener('click', generate);

  // Generate on load with default text
  generate();

  function generate() {
    const text = input.value.trim();
    if (!text) return;

    const size = parseInt(sizeSelect.value);
    const level = errorLevel.value;

    // Use a temporary canvas for QRCode lib, then composite onto our canvas
    const tmpCanvas = document.createElement('canvas');

    QRCode.toCanvas(tmpCanvas, text, {
      width: size,
      margin: 2,
      errorCorrectionLevel: level,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff'
      }
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Draw QR code
      ctx.drawImage(tmpCanvas, 0, 0, size, size);

      // Draw overlay image in center
      if (overlayImage) {
        const overlaySize = Math.floor(size * 0.25);
        const x = Math.floor((size - overlaySize) / 2);
        const y = Math.floor((size - overlaySize) / 2);

        // White background for overlay area
        const padding = 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - padding, y - padding, overlaySize + padding * 2, overlaySize + padding * 2);

        ctx.drawImage(overlayImage, x, y, overlaySize, overlaySize);
      }

      canvas.style.display = 'block';
      hint.style.display = 'none';
      downloadBtn.disabled = false;
    });
  }

  downloadBtn.addEventListener('click', () => {
    const size = sizeSelect.value;
    const link = document.createElement('a');
    link.download = `qrcode-${size}x${size}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
})();
