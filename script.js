const canvas = document.querySelector('.scene-canvas');

if (canvas) {
  const context = canvas.getContext('2d');
  const DPR_LIMIT = 1.5;
  let width = 0;
  let height = 0;
  let groundY = 0;
  let rafId = 0;

  const palette = {
    stroke: 'rgba(255,255,255,0.74)',
    faint: 'rgba(255,255,255,0.16)',
    glow: 'rgba(255,255,255,0.08)',
    accent: 'rgba(255,255,255,0.28)',
  };

  const figures = [
    { x: 0.16, y: 0.785, scale: 0.96, motion: 'skate', speed: 1.04, phase: 0.25 },
    { x: 0.35, y: 0.8, scale: 1.02, motion: 'moneySeat', speed: 0.48, phase: 1.4 },
    { x: 0.61, y: 0.79, scale: 0.94, motion: 'guns', speed: 0.72, phase: 2.2 },
    { x: 0.84, y: 0.79, scale: 0.9, motion: 'bankWalk', speed: 0.86, phase: 0.75 },
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

  function drawSpeedLines(time) {
    context.strokeStyle = palette.glow;
    context.lineWidth = 1;
    for (let i = 0; i < 6; i += 1) {
      const y = height * (0.16 + i * 0.11) + Math.sin(time * 0.00028 + i * 0.8) * 10;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + Math.cos(time * 0.0003 + i) * 7);
      context.stroke();
    }
  }

  function drawCityBackdrop(time) {
    const drift = Math.sin(time * 0.00016) * 8;
    context.save();
    context.translate(0, drift);
    context.strokeStyle = palette.faint;
    context.lineWidth = 1;

    const blocks = [
      { x: 0.05, w: 0.06, top: 0.33 },
      { x: 0.12, w: 0.035, top: 0.39 },
      { x: 0.18, w: 0.06, top: 0.46 },
      { x: 0.76, w: 0.042, top: 0.33 },
      { x: 0.83, w: 0.06, top: 0.39 },
      { x: 0.92, w: 0.04, top: 0.46 },
    ];

    blocks.forEach(({ x, w, top }, index) => {
      const px = width * x;
      const pw = width * w;
      const py = height * top;
      context.strokeRect(px, py, pw, groundY - py - 24);
      for (let row = py + 22; row < groundY - 36; row += 26) {
        context.beginPath();
        context.moveTo(px + 10, row);
        context.lineTo(px + pw - 10, row);
        context.stroke();
      }

      if (index === 0 || index === 5) {
        context.beginPath();
        context.moveTo(px + pw * 0.2, py - 56);
        context.lineTo(px + pw * 0.5, py - 84);
        context.lineTo(px + pw * 0.8, py - 56);
        context.stroke();
      }
    });

    context.restore();
  }

  function drawBankScene(time) {
    const wobble = Math.sin(time * 0.0002) * 1.5;
    const bankX = width * 0.82;
    const bankY = height * 0.575 + wobble;

    context.save();
    context.translate(bankX, bankY);
    context.strokeStyle = palette.faint;
    context.lineWidth = 1.4;

    context.beginPath();
    context.moveTo(-134, 82);
    context.lineTo(134, 82);
    context.moveTo(-98, -8);
    context.lineTo(98, -8);
    context.moveTo(-114, -8);
    context.lineTo(0, -62);
    context.lineTo(114, -8);

    for (let i = -72; i <= 72; i += 36) {
      context.moveTo(i, -6);
      context.lineTo(i, 80);
    }

    context.moveTo(-90, 18);
    context.lineTo(90, 18);
    context.moveTo(-22, 82);
    context.lineTo(-22, 40);
    context.lineTo(22, 40);
    context.lineTo(22, 82);
    context.stroke();

    context.font = '16px Antonio, sans-serif';
    context.fillStyle = 'rgba(255,255,255,0.14)';
    context.fillText('BANK', -24, -24);
    context.restore();
  }

  function drawStreetProps(time) {
    const shimmer = Math.sin(time * 0.001) * 2;
    context.save();
    context.strokeStyle = palette.faint;
    context.lineWidth = 1.2;

    context.beginPath();
    context.moveTo(0, groundY);
    context.lineTo(width, groundY);
    context.moveTo(width * 0.08, groundY + 28);
    context.lineTo(width * 0.92, groundY + 22);
    context.moveTo(width * 0.12, groundY + 8);
    context.lineTo(width * 0.3, groundY + 10 + shimmer);
    context.moveTo(width * 0.44, groundY + 14);
    context.lineTo(width * 0.58, groundY + 12 - shimmer);
    context.moveTo(width * 0.68, groundY + 8);
    context.lineTo(width * 0.9, groundY + 10 + shimmer);
    context.stroke();

    context.beginPath();
    context.moveTo(width * 0.1, groundY - 110);
    context.lineTo(width * 0.1, groundY - 16);
    context.lineTo(width * 0.14, groundY - 16);
    context.moveTo(width * 0.48, groundY - 68);
    context.lineTo(width * 0.54, groundY - 118);
    context.lineTo(width * 0.6, groundY - 68);
    context.moveTo(width * 0.515, groundY - 92);
    context.lineTo(width * 0.565, groundY - 92);
    context.stroke();

    context.restore();
  }

  function drawMoneyBag(x, y, size, sway = 0) {
    context.beginPath();
    context.arc(x, y, size * 0.24, Math.PI * 0.12, Math.PI * 0.88);
    context.moveTo(x - size * 0.16, y - size * 0.16);
    context.lineTo(x, y - size * 0.3 - sway);
    context.lineTo(x + size * 0.16, y - size * 0.16);
    context.stroke();
  }

  function drawCashStack(x, y, size, spread = 0, layers = 3) {
    context.save();
    context.translate(x, y);
    for (let i = 0; i < layers; i += 1) {
      const offset = (i - (layers - 1) / 2) * spread;
      context.strokeRect(-size * 0.18 + offset, -size * 0.1 - i * 2, size * 0.36, size * 0.18);
      context.beginPath();
      context.moveTo(-size * 0.08 + offset, -i * 2);
      context.lineTo(size * 0.08 + offset, -i * 2);
      context.stroke();
    }
    context.restore();
  }

  function drawSpark(x, y, radius, scaleY = 1) {
    context.beginPath();
    context.moveTo(x - radius, y);
    context.lineTo(x + radius, y);
    context.moveTo(x, y - radius * scaleY);
    context.lineTo(x, y + radius * scaleY);
    context.stroke();
  }

  function drawMoneyPile(size) {
    drawCashStack(-size * 0.58, -size * 0.04, size * 1.08, 6, 4);
    drawCashStack(-size * 0.16, -size * 0.02, size * 1.16, 6, 4);
    drawCashStack(size * 0.26, -size * 0.08, size * 0.96, 5, 4);
    drawCashStack(size * 0.66, -size * 0.02, size * 0.82, 4, 3);
    drawMoneyBag(size * 0.76, -size * 0.2, size * 0.92, 0);
  }

  function drawStickFigure(figure, time) {
    const cycle = time * 0.002 * figure.speed + figure.phase;
    const baseX = width * figure.x;
    const baseY = height * figure.y;
    const size = 58 * figure.scale;
    const bob = Math.sin(cycle * 1.5) * 4;
    const lean = Math.sin(cycle) * 0.16;
    const armSwing = Math.sin(cycle * 2.3) * 0.9;
    const legSwing = Math.cos(cycle * 2.3) * 1.02;

    context.save();
    context.translate(baseX, baseY - bob);
    context.rotate(lean * 0.12);
    context.strokeStyle = palette.stroke;
    context.lineWidth = 1.8;
    context.lineCap = 'round';

    let leftArmX = -size * 0.26;
    let leftArmY = -size * 0.46 + armSwing * 5;
    let rightArmX = size * 0.3;
    let rightArmY = -size * 0.46 - armSwing * 5;
    let leftLegX = -size * 0.24;
    let leftLegY = size * 0.12 + legSwing * 6;
    let rightLegX = size * 0.24;
    let rightLegY = size * 0.12 - legSwing * 6;
    let bodyTop = -size * 0.74;
    let bodyBottom = -size * 0.28;

    if (figure.motion === 'moneySeat') {
      leftArmX = -size * 0.22;
      leftArmY = -size * 0.34;
      rightArmX = size * 0.28;
      rightArmY = -size * 0.3;
      leftLegX = -size * 0.34;
      leftLegY = size * 0.02;
      rightLegX = size * 0.36;
      rightLegY = size * 0.04;
      bodyTop = -size * 0.68;
      bodyBottom = -size * 0.12;
    }

    if (figure.motion === 'guns') {
      leftArmX = -size * 0.48;
      leftArmY = -size * 0.44;
      rightArmX = size * 0.54;
      rightArmY = -size * 0.4;
      leftLegX = -size * 0.18;
      rightLegX = size * 0.32;
    }

    if (figure.motion === 'bankWalk') {
      leftArmX = -size * 0.18;
      leftArmY = -size * 0.5;
      rightArmX = size * 0.34;
      rightArmY = -size * 0.24;
      leftLegX = -size * 0.16;
      rightLegX = size * 0.22;
    }

    context.beginPath();
    context.arc(0, -size * 0.9, size * 0.16, 0, Math.PI * 2);
    context.moveTo(0, bodyTop);
    context.lineTo(0, bodyBottom);
    context.moveTo(0, -size * 0.58);
    context.lineTo(leftArmX, leftArmY);
    context.moveTo(0, -size * 0.58);
    context.lineTo(rightArmX, rightArmY);
    context.moveTo(0, bodyBottom);
    context.lineTo(leftLegX, leftLegY);
    context.moveTo(0, bodyBottom);
    context.lineTo(rightLegX, rightLegY);

    if (figure.motion === 'skate') {
      context.moveTo(-size * 0.34, leftLegY);
      context.lineTo(-size * 0.06, leftLegY);
      context.moveTo(size * 0.08, rightLegY);
      context.lineTo(size * 0.38, rightLegY);
      context.moveTo(-size * 0.26, leftLegY + 4);
      context.quadraticCurveTo(-size * 0.18, leftLegY + 10, -size * 0.04, leftLegY + 4);
      context.moveTo(size * 0.12, rightLegY + 4);
      context.quadraticCurveTo(size * 0.22, rightLegY + 10, size * 0.36, rightLegY + 4);
      context.moveTo(-size * 0.54, size * 0.04);
      context.lineTo(-size * 0.82, 0);
      context.moveTo(size * 0.54, 0);
      context.lineTo(size * 0.86, -size * 0.06);
    }

    if (figure.motion === 'moneySeat') {
      drawMoneyPile(size);
      context.moveTo(-size * 0.38, size * 0.04);
      context.lineTo(size * 0.42, size * 0.04);
      drawSpark(size * 0.88, -size * 0.7, 4);
      drawSpark(-size * 0.8, -size * 0.5, 4);
    }

    if (figure.motion === 'guns') {
      context.moveTo(leftArmX, leftArmY);
      context.lineTo(leftArmX - size * 0.16, leftArmY - size * 0.02);
      context.moveTo(rightArmX, rightArmY);
      context.lineTo(rightArmX + size * 0.18, rightArmY + size * 0.01);
      drawSpark(leftArmX - size * 0.2, leftArmY - size * 0.02, 4, 0.7);
      drawSpark(rightArmX + size * 0.22, rightArmY + size * 0.01, 4, 0.7);
      context.beginPath();
      context.moveTo(size * 0.18, -size * 1.08);
      context.lineTo(size * 0.38, -size * 0.98);
      context.strokeStyle = palette.accent;
      context.stroke();
      context.strokeStyle = palette.stroke;
    }

    if (figure.motion === 'bankWalk') {
      context.moveTo(size * 0.32, -size * 0.2);
      context.lineTo(size * 0.58, -size * 0.04);
      drawMoneyBag(size * 0.54, -size * 0.02, size * 0.72, armSwing);
      context.beginPath();
      context.moveTo(size * 0.9, size * 0.1);
      context.lineTo(size * 1.16, size * 0.1);
      context.stroke();
    }

    context.stroke();
    context.restore();
  }

  function drawScene(time) {
    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#030303');
    gradient.addColorStop(0.55, '#070707');
    gradient.addColorStop(1, '#0b0b0b');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    drawSpeedLines(time);
    drawCityBackdrop(time);
    drawStreetProps(time);
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
