(() => {
  const canvas = document.getElementById("scene-canvas");
  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const figures = [];
  const baseFigureCount = Math.min(9, Math.max(6, Math.round(window.innerWidth / 190)));
  let animationFrame = 0;
  let width = 0;
  let height = 0;
  let deviceScale = 1;

  function resizeCanvas() {
    deviceScale = Math.min(window.devicePixelRatio || 1, 1.75);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * deviceScale);
    canvas.height = Math.floor(height * deviceScale);
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);
  }

  function createFigure(index) {
    const lane = index % 2;
    const side = index % 3;
    const typeCycle = ["skate", "run", "jump", "money", "stand", "skate", "run", "money", "jump"];
    const type = typeCycle[index % typeCycle.length];
    const leftZone = width * 0.08;
    const rightZone = width * 0.92;
    const centerPadding = width * 0.26;
    const x = side === 1
      ? leftZone + (index * 37) % Math.max(centerPadding - leftZone, 40)
      : width - centerPadding + (index * 53) % Math.max(rightZone - (width - centerPadding), 40);

    return {
      type,
      x,
      y: height * (lane === 0 ? 0.32 : 0.72) + ((index % 4) - 1.5) * 14,
      baseY: height * (lane === 0 ? 0.32 : 0.72) + ((index % 4) - 1.5) * 14,
      scale: 0.72 + (index % 4) * 0.08,
      speed: 0.12 + (index % 3) * 0.045,
      direction: side === 1 ? 1 : -1,
      phase: index * 0.9,
      drift: 18 + (index % 5) * 8,
      chalk: 0.45 + (index % 3) * 0.08,
      bagSwing: 0.6 + (index % 4) * 0.12
    };
  }

  function populateFigures() {
    figures.length = 0;
    for (let index = 0; index < baseFigureCount; index += 1) {
      figures.push(createFigure(index));
    }
  }

  function wrapFigure(figure) {
    const margin = 80;
    const centerStart = width * 0.34;
    const centerEnd = width * 0.66;

    if (figure.direction > 0 && figure.x > centerStart - margin) {
      figure.x = 18;
      figure.baseY = Math.random() > 0.5 ? height * 0.28 : height * 0.74;
    }

    if (figure.direction < 0 && figure.x < centerEnd + margin) {
      figure.x = width - 18;
      figure.baseY = Math.random() > 0.5 ? height * 0.28 : height * 0.74;
    }
  }

  function drawBankScene(time) {
    const glow = 0.04 + Math.sin(time * 0.00045) * 0.01;
    const bankWidth = Math.min(280, width * 0.22);
    const bankHeight = Math.min(160, height * 0.22);
    const bankX = width - bankWidth - 36;
    const bankY = height * 0.11;

    context.save();
    context.strokeStyle = `rgba(255, 255, 255, ${0.16 + glow})`;
    context.lineWidth = 1.25;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.moveTo(bankX, bankY + 24);
    context.lineTo(bankX + bankWidth / 2, bankY);
    context.lineTo(bankX + bankWidth, bankY + 24);
    context.moveTo(bankX + 18, bankY + 24);
    context.lineTo(bankX + bankWidth - 18, bankY + 24);
    context.stroke();

    const columnCount = 4;
    const gap = bankWidth / (columnCount + 1);
    for (let index = 1; index <= columnCount; index += 1) {
      const columnX = bankX + gap * index;
      context.beginPath();
      context.moveTo(columnX, bankY + 30);
      context.lineTo(columnX, bankY + bankHeight - 16);
      context.stroke();
    }

    context.beginPath();
    context.rect(bankX + 10, bankY + bankHeight - 16, bankWidth - 20, 18);
    context.stroke();

    context.font = '16px "Antonio", sans-serif';
    context.fillStyle = "rgba(255, 255, 255, 0.16)";
    context.fillText("BANK", bankX + bankWidth / 2 - 24, bankY + 56);
    context.restore();
  }

  function drawMoneyBag(x, y, scale, swing, direction, alpha) {
    context.save();
    context.translate(x, y);
    context.rotate(swing * 0.18 * direction);
    context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    context.lineWidth = 1.3;

    context.beginPath();
    context.moveTo(0, -8 * scale);
    context.quadraticCurveTo(9 * scale, -4 * scale, 8 * scale, 8 * scale);
    context.quadraticCurveTo(0, 14 * scale, -8 * scale, 8 * scale);
    context.quadraticCurveTo(-9 * scale, -4 * scale, 0, -8 * scale);
    context.moveTo(-4 * scale, -6 * scale);
    context.lineTo(4 * scale, -6 * scale);
    context.moveTo(0, -6 * scale);
    context.lineTo(0, 7 * scale);
    context.stroke();
    context.restore();
  }

  function drawStickFigure(figure, time) {
    const bob = Math.sin(time * 0.0025 + figure.phase) * figure.drift * 0.08;
    const travel = Math.sin(time * 0.0009 + figure.phase) * 0.6;
    figure.x += figure.speed * figure.direction * (prefersReducedMotion ? 0.15 : 1);
    wrapFigure(figure);

    const x = figure.x;
    const y = figure.baseY + bob;
    const scale = figure.scale;
    const stride = Math.sin(time * 0.008 * figure.speed * 20 + figure.phase);
    const armSwing = Math.cos(time * 0.008 * figure.speed * 20 + figure.phase);
    const jumpLift = figure.type === "jump" ? Math.abs(Math.sin(time * 0.003 + figure.phase)) * 16 : 0;
    const alpha = figure.chalk;

    context.save();
    context.translate(x, y - jumpLift + travel);
    context.scale(figure.direction, 1);
    context.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    context.lineWidth = 1.6;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.beginPath();
    context.arc(0, -20 * scale, 7 * scale, 0, Math.PI * 2);
    context.moveTo(0, -13 * scale);
    context.lineTo(0, 8 * scale);

    const armLift = figure.type === "jump" ? -8 : 0;
    context.moveTo(0, -5 * scale);
    context.lineTo(-12 * scale, 6 * scale + armSwing * 8 * scale + armLift);
    context.moveTo(0, -5 * scale);
    context.lineTo(12 * scale, 6 * scale - armSwing * 8 * scale + armLift);

    const legSpread = figure.type === "stand" ? 2 : 9;
    const leftLeg = stride * legSpread * scale;
    const rightLeg = -stride * legSpread * scale;
    context.moveTo(0, 8 * scale);
    context.lineTo(-10 * scale, 24 * scale + leftLeg);
    context.moveTo(0, 8 * scale);
    context.lineTo(10 * scale, 24 * scale + rightLeg);
    context.stroke();

    if (figure.type === "skate") {
      context.beginPath();
      context.moveTo(-16 * scale, 28 * scale);
      context.lineTo(16 * scale, 28 * scale);
      context.moveTo(-10 * scale, 28 * scale);
      context.lineTo(-6 * scale, 32 * scale);
      context.moveTo(10 * scale, 28 * scale);
      context.lineTo(6 * scale, 32 * scale);
      context.stroke();
    }

    if (figure.type === "money") {
      drawMoneyBag(16 * scale, 6 * scale, scale, armSwing * figure.bagSwing, 1, alpha);
    }

    if (figure.type === "run") {
      context.beginPath();
      context.moveTo(-4 * scale, -22 * scale);
      context.lineTo(3 * scale, -28 * scale);
      context.stroke();
    }

    context.restore();
  }

  function drawGroundLines() {
    context.save();
    context.strokeStyle = "rgba(255, 255, 255, 0.07)";
    context.lineWidth = 1;
    [height * 0.24, height * 0.5, height * 0.78].forEach((lineY) => {
      context.beginPath();
      context.moveTo(0, lineY);
      context.lineTo(width, lineY);
      context.stroke();
    });
    context.restore();
  }

  function render(time) {
    context.clearRect(0, 0, width, height);
    drawGroundLines();
    drawBankScene(time);
    figures.forEach((figure) => drawStickFigure(figure, time));

    if (!prefersReducedMotion) {
      animationFrame = window.requestAnimationFrame(render);
    }
  }

  function startScene() {
    resizeCanvas();
    populateFigures();
    window.cancelAnimationFrame(animationFrame);
    render(performance.now());
  }

  window.addEventListener("resize", startScene, { passive: true });
  startScene();
})();
