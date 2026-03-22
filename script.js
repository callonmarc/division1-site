const canvas = document.querySelector('.scene-canvas');

if (canvas) {
  const context = canvas.getContext('2d');
  const DPR_LIMIT = 1.5;
  let width = 0;
  let height = 0;
  let groundY = 0;
  let rafId = 0;

  const palette = {
    stroke: 'rgba(255,255,255,0.76)',
    faint: 'rgba(255,255,255,0.18)',
    glow: 'rgba(255,255,255,0.08)',
  };

  const figures = [
    { x: 0.16, y: 0.76, scale: 0.88, motion: 'skate', speed: 1.05, phase: 0.4 },
    { x: 0.33, y: 0.8, scale: 0.84, motion: 'rich', speed: 0.6, phase: 1.1 },
    { x: 0.58, y: 0.81, scale: 0.72, motion: 'victim', speed: 0.45, phase: 2.4 },
    { x: 0.67, y: 0.79, scale: 0.82, motion: 'robber', speed: 0.95, phase: 1.8 },
    { x: 0.83, y: 0.77, scale: 0.92, motion: 'bag', speed: 0.7, phase: 0.9 },
    { x: 0.9, y: 0.74, scale: 0.78, motion: 'guard', speed: 0.5, phase: 2.7 },
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
    for (let i = 0; i < 7; i += 1) {
      const y = height * (0.14 + i * 0.1) + Math.sin(time * 0.0003 + i) * 10;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y + Math.cos(time * 0.00035 + i) * 8);
      context.stroke();
    }
  }

  function drawCityBackdrop(time) {
    const drift = Math.sin(time * 0.00018) * 8;
    context.save();
    context.translate(0, drift);
    context.strokeStyle = palette.faint;
    context.lineWidth = 1;

    const blocks = [0.05, 0.11, 0.18, 0.74, 0.81, 0.9];
    blocks.forEach((start, index) => {
      const x = width * start;
      const w = width * (index % 2 === 0 ? 0.06 : 0.04);
      const top = height * (0.3 + (index % 3) * 0.05);
      context.strokeRect(x, top, w, groundY - top - 30);
      for (let row = top + 20; row < groundY - 40; row += 24) {
        context.moveTo(x + 10, row);
        context.lineTo(x + w - 10, row);
      }
    });

    context.beginPath();
    context.moveTo(width * 0.02, height * 0.24);
    context.lineTo(width * 0.09, height * 0.16);
    context.lineTo(width * 0.16, height * 0.24);
    context.moveTo(width * 0.86, height * 0.22);
    context.lineTo(width * 0.93, height * 0.14);
    context.lineTo(width * 0.99, height * 0.22);
    context.stroke();
    context.restore();
  }

  function drawBankScene(time) {
    const wobble = Math.sin(time * 0.00025) * 2;
    context.save();
    context.translate(width * 0.8, height * 0.58 + wobble);
    context.strokeStyle = palette.faint;
    context.lineWidth = 1.4;
    context.beginPath();
    context.moveTo(-132, 82);
    context.lineTo(132, 82);
    context.moveTo(-96, -10);
    context.lineTo(96, -10);
    context.moveTo(-110, -10);
    context.lineTo(0, -64);
    context.lineTo(110, -10);
    for (let i = -72; i <= 72; i += 36) {
      context.moveTo(i, -8);
      context.lineTo(i, 80);
    }
    context.moveTo(-88, 16);
    context.lineTo(88, 16);
    context.moveTo(-22, 82);
    context.lineTo(-22, 42);
    context.lineTo(22, 42);
    context.lineTo(22, 82);
    context.stroke();

    context.font = '16px Antonio, sans-serif';
    context.fillStyle = 'rgba(255,255,255,0.15)';
    context.fillText('BANK', -24, -24);
    context.font = '11px Manrope, sans-serif';
    context.fillStyle = 'rgba(255,255,255,0.11)';
    context.fillText('NO CAMERAS / NO MERCY', -58, 104);
    context.restore();
  }

  function drawStreetProps(time) {
    const shimmer = Math.sin(time * 0.0012) * 2;
    context.save();
    context.strokeStyle = palette.faint;
    context.lineWidth = 1.2;

    context.beginPath();
    context.moveTo(0, groundY);
    context.lineTo(width, groundY);
    context.moveTo(width * 0.08, groundY + 30);
    context.lineTo(width * 0.92, groundY + 22);
    context.moveTo(width * 0.18, groundY + 10);
    context.lineTo(width * 0.3, groundY + 10 + shimmer);
    context.moveTo(width * 0.44, groundY + 14);
    context.lineTo(width * 0.56, groundY + 14 - shimmer);
    context.stroke();

    context.beginPath();
    context.moveTo(width * 0.12, groundY - 110);
    context.lineTo(width * 0.12, groundY - 14);
    context.lineTo(width * 0.16, groundY - 14);
    context.moveTo(width * 0.12, groundY - 98);
    context.lineTo(width * 0.09, groundY - 118);
    context.stroke();

    context.font = '14px Antonio, sans-serif';
    context.fillStyle = 'rgba(255,255,255,0.14)';
    context.fillText('D1', width * 0.103, groundY - 52);

    context.beginPath();
    context.moveTo(width * 0.48, groundY - 70);
    context.lineTo(width * 0.54, groundY - 118);
    context.lineTo(width * 0.6, groundY - 70);
    context.moveTo(width * 0.515, groundY - 94);
    context.lineTo(width * 0.565, groundY - 94);
    context.stroke();
    context.restore();
  }

  function drawMoneyBag(x, y, size, sway) {
    context.beginPath();
    context.arc(x, y, size * 0.24, Math.PI * 0.15, Math.PI * 0.85);
    context.moveTo(x - size * 0.16, y - size * 0.16);
    context.lineTo(x, y - size * 0.3 - sway);
    context.lineTo(x + size * 0.16, y - size * 0.16);
    context.stroke();
  }

  function drawCashStack(x, y, size, spread = 0) {
    context.save();
    context.translate(x, y);
    for (let i = 0; i < 3; i += 1) {
      const offset = (i - 1) * spread;
      context.strokeRect(-size * 0.18 + offset, -size * 0.1 - i * 2, size * 0.36, size * 0.18);
      context.beginPath();
      context.moveTo(-size * 0.08 + offset, -i * 2);
      context.lineTo(size * 0.08 + offset, -i * 2);
      context.stroke();
    }
    context.restore();
  }

  function drawSpark(x, y, radius) {
    context.beginPath();
    context.moveTo(x - radius, y);
    context.lineTo(x + radius, y);
    context.moveTo(x, y - radius);
    context.lineTo(x, y + radius);
    context.stroke();
  }

  function drawStickFigure(figure, time) {
    const cycle = time * 0.002 * figure.speed + figure.phase;
    const baseX = width * figure.x;
    const baseY = height * figure.y;
    const size = 58 * figure.scale;
    const jumpBob = figure.motion === 'guard' ? Math.sin(cycle * 1.7) * 10 : 0;
    const bob = Math.sin(cycle * 1.7) * 4 + jumpBob;
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

    let leftArmX = -size * 0.26;
    let leftArmY = -size * 0.46 + armSwing * 5;
    let rightArmX = size * 0.3;
    let rightArmY = -size * 0.46 - armSwing * 5;
    let leftLegX = -size * 0.24;
    let leftLegY = size * 0.12 + legSwing * 6;
    let rightLegX = size * 0.24;
    let rightLegY = size * 0.12 - legSwing * 6;

    if (figure.motion === 'robber') {
      rightArmX = -size * 0.22;
      rightArmY = -size * 0.34;
      leftArmX = -size * 0.42;
      leftArmY = -size * 0.22;
      leftLegX = -size * 0.18;
      rightLegX = size * 0.34;
    }

    if (figure.motion === 'victim') {
      leftArmX = -size * 0.38;
      leftArmY = -size * 0.72;
      rightArmX = size * 0.38;
      rightArmY = -size * 0.7;
    }

    if (figure.motion === 'rich') {
      leftArmX = -size * 0.16;
      leftArmY = -size * 0.52;
      rightArmX = size * 0.18;
      rightArmY = -size * 0.55;
    }

    if (figure.motion === 'guard') {
      leftArmX = -size * 0.35;
      rightArmX = size * 0.42;
      rightArmY = -size * 0.64;
    }

    context.moveTo(0, -size * 0.58);
    context.lineTo(leftArmX, leftArmY);
    context.moveTo(0, -size * 0.58);
    context.lineTo(rightArmX, rightArmY);
    context.moveTo(0, -size * 0.28);
    context.lineTo(leftLegX, leftLegY);
    context.moveTo(0, -size * 0.28);
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
      context.moveTo(-size * 0.52, size * 0.06);
      context.lineTo(-size * 0.8, size * 0.02);
      context.moveTo(size * 0.56, size * 0.02);
      context.lineTo(size * 0.86, -size * 0.04);
    }

    if (figure.motion === 'bag') {
      drawMoneyBag(size * 0.42, -size * 0.34, size, armSwing * 2);
    }

    if (figure.motion === 'rich') {
      drawCashStack(-size * 0.5, -size * 0.2, size * 0.95, 5);
      drawCashStack(size * 0.44, -size * 0.24, size * 0.78, 3);
      drawSpark(0, -size * 1.18, 5);
      drawSpark(-size * 0.54, -size * 0.56, 4);
      drawSpark(size * 0.58, -size * 0.62, 4);
    }

    if (figure.motion === 'robber') {
      drawMoneyBag(size * 0.36, -size * 0.06, size * 0.8, 1);
      context.moveTo(-size * 0.1, -size * 0.92);
      context.lineTo(size * 0.12, -size * 0.92);
    }

    if (figure.motion === 'victim') {
      drawCashStack(size * 0.48, -size * 0.08, size * 0.54, 2);
      drawSpark(-size * 0.04, -size * 1.14, 4);
    }

    if (figure.motion === 'guard') {
      context.moveTo(size * 0.42, -size * 0.64);
      context.lineTo(size * 0.62, -size * 0.92);
      context.moveTo(size * 0.42, -size * 0.64);
      context.lineTo(size * 0.72, -size * 0.62);
      drawSpark(size * 0.76, -size * 0.62, 4);
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
