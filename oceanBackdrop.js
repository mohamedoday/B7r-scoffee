/**
 * @module OceanBackdrop
 * @description Ambient luxury coastal wave particles & golden shimmer background.
 */
export function initOceanBackdrop(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = Array.from({ length: 48 }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2.2 + 0.6,
    speedY: -(Math.random() * 0.35 + 0.12),
    phase: i * 0.5,
    gold: i % 3 === 0
  }));

  function render(t) {
    ctx.clearRect(0, 0, width, height);

    // Subtle luxury horizon waves
    for (let w = 0; w < 3; w++) {
      ctx.beginPath();
      ctx.strokeStyle = w === 0 ? 'rgba(226, 184, 87, 0.08)' : 'rgba(92, 225, 230, 0.07)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= width; x += 24) {
        const y = height * (0.72 + w * 0.07) + Math.sin(x * 0.004 + t * 0.0008 + w) * 18;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Floating Golden & Bioluminescent Pearls
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += Math.sin(t * 0.001 + p.phase) * 0.25;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      ctx.beginPath();
      ctx.fillStyle = p.gold ? 'rgba(226, 184, 87, 0.35)' : 'rgba(92, 225, 230, 0.28)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
