// Roulette Module for "What to eat today?"
class LunchRoulette {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.items = [];
    this.currentRotation = 0;
    this.isSpinning = false;

    this.colors = [
      '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C',
      '#38D9A9', '#4DABF7', '#748FFC', '#9775FA',
      '#F06595', '#FF922B', '#20C997', '#4C6EF5'
    ];

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width - 24, 340);
    this.canvas.width = size * window.devicePixelRatio;
    this.canvas.height = size * window.devicePixelRatio;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.draw();
  }

  setItems(items) {
    this.items = items.length > 0 ? items : [{ name: '메뉴를 등록해주세요', category: '기타' }];
    this.draw();
  }

  draw() {
    if (!this.canvas) return;
    const size = parseFloat(this.canvas.style.width) || 300;
    const center = size / 2;
    const radius = center - 12;

    this.ctx.clearRect(0, 0, size, size);

    if (this.items.length === 0) return;

    const sliceAngle = (Math.PI * 2) / this.items.length;

    // Draw Outer glowing ring
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(center, center, radius + 6, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#FFA07A';
    this.ctx.lineWidth = 6;
    this.ctx.shadowColor = 'rgba(255, 107, 74, 0.4)';
    this.ctx.shadowBlur = 12;
    this.ctx.stroke();
    this.ctx.restore();

    // Draw slices
    for (let i = 0; i < this.items.length; i++) {
      const startAngle = this.currentRotation + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      this.ctx.beginPath();
      this.ctx.moveTo(center, center);
      this.ctx.arc(center, center, radius, startAngle, endAngle);
      this.ctx.closePath();

      this.ctx.fillStyle = this.colors[i % this.colors.length];
      this.ctx.fill();

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Draw text
      this.ctx.save();
      this.ctx.translate(center, center);
      this.ctx.rotate(startAngle + sliceAngle / 2);
      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px "Pretendard", "Noto Sans KR", sans-serif';
      this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
      this.ctx.shadowBlur = 4;

      const text = this.items[i].name || this.items[i];
      const displayText = text.length > 7 ? text.substring(0, 6) + '..' : text;
      this.ctx.fillText(displayText, radius - 16, 4);
      this.ctx.restore();
    }

    // Draw Center Knob
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(center, center, 24, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    this.ctx.shadowBlur = 8;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(center, center, 14, 0, Math.PI * 2);
    const grad = this.ctx.createLinearGradient(center - 14, center - 14, center + 14, center + 14);
    grad.addColorStop(0, '#FF6B4A');
    grad.addColorStop(1, '#FF3366');
    this.ctx.fillStyle = grad;
    this.ctx.fill();
    this.ctx.restore();
  }

  spin(onFinish) {
    if (this.isSpinning || this.items.length === 0) return;
    this.isSpinning = true;

    // Pick random winner
    const winningIndex = Math.floor(Math.random() * this.items.length);
    const sliceAngle = (Math.PI * 2) / this.items.length;

    // Target angle (top pointer is at 3 * PI / 2 or 270 deg)
    const targetSliceAngle = (3 * Math.PI) / 2 - (winningIndex * sliceAngle + sliceAngle / 2);
    const fullSpins = (5 + Math.floor(Math.random() * 4)) * (Math.PI * 2); // 5 to 8 full revolutions
    const totalRotation = this.currentRotation + fullSpins + (targetSliceAngle - (this.currentRotation % (Math.PI * 2)));

    const startRotation = this.currentRotation;
    const duration = 4000; // 4 seconds
    const startTime = performance.now();

    // Haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    const animateSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.currentRotation = startRotation + (totalRotation - startRotation) * easeOut;
      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        this.isSpinning = false;
        const winner = this.items[winningIndex];
        if (onFinish) onFinish(winner);
      }
    };

    requestAnimationFrame(animateSpin);
  }
}
