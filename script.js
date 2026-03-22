const canvas = document.querySelector('.scene-canvas');

if (canvas) {
  const context = canvas.getContext('2d');
  const DPR_LIMIT = 1.5;
  let width = 0;
  let height = 0;
  let groundY = 0;
  let rafId = 0;

  const palette = {
    stroke: 'rgba(255,255,255,0.7)',
    faint: 'rgba(255,255,255,0.18)',
    glow: 'rgba(255,255,255,0.08)',
  };

  const figures = [
    { x: 0.12, y: 0.72, scale: 0.8, motion: 'skate', speed: 1.0, phase: 0.4 },
    { x: 0.23, y: 0.76, scale: 0.74, motion: 'run', speed: 1.15, phase: 1.8 },
    { x: 0.78, y: 0.74, scale: 0.92, motion: 'jump', speed: 0.85, phase: 2.7 },
    { x: 0.87, y: 0.79, scale: 0.86, motion: 'bag', speed: 0.7, phase: 0.9 },
    { x: 0.68, y: 0.81, scale: 0.66, motion: 'idle', speed: 0.45, phase: 1.1 },
    { x: 0.32, y: 0.82, scale: 0.7, motion: 'idle', speed: 0.35, phase: 2.2 },
  ];

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    groundY = height * 0.82;
  }

  function drawBankScene(time) {
    const wobble = Math.sin(time * 0.00025) * 2;
    context.save();
    context.translate(width * 0.77, height * 0.58 + wobble);
    context.strokeStyle = palette.faint;
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(-120, 80);
    context.lineTo(120, 80);
    context.moveTo(-90, -10);
    context.lineTo(90, -10);
    context.moveTo(-102, -10);
    context.lineTo(0, -58);
    context.lineTo(102, -10);
    for (let i = -68; i <= 68; i += 34) {
      context.moveTo(i, -8);
      context.lineTo(i, 78);
    }
    context.stroke();
    context.font = '16px Antonio, sans-serif';
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillText('BANK', -22, -20);
    context.restore();
  }

  function drawGround(time) {
    context.strokeStyle = palette.faint;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, groundY);
    context.lineTo(width, groundY);
    context.moveTo(width * 0.04, groundY + 26);
    context.lineTo(width * 0.22, groundY + 26 + Math.sin(time * 0.001) * 3);
    context.moveTo(width * 0.66, groundY + 18);
    context.lineTo(width * 0.94, groundY + 18 + Math.cos(time * 0.0012) * 2);
    context.stroke();
  }

  function drawMoneyBag(x, y, size, sway) {
    context.beginPath();
    context.arc(x, y, size * 0.24, Math.PI * 0.15, Math.PI * 0.85);
    context.moveTo(x - size * 0.16, y - size * 0.16);
    context.lineTo(x, y - size * 0.3 - sway);
    context.lineTo(x + size * 0.16, y - size * 0.16);
    context.stroke();
  }

  function drawStickFigure(figure, time) {
    const cycle = time * 0.002 * figure.speed + figure.phase;
    const baseX = width * figure.x;
    const baseY = height * figure.y;
    const size = 56 * figure.scale;
    const bob = Math.sin(cycle * 1.7) * (figure.motion === 'jump' ? 12 : 4);
    const lean = Math.sin(cycle) * 0.18;
    const armSwing = Math.sin(cycle * 2.4) * 0.9;
    const legSwing = Math.cos(cycle * 2.4) * 1.0;

    context.save();
    context.translate(baseX, baseY - bob);
    context.rotate(lean * 0.15);
    context.strokeStyle = palette.stroke;
    context.lineWidth = 1.8;
    context.lineCap = 'round';

    context.beginPath();
    context.arc(0, -size * 0.9, size * 0.16, 0, Math.PI * 2);
    context.moveTo(0, -size * 0.74);
    context.lineTo(0, -size * 0.28);
    context.moveTo(0, -size * 0.58);
    context.lineTo(-size * 0.26, -size * 0.46 + armSwing * 5);
    context.moveTo(0, -size * 0.58);
    context.lineTo(size * 0.3, -size * 0.46 - armSwing * 5);
    context.moveTo(0, -size * 0.28);
    context.lineTo(-size * 0.24, size * 0.12 + legSwing * 6);
    context.moveTo(0, -size * 0.28);
    context.lineTo(size * 0.24, size * 0.12 - legSwing * 6);

    if (figure.motion === 'skate') {
      context.moveTo(-size * 0.34, size * 0.12 + legSwing * 6);
      context.lineTo(-size * 0.08, size * 0.12 + legSwing * 6);
      context.moveTo(size * 0.08, size * 0.12 - legSwing * 6);
      context.lineTo(size * 0.36, size * 0.12 - legSwing * 6);
    }

    if (figure.motion === 'bag') {
      drawMoneyBag(size * 0.38, -size * 0.36, size, armSwing * 2);
    }

    if (figure.motion === 'jump') {
      context.moveTo(-size * 0.38, -size * 0.98);
      context.lineTo(-size * 0.58, -size * 1.14);
      context.moveTo(size * 0.4, -size * 0.98);
      context.lineTo(size * 0.62, -size * 1.16);
    }

    context.stroke();
    context.restore();
  }

  function drawScene(time) {
    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#040404');
    gradient.addColorStop(1, '#0b0b0b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = palette.glow;
    context.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = height * (0.18 + i * 0.12) + Math.sin(time * 0.0003 + i) * 10;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + Math.cos(time * 0.00035 + i) * 8);
      context.stroke();
    }

    drawGround(time);
    drawBankScene(time);
    figures.forEach((figure) => drawStickFigure(figure, time));
    rafId = window.requestAnimationFrame(drawScene);
  }

  window.addEventListener('resize', resize);
  resize();
  rafId = window.requestAnimationFrame(drawScene);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(rafId);
      return;
    }
    rafId = window.requestAnimationFrame(drawScene);
  });
}
